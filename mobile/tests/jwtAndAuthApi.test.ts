import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeJwtPayload,
  inspectSessionToken,
  isTokenExpired,
  parseJwtRole,
} from "../src/utils/jwt.ts";
import { createAuthApi } from "../src/services/authApi.ts";
import { createStudentApi } from "../src/services/studentApi.ts";
import { createFeeApi } from "../src/services/feeApi.ts";
import { createPaymentApi } from "../src/services/paymentApi.ts";
import type { ApiClient, JsonRequestInit } from "../src/services/apiClient.ts";

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeJwt(payload: Record<string, unknown>, header: Record<string, unknown> = { alg: "HS256", typ: "JWT" }): string {
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.sig_placeholder`;
}

function createMockClient(
  handler: (path: string, options?: JsonRequestInit) => unknown,
): { client: ApiClient; calls: Array<{ path: string; options?: JsonRequestInit }> } {
  const calls: Array<{ path: string; options?: JsonRequestInit }> = [];
  const client: ApiClient = {
    API_BASE: "https://api.feeease.example.com",
    async requestJson<T>(path: string, options?: JsonRequestInit): Promise<T> {
      calls.push({ path, options });
      return handler(path, options) as T;
    },
    expectArray<T>(data: unknown, label: string): T[] {
      if (!Array.isArray(data)) {
        throw new Error(`Invalid ${label} response from server.`);
      }
      return data as T[];
    },
    registerUnauthorizedHandler() {
      return () => {};
    },
  };
  return { client, calls };
}

test("decodeJwtPayload reads sub, role, exp from valid base64url JWT including unicode", () => {
  const token = makeJwt({
    sub: "parent+kashmir@example.com",
    role: "parent",
    exp: 1_900_000_000,
    note: "FeeEase — Parent",
  });

  const payload = decodeJwtPayload(token);
  assert.deepEqual(payload, {
    sub: "parent+kashmir@example.com",
    role: "parent",
    exp: 1_900_000_000,
  });
});

test("decodeJwtPayload rejects malformed, non-3-part, non-base64url, or non-object payloads", () => {
  assert.equal(decodeJwtPayload(""), null);
  assert.equal(decodeJwtPayload("only.two"), null);
  assert.equal(decodeJwtPayload("a.b.c.d"), null);
  assert.equal(decodeJwtPayload("bad!.payload.sig"), null);
  assert.equal(
    decodeJwtPayload(`${toBase64Url("{}")}.${toBase64Url('"just-a-string"')}.sig`),
    null,
  );
});

test("isTokenExpired fails closed on past exp, missing exp, NaN, and malformed tokens", () => {
  const now = 1_800_000_000;
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent", exp: now - 1 }), now), true);
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent", exp: now }), now), true);
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent", exp: now + 60 }), now), false);
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent" }), now), true);
  assert.equal(isTokenExpired("not-a-jwt", now), true);
});

test("parseJwtRole and inspectSessionToken enforce valid roles and expiry fail-closed", () => {
  const now = 1_800_000_000;
  const parentJwt = makeJwt({ sub: "p@example.com", role: "parent", exp: now + 600 });
  const adminJwt = makeJwt({ sub: "a@example.com", role: "admin", exp: now + 600 });
  const expiredJwt = makeJwt({ sub: "p@example.com", role: "parent", exp: now - 5 });
  const unknownRoleJwt = makeJwt({ sub: "x@example.com", role: "superadmin", exp: now + 600 });

  assert.equal(parseJwtRole(parentJwt), "parent");
  assert.equal(parseJwtRole(adminJwt), "admin");
  assert.equal(parseJwtRole(unknownRoleJwt), null);

  assert.deepEqual(inspectSessionToken(parentJwt, now), {
    valid: true,
    expired: false,
    role: "parent",
    email: "p@example.com",
  });
  assert.deepEqual(inspectSessionToken(expiredJwt, now), {
    valid: false,
    expired: true,
    role: null,
    email: null,
  });
  assert.deepEqual(inspectSessionToken(unknownRoleJwt, now), {
    valid: false,
    expired: false,
    role: null,
    email: null,
  });
});

test("authApi sends URLSearchParams for login, forces parent role on register, and uses skipAuth cleanly", async () => {
  const validToken = makeJwt({ sub: "parent@example.com", role: "parent", exp: 2_000_000_000 });
  const { client, calls } = createMockClient((path) => {
    if (path === "/api/auth/login") {
      return { access_token: validToken, token_type: "bearer" };
    }
    return { message: "ok" };
  });

  const authApi = createAuthApi(client);

  const loginRes = await authApi.loginApi("  Parent@Example.COM ", "secret123");
  assert.equal(loginRes.access_token, validToken);
  assert.equal(calls[0].path, "/api/auth/login");
  assert.equal(calls[0].options?.method, "POST");
  assert.equal(calls[0].options?.skipAuth, true);
  assert.ok(calls[0].options?.body instanceof URLSearchParams);
  assert.equal(calls[0].options?.body.get("username"), "parent@example.com");
  assert.equal(calls[0].options?.body.get("password"), "secret123");

  await authApi.registerApi("  New@Example.COM ", "StrongPass1");
  assert.equal(calls[1].path, "/api/auth/register");
  assert.equal(calls[1].options?.skipAuth, true);
  assert.deepEqual(calls[1].options?.body, {
    email: "new@example.com",
    password: "StrongPass1",
    role: "parent",
  });

  await authApi.verifyOtpApi(" New@Example.COM ", " 123456 ");
  assert.equal(calls[2].path, "/api/auth/verify_otp");
  assert.equal(calls[2].options?.skipAuth, true);
  assert.deepEqual(calls[2].options?.body, {
    email: "new@example.com",
    otp_code: "123456",
  });

  await authApi.sendPhoneOtpApi(" 9876543210 ");
  assert.equal(calls[3].path, "/api/auth/phone/send-otp");
  assert.equal(calls[3].options?.skipAuth, undefined);
  assert.deepEqual(calls[3].options?.body, { phone: "9876543210" });

  await authApi.verifyPhoneOtpApi(" 9876543210 ", " 654321 ");
  assert.equal(calls[4].path, "/api/auth/phone/verify-otp");
  assert.deepEqual(calls[4].options?.body, { phone: "9876543210", otp_code: "654321" });
});

test("authApi rejects empty credentials locally and malformed access_token responses", async () => {
  const badTokenClient = createMockClient(() => ({ access_token: "bad token", token_type: "bearer" }));
  const authApi = createAuthApi(badTokenClient.client);

  await assert.rejects(() => authApi.loginApi("   ", "pass"), /email and password/i);
  await assert.rejects(() => authApi.loginApi("parent@example.com", ""), /email and password/i);
  assert.equal(badTokenClient.calls.length, 0);

  await assert.rejects(
    () => authApi.loginApi("parent@example.com", "secret"),
    /Invalid login response/i,
  );
});

test("studentApi, feeApi, and paymentApi map FastAPI snake_case fields cleanly", async () => {
  const { client, calls } = createMockClient((path) => {
    if (path.startsWith("/api/students/")) {
      return [
        {
          id: 42,
          student_name: "Aarav Dar",
          parent_id: 7,
          phone: "+919876543210",
          grade: "Class 6",
          tuition_fee: 1500,
          has_transport: true,
          transport_fee: 500,
        },
      ];
    }
    if (path === "/api/fees/") {
      return [
        {
          id: 101,
          student_id: 42,
          fee_amount: 2000,
          month: "April",
          academic_year: 2026,
          fee_type: "tuition+transport",
          fee_status: "pending",
        },
      ];
    }
    if (path === "/api/payments/") {
      return [
        {
          id: 501,
          amount: 1500,
          date_time: "2026-04-05T10:30:00Z",
          status: "SUCCESS",
          student_id: 42,
          fee_id: 101,
        },
      ];
    }
    throw new Error(`Unexpected path: ${path}`);
  });

  const studentApi = createStudentApi(client);
  const feeApi = createFeeApi(client);
  const paymentApi = createPaymentApi(client);

  const students = await studentApi.getStudents({ page: 1, limit: 20 });
  assert.equal(calls[0].path, "/api/students/?page=1&limit=20");
  assert.deepEqual(students, [
    {
      id: "42",
      name: "Aarav Dar",
      parentId: "7",
      gradeName: "Class 6",
      hasTransport: true,
      transportFee: 500,
    },
  ]);

  const fees = await feeApi.getFees();
  assert.deepEqual(fees, [
    {
      id: "101",
      studentId: "42",
      feeAmount: 2000,
      month: "April",
      academicYear: 2026,
      feeType: "tuition+transport",
      feeStatus: "pending",
    },
  ]);

  const payments = await paymentApi.getPayments();
  assert.deepEqual(payments, [
    {
      id: "501",
      amount: 1500,
      dateTime: "2026-04-05T10:30:00Z",
      belongsTo: "42",
      status: "SUCCESS",
    },
  ]);
});

test("paymentApi.sendPayment validates positive integer amount and maps response", async () => {
  const { client, calls } = createMockClient(() => ({
    id: 502,
    amount: 2000,
    date_time: "2026-04-06T09:00:00Z",
    status: "SUCCESS",
    student_id: 42,
    fee_id: 101,
  }));
  const paymentApi = createPaymentApi(client);

  await assert.rejects(
    () =>
      paymentApi.sendPayment({
        amount: 0,
        fee_id: 101,
        student_id: 42,
        date_time: "2026-04-06T09:00:00Z",
        status: "SUCCESS",
      }),
    /positive whole rupee amount/i,
  );
  await assert.rejects(
    () =>
      paymentApi.sendPayment({
        amount: 100.5,
        fee_id: 101,
        student_id: 42,
        date_time: "2026-04-06T09:00:00Z",
        status: "SUCCESS",
      }),
    /positive whole rupee amount/i,
  );
  assert.equal(calls.length, 0);

  const created = await paymentApi.sendPayment({
    amount: 2000,
    fee_id: 101,
    student_id: 42,
    date_time: "2026-04-06T09:00:00Z",
    status: "SUCCESS",
  });
  assert.equal(calls[0].path, "/api/payments/");
  assert.equal(calls[0].options?.method, "POST");
  assert.equal(created.id, "502");
  assert.equal(created.belongsTo, "42");
});
