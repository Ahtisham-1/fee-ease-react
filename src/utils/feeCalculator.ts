import type { FeeObligation, Payment } from "../types";

export interface StudentFinancialSummary {
  totalFees: number;
  totalPaid: number;
  netBalance: number;
}

/**
 * Calculates total fees, total paid, and net balance for a specific student.
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
 * each bill as paid/pending based on total successful cash paid.
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
