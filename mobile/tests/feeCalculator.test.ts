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

test("financial summary clamps netBalance to zero when paid exceeds total fees", () => {
  const overpaid: Payment[] = [
    {
      id: "p-over",
      amount: 6000,
      dateTime: "2026-01-10T10:00:00Z",
      belongsTo: "10",
      status: "SUCCESS",
    },
  ];
  const summary = getStudentFinancialSummary("10", sampleObligations, overpaid);
  assert.equal(summary.netBalance, 0);
});

test("fifo knockout sorts chronologically and marks fully covered months paid", () => {
  const paymentsCoveringJan: Payment[] = [
    {
      id: "p1",
      amount: 1800,
      dateTime: "2026-01-10T10:00:00Z",
      belongsTo: "10",
      status: "SUCCESS",
    },
  ];
  const schedule = calculateSequentialFeeKnockout(
    "10",
    sampleObligations,
    paymentsCoveringJan,
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
        paidAmount: 1500,
        remainingDue: 0,
        isCovered: true,
        feeStatus: "paid",
      },
      {
        id: "2",
        month: "March",
        year: 2026,
        paidAmount: 300,
        remainingDue: 1200,
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

  assert.deepEqual(
    buildFifoPaymentAllocations("10", twoMonthObligations, [], 2200),
    [
      { feeId: "1", amount: 1500 },
      { feeId: "2", amount: 700 },
    ],
  );
  assert.deepEqual(
    buildFifoPaymentAllocations("10", twoMonthObligations, [], 3000),
    [
      { feeId: "1", amount: 1500 },
      { feeId: "2", amount: 1500 },
    ],
  );
  assert.deepEqual(
    buildFifoPaymentAllocations("10", twoMonthObligations, [], 500),
    [{ feeId: "1", amount: 500 }],
  );
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

test("buildFifoPaymentAllocations rejects invalid, fractional, settled, or over-balance amounts", () => {
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
    () => buildFifoPaymentAllocations("10", sampleObligations, samplePayments, Number.POSITIVE_INFINITY),
    /positive/i,
  );
  assert.throws(
    () => buildFifoPaymentAllocations("10", sampleObligations, samplePayments, 100.5),
    /whole rupee/i,
  );
  assert.throws(
    () => buildFifoPaymentAllocations("10", sampleObligations, samplePayments, 4001),
    /exceed/i,
  );
  const fullySettled: Payment[] = [
    {
      id: "p-full",
      amount: 5000,
      dateTime: "2026-01-10T10:00:00Z",
      belongsTo: "10",
      status: "SUCCESS",
    },
  ];
  assert.throws(
    () => buildFifoPaymentAllocations("10", sampleObligations, fullySettled, 100),
    /no pending fee balance/i,
  );
});

test("formatRupees uses Indian numbering format", () => {
  assert.equal(formatRupees(150000), "₹1,50,000");
  assert.equal(formatRupees(0), "₹0");
});

test("formatTimestamp formats valid ISO strings and falls back on invalid dates", () => {
  assert.equal(formatTimestamp("not-a-date"), "not-a-date");
  const formatted = formatTimestamp("2026-01-10T10:00:00Z");
  assert.notEqual(formatted, "2026-01-10T10:00:00Z");
  assert.match(formatted, /2026/);
  assert.match(formatted, /Jan/);
});
