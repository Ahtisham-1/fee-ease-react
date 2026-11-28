import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "../src/services/apiClient";
import type { NewPaymentData } from "../src/services/paymentApi";
import type { FeeObligation, Payment, Student } from "../src/types/index";
import {
  createSchoolDataController,
  resolveSelectedStudentId,
  type SchoolDataState,
} from "../src/context/schoolDataController";

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const STUDENT_1: Student = {
  id: "10",
  name: "Aarav Dar",
  parentId: "7",
  gradeName: "6th",
  hasTransport: true,
  transportFee: 500,
};

const STUDENT_2: Student = {
  id: "11",
  name: "Zoya Dar",
  parentId: "7",
  gradeName: "3rd",
  hasTransport: false,
  transportFee: 0,
};

const FEE_1: FeeObligation = {
  id: "101",
  studentId: "10",
  feeAmount: 2000,
  month: "April",
  academicYear: 2026,
  feeType: "tuition+transport",
  feeStatus: "pending",
};

const PAYMENT_1: Payment = {
  id: "501",
  amount: 500,
  dateTime: "2026-04-05T10:00:00Z",
  belongsTo: "10",
  status: "SUCCESS",
};

test("resolveSelectedStudentId handles empty list, preserves valid selection, and falls back to first student", () => {
  assert.equal(resolveSelectedStudentId([], "10"), "");
  assert.equal(resolveSelectedStudentId([STUDENT_1, STUDENT_2], "11"), "11");
  assert.equal(resolveSelectedStudentId([STUDENT_1, STUDENT_2], "999"), "10");
  assert.equal(resolveSelectedStudentId([STUDENT_1, STUDENT_2], ""), "10");
});

test("schoolDataController starts unlinked (empty), then refreshData loads linked children in memory", async () => {
  let linked = false;
  const states: SchoolDataState[] = [];

  const controller = createSchoolDataController({
    getStudents: async () => (linked ? [STUDENT_1, STUDENT_2] : []),
    getFees: async () => (linked ? [FEE_1] : []),
    getPayments: async () => (linked ? [PAYMENT_1] : []),
    onStateChange: (next) => states.push(next),
  });

  const stop = controller.start();
  await flushMicrotasks();

  assert.equal(controller.getState().isLoading, false);
  assert.equal(controller.getState().isRefreshing, false);
  assert.equal(controller.getState().error, null);
  assert.deepEqual(controller.getState().students, []);
  assert.equal(controller.getState().selectedStudentId, "");

  // Simulate backend linking User.parent_id via Phone OTP verification.
  linked = true;
  const ok = await controller.refreshData();
  assert.equal(ok, true);

  const afterLink = controller.getState();
  assert.equal(afterLink.isLoading, false);
  assert.equal(afterLink.isRefreshing, false);
  assert.equal(afterLink.error, null);
  assert.deepEqual(afterLink.students, [STUDENT_1, STUDENT_2]);
  assert.deepEqual(afterLink.fees, [FEE_1]);
  assert.deepEqual(afterLink.payments, [PAYMENT_1]);
  assert.equal(afterLink.selectedStudentId, "10");

  controller.setSelectedStudentId("11");
  assert.equal(controller.getState().selectedStudentId, "11");

  // Refresh keeps user-chosen studentId when still present.
  await controller.refreshData();
  assert.equal(controller.getState().selectedStudentId, "11");

  // Ignores invalid studentId selection.
  controller.setSelectedStudentId("nonexistent");
  assert.equal(controller.getState().selectedStudentId, "11");

  stop();
});

