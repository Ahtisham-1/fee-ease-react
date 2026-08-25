import type { FeeObligation, Payment } from "../types";

export interface StudentFinancialSummary {
  totalFees: number;
  totalPaid: number;
  netBalance: number;
}

/**
 * Calculates total fees, total paid, and net balance for a specific student.
 */
export function getStudentFinancialSummary(
  studentId: string,
  obligations: FeeObligation[],
  payments: Payment[]
): StudentFinancialSummary {
  const studentObligations = obligations.filter((o) => o.studentId === studentId);
  const studentPayments = payments.filter((p) => p.belongsTo === studentId);

  const totalFees = studentObligations.reduce((acc, curr) => acc + curr.feeAmount, 0);
  const totalPaid = studentPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = Math.max(0, totalFees - totalPaid);

  return {
    totalFees,
    totalPaid,
    netBalance,
  };
}

export interface KnockoutFeeItem extends FeeObligation {
  isCovered: boolean;
}

/**
 * The Sequential Wallet Knockout Algorithm:
 * Iterates through monthly fee obligations in chronological order and marks
 * each bill as paid/pending based on total paid cash.
 */
export function calculateSequentialFeeKnockout(
  studentObligations: FeeObligation[],
  totalPaid: number
): KnockoutFeeItem[] {
  let remainingWallet = totalPaid;

  return studentObligations.map((obligation) => {
    const isCovered = remainingWallet >= obligation.feeAmount;
    if (isCovered) {
      remainingWallet -= obligation.feeAmount;
    }

    return {
      ...obligation,
      isCovered,
      feeStatus: isCovered ? "paid" : "pending",
    };
  });
}
