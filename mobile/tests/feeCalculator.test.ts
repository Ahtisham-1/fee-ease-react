import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFifoPaymentAllocations,
  calculateSequentialFeeKnockout,
  getStudentFinancialSummary,
} from "../src/utils/feeCalculator.ts";
import { formatRupees, formatTimestamp } from "../src/utils/format.ts";
import type { FeeObligation, Payment } from "../src/types/index.ts";

const sampleObligations: FeeObligation[] = [
  {
    id: "2",
    studentId: "10",
    feeAmount: 1500,
    month: "March",
    academicYear: 2026,
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "1",
    studentId: "10",
    feeAmount: 1500,
    month: "January",
    academicYear: 2026,
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
  {
    id: "3",
    studentId: "10",
    feeAmount: 2000,
    month: "January",
    academicYear: 2027,
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "99",
    studentId: "20",
    feeAmount: 5000,
    month: "January",
    academicYear: 2026,
    feeType: "tuition",
    feeStatus: "pending",
  },
];

const samplePayments: Payment[] = [
  {
    id: "p1",
    amount: 1000,
    dateTime: "2026-01-10T10:00:00Z",
    belongsTo: "10",
    status: "SUCCESS",
  },
  {
    id: "p2",
    amount: 9999,
    dateTime: "2026-01-12T10:00:00Z",
    belongsTo: "10",
    status: "FAILED",
  },
];

test("financial summary ignores failed payments and other students", () => {
  const summary = getStudentFinancialSummary("10", sampleObligations, samplePayments);

  assert.deepEqual(summary, {
    totalFees: 5000,
    totalAssigned: 5000,
    totalPaid: 1000,
    netBalance: 4000,
  });
});

test("fifo knockout sorts by academic year then calendar month", () => {
  const schedule = calculateSequentialFeeKnockout(
    "10",
    sampleObligations,
    samplePayments,
  );

  assert.deepEqual(
    schedule.map((item) => ({
      id: item.id,
      month: item.month,
      year: item.academicYear,
      paidAmount: item.paidAmount,
      remainingDue: item.remainingDue,
      isCovered: item.isCovered,
      feeStatus: item.feeStatus,
    })),
    [
      {
        id: "1",
        month: "January",
        year: 2026,
        paidAmount: 1000,
        remainingDue: 500,
        isCovered: false,
        feeStatus: "pending",
      },
      {
        id: "2",
        month: "March",
        year: 2026,
        paidAmount: 0,
        remainingDue: 1500,
        isCovered: false,
        feeStatus: "pending",
      },
      {
        id: "3",
        month: "January",
        year: 2027,
        paidAmount: 0,
        remainingDue: 2000,
        isCovered: false,
        feeStatus: "pending",
      },
    ],
  );
});

test("buildFifoPaymentAllocations splits payment across multiple pending months", () => {
  const twoMonthObligations: FeeObligation[] = [
    {
      id: "1",
      studentId: "10",
      feeAmount: 1500,
      month: "January",
      academicYear: 2026,
      feeType: "tuition",
      feeStatus: "pending",
    },
    {
      id: "2",
      studentId: "10",
      feeAmount: 1500,
      month: "February",
      academicYear: 2026,
      feeType: "tuition",
      feeStatus: "pending",
    },
  ];

  const allocations = buildFifoPaymentAllocations(
    "10",
    twoMonthObligations,
    [],
    2200,
  );

  assert.deepEqual(allocations, [
    { feeId: "1", amount: 1500 },
    { feeId: "2", amount: 700 },
  ]);
});

test("buildFifoPaymentAllocations accounts for prior partial payments", () => {
  const allocations = buildFifoPaymentAllocations(
    "10",
    sampleObligations,
    samplePayments,
    1200,
  );

  assert.deepEqual(allocations, [
    { feeId: "1", amount: 500 },
    { feeId: "2", amount: 700 },
  ]);
});

test("buildFifoPaymentAllocations rejects zero, negative, NaN, or over-balance amounts", () => {
  assert.throws(
    () => buildFifoPaymentAllocations("10", sampleObligations, samplePayments, 0),
    /positive/i,
  );
  assert.throws(
    () => buildFifoPaymentAllocations("10", sampleObligations, samplePayments, -50),
    /positive/i,
  );
  assert.throws(
    () => buildFifoPaymentAllocations("10", sampleObligations, samplePayments, Number.NaN),
    /positive/i,
  );
  assert.throws(
    () => buildFifoPaymentAllocations("10", sampleObligations, samplePayments, 4001),
    /exceed/i,
  );
});

test("formatRupees uses Indian numbering format", () => {
  assert.equal(formatRupees(150000), "₹1,50,000");
  assert.equal(formatRupees(0), "₹0");
});

test("formatTimestamp falls back to raw value on invalid date", () => {
  assert.equal(formatTimestamp("not-a-date"), "not-a-date");
  assert.notEqual(formatTimestamp("2026-01-10T10:00:00Z"), "");
});