test("schoolDataController ignores stale out-of-order responses and disposed updates", async () => {
  let resolveFirstStudents!: (value: Student[]) => void;
  let resolveSecondStudents!: (value: Student[]) => void;
  let callCount = 0;

  const controller = createSchoolDataController({
    getStudents: () => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise((resolve) => {
          resolveFirstStudents = resolve;
        });
      }
      return new Promise((resolve) => {
        resolveSecondStudents = resolve;
      });
    },
    getFees: async () => [FEE_1],
    getPayments: async () => [PAYMENT_1],
    onStateChange: () => {},
  });

  const stop = controller.start();
  const refreshPromise = controller.refreshData();

  // Resolve newer refresh first, then let older initial fetch resolve late.
  resolveSecondStudents([STUDENT_2]);
  const ok = await refreshPromise;
  assert.equal(ok, true);
  assert.deepEqual(controller.getState().students, [STUDENT_2]);

  resolveFirstStudents([STUDENT_1]);
  await flushMicrotasks();
  assert.deepEqual(controller.getState().students, [STUDENT_2]);
  assert.equal(controller.getState().selectedStudentId, "11");

  // After dispose, even an incoming refresh never commits further state.
  stop();
  const lateRefresh = await controller.refreshData();
  assert.equal(lateRefresh, false);
});

test("schoolDataController surfaces ApiError and preserves prior linked data if refresh fails", async () => {
  let shouldFail = false;

  const controller = createSchoolDataController({
    getStudents: async () => {
      if (shouldFail) {
        throw new ApiError("Unable to reach server.", 0, "network");
      }
      return [STUDENT_1];
    },
    getFees: async () => [FEE_1],
    getPayments: async () => [],
    onStateChange: () => {},
  });

  const stop = controller.start();
  await flushMicrotasks();
  assert.deepEqual(controller.getState().students, [STUDENT_1]);

  shouldFail = true;
  const ok = await controller.refreshData();
  assert.equal(ok, false);
  assert.equal(controller.getState().isRefreshing, false);
  assert.equal(controller.getState().error, "Unable to reach server.");
  // Keep previously loaded data visible when a background refresh fails.
  assert.deepEqual(controller.getState().students, [STUDENT_1]);

  stop();
});

test("schoolDataController.processPayment splits multi-month payments FIFO sequentially and refreshes data", async () => {
  const feeApr: FeeObligation = {
    id: "101",
    studentId: "10",
    feeAmount: 1500,
    month: "April",
    academicYear: 2026,
    feeType: "tuition",
    feeStatus: "pending",
  };
  const feeMay: FeeObligation = {
    id: "102",
    studentId: "10",
    feeAmount: 1500,
    month: "May",
    academicYear: 2026,
    feeType: "tuition",
    feeStatus: "pending",
  };
  const serverPayments: Payment[] = [];
  const sentCalls: NewPaymentData[] = [];
  let refreshCount = 0;

  const controller = createSchoolDataController({
    getStudents: async () => [STUDENT_1],
    getFees: async () => [feeMay, feeApr],
    getPayments: async () => {
      refreshCount += 1;
      return [...serverPayments];
    },
    sendPayment: async (data) => {
      sentCalls.push(data);
      const created: Payment = {
        id: String(700 + sentCalls.length),
        amount: data.amount,
        dateTime: data.date_time,
        belongsTo: String(data.student_id),
        status: data.status,
      };
      serverPayments.push(created);
      return created;
    },
    onStateChange: () => {},
  });

  const stop = controller.start();
  await flushMicrotasks();

  await controller.processPayment(2200);

  assert.equal(sentCalls.length, 2);
  assert.equal(sentCalls[0].fee_id, 101);
  assert.equal(sentCalls[0].amount, 1500);
  assert.equal(sentCalls[0].student_id, 10);
  assert.equal(sentCalls[0].status, "SUCCESS");

  assert.equal(sentCalls[1].fee_id, 102);
  assert.equal(sentCalls[1].amount, 700);
  assert.equal(sentCalls[1].student_id, 10);
  assert.equal(sentCalls[1].status, "SUCCESS");

  assert.equal(refreshCount, 2);
  assert.equal(controller.getState().payments.length, 2);
  assert.equal(controller.getState().isProcessingPayment, false);

  stop();
});

