import type { FeeObligation, Payment, Student } from "../types/index";
import {
  calculateSequentialFeeKnockout,
  getStudentFinancialSummary,
} from "./feeCalculator";
import { formatRupees } from "./format";

export type ObligationDisplayStatus = "cleared" | "partial" | "due";

export interface FeeRowViewModel {
  id: string;
  title: string;
  feeTypeLabel: string;
  feeAmountFormatted: string;
  status: ObligationDisplayStatus;
  statusLabel: string;
  detailLine: string | null;
}

export interface StudentLedgerViewModel {
  summary: {
    totalAssignedFormatted: string;
    totalPaidFormatted: string;
    netBalanceFormatted: string;
    netBalance: number;
  };
  settlementBanner: {
    variant: "success" | "warning";
    message: string;
  } | null;
  rows: FeeRowViewModel[];
}

/** Resolves the currently selected child, falling back to the first child when needed. */
export function resolveActiveStudent(
  students: readonly Student[],
  selectedStudentId: string,
): Student | null {
  if (students.length === 0) {
    return null;
  }
  return students.find((s) => s.id === selectedStudentId) ?? students[0];
}

/** Builds the parent Home ledger display model using Feature 2's pure FIFO math. */
export function buildStudentLedgerViewModel(
  student: Student,
  obligations: FeeObligation[],
  payments: Payment[],
): StudentLedgerViewModel {
  const { totalAssigned, totalPaid, netBalance } = getStudentFinancialSummary(
    student.id,
    obligations,
    payments,
  );
  const schedule = calculateSequentialFeeKnockout(
    student.id,
    obligations,
    payments,
  );

  const rows: FeeRowViewModel[] = schedule.map((item) => {
    const status: ObligationDisplayStatus = item.isCovered
      ? "cleared"
      : item.paidAmount > 0
        ? "partial"
        : "due";

    const statusLabel =
      status === "cleared"
        ? "Cleared"
        : status === "partial"
          ? "Partially Paid"
          : "Due";

    const detailLine =
      status === "partial"
        ? `Paid: ${formatRupees(item.paidAmount)} • Due: ${formatRupees(item.remainingDue)}`
        : null;

    return {
      id: item.id,
      title: `${item.month} ${item.academicYear}`,
      feeTypeLabel:
        item.feeType === "tuition+transport"
          ? "Tuition + Bus Transport"
          : "Tuition Fee",
      feeAmountFormatted: formatRupees(item.feeAmount),
      status,
      statusLabel,
      detailLine,
    };
  });

  let settlementBanner: StudentLedgerViewModel["settlementBanner"] = null;
  if (rows.length > 0 && netBalance === 0) {
    settlementBanner = {
      variant: "success",
      message: `All assigned fee obligations for ${student.name} are fully settled!`,
    };
  } else if (netBalance > 0) {
    settlementBanner = {
      variant: "warning",
      message: `Outstanding dues requiring payment: ${formatRupees(netBalance)}`,
    };
  }

  return {
    summary: {
      totalAssignedFormatted: formatRupees(totalAssigned),
      totalPaidFormatted: formatRupees(totalPaid),
      netBalanceFormatted: formatRupees(netBalance),
      netBalance,
    },
    settlementBanner,
    rows,
  };
}
