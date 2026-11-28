import type { FeeObligation, Payment, PaymentAllocation } from "../types/index";
import { formatRupees } from "./format";

export const ACADEMIC_MONTHS: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const NORMALIZED_MONTH_INDEX = new Map<string, number>(
  ACADEMIC_MONTHS.map((month, index) => [month.toLowerCase(), index]),
);

export interface StudentFinancialSummary {
  totalFees: number;
  totalAssigned: number;
  totalPaid: number;
  netBalance: number;
}

export interface KnockoutFeeItem extends FeeObligation {
  isCovered: boolean;
  paidAmount: number;
  remainingDue: number;
}

function toSafeMoney(amount: number): number {
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0
    ? amount
    : 0;
}

function getMonthSortIndex(month: string): number {
  const key = typeof month === "string" ? month.trim().toLowerCase() : "";
  // Unknown months sort after December instead of masquerading as January (index 0).
  return NORMALIZED_MONTH_INDEX.get(key) ?? ACADEMIC_MONTHS.length;
}

function parseNumericId(id: string): number {
  if (typeof id !== "string") return Number.NaN;
  const trimmed = id.trim();
  return trimmed ? Number(trimmed) : Number.NaN;
}

function compareObligationsChronologically(
  a: FeeObligation,
  b: FeeObligation,
): number {
  // Missing/corrupt academic years sort last so they cannot consume oldest payments first.
  const yearA =
    typeof a.academicYear === "number" && Number.isFinite(a.academicYear)
      ? a.academicYear
      : Number.MAX_SAFE_INTEGER;
  const yearB =
    typeof b.academicYear === "number" && Number.isFinite(b.academicYear)
      ? b.academicYear
      : Number.MAX_SAFE_INTEGER;
  if (yearA !== yearB) {
    return yearA - yearB;
  }

  const monthDiff = getMonthSortIndex(a.month) - getMonthSortIndex(b.month);
  if (monthDiff !== 0) {
    return monthDiff;
  }

  const idA = parseNumericId(a.id);
  const idB = parseNumericId(b.id);
  if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) {
    return idA - idB;
  }
  const strA = typeof a.id === "string" ? a.id : "";
  const strB = typeof b.id === "string" ? b.id : "";
  return strA.localeCompare(strB);
}

/**
 * Calculates total assigned fees, total successful payments, and remaining net balance
 * for a single student. Failed payments are excluded.
 */
export function getStudentFinancialSummary(
  studentId: string,
  obligations: FeeObligation[],
  payments: Payment[],
): StudentFinancialSummary {
  const studentObligations = obligations.filter((o) => o.studentId === studentId);
  const studentSuccessfulPayments = payments.filter(
    (p) => p.belongsTo === studentId && p.status === "SUCCESS",
  );

  const totalFees = studentObligations.reduce(
    (acc, curr) => acc + toSafeMoney(curr.feeAmount),
    0,
  );
  const totalPaid = studentSuccessfulPayments.reduce(
    (acc, curr) => acc + toSafeMoney(curr.amount),
    0,
  );
  const netBalance = Math.max(0, totalFees - totalPaid);

  return {
    totalFees,
    totalAssigned: totalFees,
    totalPaid,
    netBalance,
  };
}

/**
 * Allocates successful payments chronologically (Academic Year ASC, Calendar Month ASC)
 * across a student's fee obligations to derive each month's paid and remaining balance.
 */
export function calculateSequentialFeeKnockout(
  studentId: string,
  obligations: FeeObligation[],
  payments: Payment[],
): KnockoutFeeItem[] {
  const studentObligations = obligations.filter((o) => o.studentId === studentId);
  const studentSuccessfulPayments = payments.filter(
    (p) => p.belongsTo === studentId && p.status === "SUCCESS",
  );
  let remainingWallet = studentSuccessfulPayments.reduce(
    (acc, curr) => acc + toSafeMoney(curr.amount),
    0,
  );

  const chronologicalObligations = [...studentObligations].sort(
    compareObligationsChronologically,
  );

  return chronologicalObligations.map((obligation) => {
    const safeFeeAmount = toSafeMoney(obligation.feeAmount);
    const allocatedToThisMonth = Math.min(remainingWallet, safeFeeAmount);
    remainingWallet -= allocatedToThisMonth;

    const remainingDue = safeFeeAmount - allocatedToThisMonth;
    const isCovered = remainingDue === 0;

    return {
      ...obligation,
      feeAmount: safeFeeAmount,
      isCovered,
      paidAmount: allocatedToThisMonth,
      remainingDue,
      feeStatus: isCovered ? "paid" : "pending",
    };
  });
}

/**
 * Splits a valid whole-rupee parent payment sequentially across oldest pending
 * FeeObligation IDs so each POST /api/payments/ call stays within remaining_due.
 * Callers submitting these allocations should still handle server 409/400 conflicts gracefully.
 */
export function buildFifoPaymentAllocations(
  studentId: string,
  obligations: FeeObligation[],
  payments: Payment[],
  paymentAmount: number,
): PaymentAllocation[] {
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new Error("Please enter a valid positive payment amount.");
  }
  if (!Number.isInteger(paymentAmount)) {
    throw new Error("Please enter a whole rupee amount without decimals.");
  }
  if (!Number.isSafeInteger(paymentAmount)) {
    throw new Error("Payment amount exceeds the supported maximum.");
  }

  const schedule = calculateSequentialFeeKnockout(studentId, obligations, payments);
  const netBalance = schedule.reduce((sum, item) => sum + item.remainingDue, 0);

  if (netBalance <= 0) {
    throw new Error("No pending fee balance remaining for this student.");
  }
  if (paymentAmount > netBalance) {
    throw new Error(
      `Payment amount cannot exceed the pending balance of ${formatRupees(netBalance)}.`,
    );
  }

  const allocations: PaymentAllocation[] = [];
  let remainingToAllocate = paymentAmount;

  for (const item of schedule) {
    if (remainingToAllocate <= 0) break;
    if (item.remainingDue <= 0) continue;

    const amountForFee = Math.min(remainingToAllocate, item.remainingDue);
    allocations.push({ feeId: item.id, amount: amountForFee });
    remainingToAllocate -= amountForFee;
  }

  return allocations;
}
