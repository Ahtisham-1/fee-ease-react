import assert from "node:assert/strict";
import test from "node:test";

import type { FeeObligation, Payment, Student } from "../src/types/index";
import {
  buildStudentLedgerViewModel,
  resolveActiveStudent,
} from "../src/utils/feeLedgerViewModel";

const STUDENT_A: Student = {
  id: "10",
  name: "Aarav Dar",
  parentId: "7",
  gradeName: "6th",
  hasTransport: true,
  transportFee: 500,
};

const STUDENT_B: Student = {
  id: "11",
  name: "Zoya Dar",
  parentId: "7",
  gradeName: "3rd",
  hasTransport: false,
  transportFee: 0,
};

const FEES: FeeObligation[] = [
  {
    id: "2",
    studentId: "10",
    feeAmount: 2000,
    month: "May",
    academicYear: 2026,
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
  {
    id: "1",
    studentId: "10",
    feeAmount: 1500,
    month: "April",
    academicYear: 2026,
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "3",
    studentId: "10",
    feeAmount: 2000,
    month: "June",
    academicYear: 2026,
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
];

test("resolveActiveStudent returns null on empty list, matches selected ID, and falls back to first student", () => {
  assert.equal(resolveActiveStudent([], "10"), null);
  assert.equal(resolveActiveStudent([STUDENT_A, STUDENT_B], "11")?.id, "11");
  assert.equal(resolveActiveStudent([STUDENT_A, STUDENT_B], "999")?.id, "10");
  assert.equal(resolveActiveStudent([STUDENT_A, STUDENT_B], "")?.id, "10");
});

test("buildStudentLedgerViewModel computes cleared, partial, and due rows chronologically", () => {
  const payments: Payment[] = [
    {
      id: "501",
      amount: 2200,
      dateTime: "2026-04-10T09:00:00Z",
      belongsTo: "10",
      status: "SUCCESS",
    },
    {
      id: "502",
      amount: 9999,
      dateTime: "2026-04-11T09:00:00Z",
      belongsTo: "10",
      status: "FAILED",
    },
  ];

  const vm = buildStudentLedgerViewModel(STUDENT_A, FEES, payments);

  assert.equal(vm.summary.totalAssignedFormatted, "₹5,500");
  assert.equal(vm.summary.totalPaidFormatted, "₹2,200");
  assert.equal(vm.summary.netBalanceFormatted, "₹3,300");
  assert.equal(vm.summary.netBalance, 3300);

  assert.equal(vm.settlementBanner?.variant, "warning");
  assert.match(vm.settlementBanner?.message ?? "", /3,300/);

  assert.equal(vm.rows.length, 3);

  // April 2026 (oldest) fully cleared
  assert.equal(vm.rows[0].title, "April 2026");
  assert.equal(vm.rows[0].feeTypeLabel, "Tuition Fee");
  assert.equal(vm.rows[0].status, "cleared");
  assert.equal(vm.rows[0].statusLabel, "Cleared");
  assert.equal(vm.rows[0].detailLine, null);

  // May 2026 partially paid (700 paid, 1300 remaining)
  assert.equal(vm.rows[1].title, "May 2026");
  assert.equal(vm.rows[1].feeTypeLabel, "Tuition + Bus Transport");
  assert.equal(vm.rows[1].status, "partial");
  assert.equal(vm.rows[1].statusLabel, "Partially Paid");
  assert.equal(vm.rows[1].detailLine, "Paid: ₹700 • Due: ₹1,300");

  // June 2026 completely due
  assert.equal(vm.rows[2].title, "June 2026");
  assert.equal(vm.rows[2].status, "due");
  assert.equal(vm.rows[2].statusLabel, "Due");
  assert.equal(vm.rows[2].detailLine, null);
});

test("buildStudentLedgerViewModel shows settled banner when all obligations are paid and null banner on 0 fees", () => {
  const emptyVm = buildStudentLedgerViewModel(STUDENT_B, FEES, []);
  assert.equal(emptyVm.rows.length, 0);
  assert.equal(emptyVm.summary.totalAssignedFormatted, "₹0");
  assert.equal(emptyVm.summary.totalPaidFormatted, "₹0");
  assert.equal(emptyVm.summary.netBalanceFormatted, "₹0");
  assert.equal(emptyVm.settlementBanner, null);

  const settledVm = buildStudentLedgerViewModel(STUDENT_A, FEES, [
    {
      id: "600",
      amount: 5500,
      dateTime: "2026-06-01T10:00:00Z",
      belongsTo: "10",
      status: "SUCCESS",
    },
  ]);
  assert.equal(settledVm.summary.netBalance, 0);
  assert.equal(settledVm.settlementBanner?.variant, "success");
  assert.match(settledVm.settlementBanner?.message ?? "", /Aarav Dar/);
  assert.ok(settledVm.rows.every((row) => row.status === "cleared"));
});