test("schoolDataController.processPayment guards double-submit and always refreshes on partial failure", async () => {
  const feeApr: FeeObligation = {
    id: "101",
    studentId: "10",
    feeAmount: 1500,
    month: "April",
    academicYear: 2026,
    feeType: "tuition",
    feeStatus: "pending",
  };
  const feeMay: FeeObligation = {
    id: "102",
    studentId: "10",
    feeAmount: 1500,
    month: "May",
    academicYear: 2026,
    feeType: "tuition",
    feeStatus: "pending",
  };
  const serverPayments: Payment[] = [];
  let releaseFirst!: () => void;
  let callIndex = 0;

  const controller = createSchoolDataController({
    getStudents: async () => [STUDENT_1],
    getFees: async () => [feeApr, feeMay],
    getPayments: async () => [...serverPayments],
    sendPayment: async (data) => {
      callIndex += 1;
      if (callIndex === 1) {
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
        const created: Payment = {
          id: "801",
          amount: data.amount,
          dateTime: data.date_time,
          belongsTo: String(data.student_id),
          status: data.status,
        };
        serverPayments.push(created);
        return created;
      }
      throw new ApiError("Server rejected second chunk.", 400, "http");
    },
    onStateChange: () => {},
  });

  const stop = controller.start();
  await flushMicrotasks();

  const firstAttempt = controller.processPayment(2200);
  assert.equal(controller.getState().isProcessingPayment, true);

  // Overlapping concurrent payment attempt must be rejected synchronously.
  await assert.rejects(() => controller.processPayment(500), /already in progress/i);

  releaseFirst();
  await assert.rejects(
    () => firstAttempt,
    /1 of 2.*Server rejected second chunk/i,
  );

  // Server truth from the 1st succeeded chunk must be synced in memory even after 2nd chunk failed.
  assert.equal(controller.getState().isProcessingPayment, false);
  assert.equal(controller.getState().payments.length, 1);
  assert.equal(controller.getState().payments[0].amount, 1500);

  stop();
});

test("schoolDataController.processPayment skips post-error refresh on 401 unauthorized", async () => {
  let fetchCalls = 0;

  const controller = createSchoolDataController({
    getStudents: async () => {
      fetchCalls += 1;
      return [STUDENT_1];
    },
    getFees: async () => [FEE_1],
    getPayments: async () => [],
    sendPayment: async () => {
      throw new ApiError("Unauthorized", 401, "http");
    },
    onStateChange: () => {},
  });

  const stop = controller.start();
  await flushMicrotasks();
  assert.equal(fetchCalls, 1);

  await assert.rejects(
    () => controller.processPayment(500),
    (err: unknown) => err instanceof ApiError && err.status === 401,
  );
  // 401 triggers session sign-out via apiClient; finally must not fire redundant reloads.
  assert.equal(fetchCalls, 1);
  assert.equal(controller.getState().isProcessingPayment, false);

  stop();
});

test("schoolDataController.processPayment populates error and resets isProcessingPayment when post-payment refresh fails", async () => {
  let studentCalls = 0;

  const controller = createSchoolDataController({
    getStudents: async () => {
      studentCalls += 1;
      if (studentCalls > 1) {
        throw new ApiError("Network timeout during refresh", 0, "network");
      }
      return [STUDENT_1];
    },
    getFees: async () => [FEE_1],
    getPayments: async () => [],
    sendPayment: async (payload) => ({
      id: "801",
      amount: payload.amount,
      dateTime: payload.date_time,
      belongsTo: String(payload.student_id),
      status: payload.status,
    }),
    onStateChange: () => {},
  });

  const stop = controller.start();
  await flushMicrotasks();

  await controller.processPayment(500);

  const finalState = controller.getState();
  assert.equal(finalState.isProcessingPayment, false);
  assert.equal(finalState.isRefreshing, false);
  assert.match(finalState.error ?? "", /Network timeout during refresh/);

  stop();
});
