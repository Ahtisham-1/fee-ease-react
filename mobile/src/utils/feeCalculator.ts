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

  const totalFees = studentObligations.reduce((acc, curr) => acc + curr.feeAmount, 0);
  const totalPaid = studentSuccessfulPayments.reduce((acc, curr) => acc + curr.amount, 0);
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
    (acc, curr) => acc + curr.amount,
    0,
  );

  const chronologicalObligations = [...studentObligations].sort((a, b) => {
    const yearA = a.academicYear || 0;
    const yearB = b.academicYear || 0;
    if (yearA !== yearB) {
      return yearA - yearB;
    }

    const monthAIndex = ACADEMIC_MONTHS.indexOf(a.month);
    const monthBIndex = ACADEMIC_MONTHS.indexOf(b.month);

    return (monthAIndex !== -1 ? monthAIndex : 0) - (monthBIndex !== -1 ? monthBIndex : 0);
  });

  return chronologicalObligations.map((obligation) => {
    const allocatedToThisMonth = Math.min(remainingWallet, obligation.feeAmount);
    remainingWallet -= allocatedToThisMonth;

    const remainingDue = obligation.feeAmount - allocatedToThisMonth;
    const isCovered = remainingDue === 0;

    return {
      ...obligation,
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
