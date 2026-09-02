import type { FeeObligation, Payment } from "../types";
import { months } from "../data/mockData";

export interface StudentFinancialSummary {
  totalFees: number;
  totalAssigned: number;
  totalPaid: number;
  netBalance: number;
}

/**
 * Calculates total fees, total assigned, total paid, and net balance for a specific student.
 * Critical Rule: ONLY payments with status === "SUCCESS" are counted towards totalPaid!
 */
export function getStudentFinancialSummary(
  studentId: string,
  obligations: FeeObligation[],
  payments: Payment[]
): StudentFinancialSummary {
  const studentObligations = obligations.filter((o) => o.studentId === studentId);
  const studentSuccessfulPayments = payments.filter(
    (p) => p.belongsTo === studentId && p.status === "SUCCESS"
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

export interface KnockoutFeeItem extends FeeObligation {
  isCovered: boolean;
  paidAmount: number;
  remainingDue: number;
}

/**
 * The Strict FIFO Chronological Wallet Knockout Algorithm:
 * 1. Strictly sorts monthly fee obligations by Academic Year ASC, then Calendar Month ASC (Jan -> Dec).
 * 2. Deducts cash sequentially from the OLDEST unpaid month first (FIFO).
 * 3. Never touches subsequent months until the previous month's bill is 100% paid!
 * 4. Calculates exact paid amount, remaining due, and covered status on every month.
 */
export function calculateSequentialFeeKnockout(
  studentId: string,
  obligations: FeeObligation[],
  payments: Payment[]
): KnockoutFeeItem[] {
  const studentObligations = obligations.filter((o) => o.studentId === studentId);
  const studentSuccessfulPayments = payments.filter(
    (p) => p.belongsTo === studentId && p.status === "SUCCESS"
  );
  let remainingWallet = studentSuccessfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

  // Strict Chronological FIFO Sorting: (Academic Year ASC -> Calendar Month ASC)
  const chronologicalObligations = [...studentObligations].sort((obligationA, obligationB) => {
    // 1. Compare Academic Year
    const yearA = obligationA.academicYear || 0;
    const yearB = obligationB.academicYear || 0;
    if (yearA !== yearB) {
      return yearA - yearB;
    }

    // 2. Compare Calendar Month Order (January: 0 ... December: 11)
    const monthAIndex = months.indexOf(obligationA.month);
    const monthBIndex = months.indexOf(obligationB.month);

    return (monthAIndex !== -1 ? monthAIndex : 0) - (monthBIndex !== -1 ? monthBIndex : 0);
  });

  return chronologicalObligations.map((obligation) => {
    // Deduct strictly from this month first
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
