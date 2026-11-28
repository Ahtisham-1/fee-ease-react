import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeJwtPayload,
  inspectSessionToken,
  isTokenExpired,
  parseJwtRole,
} from "../src/utils/jwt";
import { createAuthApi } from "../src/services/authApi";
import { createStudentApi } from "../src/services/studentApi";
import { createFeeApi } from "../src/services/feeApi";
import { createPaymentApi } from "../src/services/paymentApi";
import { ApiError, type ApiClient, type JsonRequestInit } from "../src/services/apiClient";

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeJwt(
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: "HS256", typ: "JWT" },
): string {
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.c2lnX3BsYWNlaG9sZGVy`;
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
        throw new ApiError(`Invalid ${label} response from server.`, 0, "invalid_response");
      }
      return data as T[];
    },
    registerUnauthorizedHandler() {
      return () => {};
    },
  };
  return { client, calls };
}

test("decodeJwtPayload reads sub, role, exp from valid JWT even without global TextDecoder", () => {
  const token = makeJwt({
    sub: "parent+kashmir@example.com",
    role: "parent",
    exp: 1_900_000_000,
    note: "FeeEase — ₹1500 🌟",
  });

  const originalTextDecoder = globalThis.TextDecoder;
  // Simulate Hermes environments without TextDecoder.
  (globalThis as unknown as { TextDecoder?: unknown }).TextDecoder = undefined;
  try {
    const payload = decodeJwtPayload(token);
    assert.deepEqual(payload, {
      sub: "parent+kashmir@example.com",
      role: "parent",
      exp: 1_900_000_000,
    });
  } finally {
    globalThis.TextDecoder = originalTextDecoder;
  }
});

test("decodeJwtPayload rejects alg:none, malformed segments, invalid UTF-8, oversized JWTs, and prototype keys", () => {
  assert.equal(decodeJwtPayload(""), null);
  assert.equal(decodeJwtPayload("only.two"), null);
  assert.equal(decodeJwtPayload("a.b.c.d"), null);
  assert.equal(decodeJwtPayload("bad!.payload.c2ln"), null);
  assert.equal(decodeJwtPayload("a".repeat(8193)), null);

  // Reject alg: "none" and empty/1-char signature.
  assert.equal(
    decodeJwtPayload(makeJwt({ sub: "a@b.com", role: "parent", exp: 1900000000 }, { alg: "none" })),
    null,
  );
  assert.equal(
    decodeJwtPayload(`${toBase64Url(JSON.stringify({ alg: "HS256" }))}.${toBase64Url(JSON.stringify({ sub: "a@b.com" }))}.x`),
    null,
  );

  // Reject invalid UTF-8 byte sequence (0xff).
  const badUtf8Payload = Buffer.from([0x7b, 0xff, 0x7d])
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  assert.equal(
    decodeJwtPayload(`${toBase64Url(JSON.stringify({ alg: "HS256" }))}.${badUtf8Payload}.c2ln`),
    null,
  );

  // Reject __proto__ key smuggling inside JWT payload.
  const protoPayload = toBase64Url('{"sub":"a@b.com","role":"parent","__proto__":{"admin":true}}');
  assert.equal(
    decodeJwtPayload(`${toBase64Url(JSON.stringify({ alg: "HS256" }))}.${protoPayload}.c2ln`),
    null,
  );
});

test("isTokenExpired fails closed on past exp, missing exp, NaN, Infinity, and malformed tokens", () => {
  const now = 1_800_000_000;
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent", exp: now - 1 }), now), true);
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent", exp: now }), now), true);
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent", exp: now + 60 }), now), false);
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent" }), now), true);
  assert.equal(isTokenExpired(makeJwt({ sub: "a@b.com", role: "parent", exp: now + 60 }), Number.NaN), true);
  assert.equal(isTokenExpired("not-a-jwt", now), true);
});

test("parseJwtRole and inspectSessionToken enforce sub, valid role, and expiry", () => {
  const now = 1_800_000_000;
  const parentJwt = makeJwt({ sub: "p@example.com", role: "parent", exp: now + 600 });
  const adminJwt = makeJwt({ sub: "a@example.com", role: "admin", exp: now + 600 });
  const expiredJwt = makeJwt({ sub: "p@example.com", role: "parent", exp: now - 5 });
  const missingSubJwt = makeJwt({ role: "parent", exp: now + 600 });
  const missingExpJwt = makeJwt({ sub: "p@example.com", role: "parent" });
  const unknownRoleExpiredJwt = makeJwt({ sub: "x@example.com", role: "superadmin", exp: now - 5 });

  assert.equal(parseJwtRole(parentJwt), "parent");
  assert.equal(parseJwtRole(adminJwt), "admin");

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
  // Missing sub, missing exp, or unknown role must NOT masquerade as valid or expired.
  assert.deepEqual(inspectSessionToken(missingSubJwt, now), {
    valid: false,
    expired: false,
    role: null,
    email: null,
  });
  assert.deepEqual(inspectSessionToken(missingExpJwt, now), {
    valid: false,
    expired: false,
    role: null,
    email: null,
  });
  assert.deepEqual(inspectSessionToken(unknownRoleExpiredJwt, now), {
    valid: false,
    expired: false,
    role: null,
    email: null,
  });
});

test("authApi sends URLSearchParams for login, forces parent role on register, and validates responses", async () => {
  const validToken = makeJwt({ sub: "parent@example.com", role: "parent", exp: 2_000_000_000 });
  const { client, calls } = createMockClient((path) => {
    if (path === "/api/auth/login") {
      return { access_token: validToken, token_type: "bearer" };
    }
    if (path === "/api/auth/phone/verify-otp") {
      return { message: "Parent account linked successfully", Parent_id: 7 };
    }
    return { message: "ok" };
  });

  const authApi = createAuthApi(client);

  const loginRes = await authApi.loginApi("  Parent@Example.COM ", "secret123");
  assert.equal(loginRes.access_token, validToken);
  assert.equal(calls[0].options?.skipAuth, true);
  assert.ok(calls[0].options?.body instanceof URLSearchParams);
  assert.equal(calls[0].options?.body.get("username"), "parent@example.com");

  await authApi.registerApi("  New@Example.COM ", "StrongPass1");
  assert.deepEqual(calls[1].options?.body, {
    email: "new@example.com",
    password: "StrongPass1",
    role: "parent",
  });

  await authApi.verifyOtpApi(" New@Example.COM ", " 123456 ");
  assert.deepEqual(calls[2].options?.body, {
    email: "new@example.com",
    otp_code: "123456",
  });

  await authApi.sendPhoneOtpApi(" 9876543210 ");
  assert.deepEqual(calls[3].options?.body, { phone: "+919876543210" });

  const verifiedPhone = await authApi.verifyPhoneOtpApi("+91 98765-43210", " 654321 ");
  assert.deepEqual(calls[4].options?.body, { phone: "+919876543210", otp_code: "654321" });
  assert.equal(verifiedPhone.Parent_id, 7);
});

test("authApi validates bad local inputs and malformed server responses", async () => {
  const { client, calls } = createMockClient((path) => {
    if (path === "/api/auth/login") return { access_token: "bad token", token_type: "bearer" };
    return null;
  });
  const authApi = createAuthApi(client);

  await assert.rejects(() => authApi.loginApi("   ", "pass"), /email and password/i);
  await assert.rejects(() => authApi.loginApi("not-an-email", "pass"), /valid email/i);
  await assert.rejects(() => authApi.registerApi("parent@example.com", "   "), /email and password/i);
  await assert.rejects(() => authApi.registerApi("parent@example.com", "short"), /at least 6/i);
  await assert.rejects(() => authApi.verifyOtpApi("parent@example.com", "12ab56"), /6-digit/i);
  await assert.rejects(() => authApi.sendPhoneOtpApi("12345"), /mobile number/i);
  await assert.rejects(() => authApi.verifyPhoneOtpApi("9876543210", "12"), /6-digit/i);
  assert.equal(calls.length, 0);

  await assert.rejects(() => authApi.loginApi("parent@example.com", "secret"), /Invalid login response/i);
  await assert.rejects(() => authApi.registerApi("parent@example.com", "StrongPass1"), /Invalid auth response/i);
  await assert.rejects(() => authApi.sendPhoneOtpApi("9876543210"), /Invalid auth response/i);
});

test("studentApi, feeApi, and paymentApi map valid records and reject corrupted backend payloads", async () => {
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

  const students = await studentApi.getStudents({ page: 1, limit: 20, search: " Aarav " });
  assert.equal(calls[0].path, "/api/students/?page=1&limit=20&search=Aarav");
  assert.deepEqual(students[0], {
    id: "42",
    name: "Aarav Dar",
    parentId: "7",
    gradeName: "Class 6",
    hasTransport: true,
    transportFee: 500,
  });

  const fees = await feeApi.getFees();
  assert.equal(fees[0].feeAmount, 2000);

  const payments = await paymentApi.getPayments();
  assert.equal(payments[0].amount, 1500);

  await assert.rejects(() => studentApi.getStudents({ page: 0 }), /Invalid page number/i);
  await assert.rejects(() => studentApi.getStudents({ limit: 101 }), /Invalid page limit/i);

  // Corrupted payloads must throw ApiError(..., "invalid_response") instead of NaN/"undefined" leaks.
  const corruptStudentApi = createStudentApi(createMockClient(() => [null]).client);
  await assert.rejects(() => corruptStudentApi.getStudents(), ApiError);

  const corruptFeeApi = createFeeApi(
    createMockClient(() => [
      { id: 1, student_id: 2, fee_amount: -50, month: "April", academic_year: 2026, fee_type: "tuition", fee_status: "pending" },
    ]).client,
  );
  await assert.rejects(() => corruptFeeApi.getFees(), ApiError);

  const corruptPaymentApi = createPaymentApi(
    createMockClient(() => [
      { id: 1, amount: Number.NaN, date_time: "2026-04-05T10:00:00Z", status: "SUCCESS", student_id: 2 },
    ]).client,
  );
  await assert.rejects(() => corruptPaymentApi.getPayments(), ApiError);
});

test("paymentApi.sendPayment validates inputs, strips extra fields, and checks server response", async () => {
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
        amount: 2_147_483_648,
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
        amount: 2000,
        fee_id: 101,
        student_id: 42,
        date_time: "not-a-date",
        status: "SUCCESS",
      }),
    /timestamp/i,
  );
  assert.equal(calls.length, 0);

  const created = await paymentApi.sendPayment({
    amount: 2000,
    fee_id: 101,
    student_id: 42,
    date_time: " 2026-04-06T09:00:00Z ",
    status: "SUCCESS",
  });
  assert.equal(calls[0].path, "/api/payments/");
  assert.equal(created.id, "502");

  const emptyRespPaymentApi = createPaymentApi(createMockClient(() => null).client);
  await assert.rejects(
    () =>
      emptyRespPaymentApi.sendPayment({
        amount: 500,
        fee_id: 1,
        student_id: 2,
        date_time: "2026-04-06T09:00:00Z",
        status: "SUCCESS",
      }),
    (err: unknown) => err instanceof ApiError && err.code === "invalid_response",
  );
});
