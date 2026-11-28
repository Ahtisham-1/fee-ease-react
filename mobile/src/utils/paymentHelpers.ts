import type { Payment } from "../types/index";
import { MAX_PG_INT } from "./validation";
import { formatRupees, formatTimestamp } from "./format";

export type PaymentValidationResult =
  | { valid: true; amount: number }
  | { valid: false; message: string };

export interface ReceiptRowViewModel {
  id: string;
  amountFormatted: string;
  timestampFormatted: string;
  isSuccess: boolean;
  statusLabel: "Success" | "Failed";
  failureNote: string | null;
}

/** Validates numeric payment input against whole-rupee and student net-balance bounds. */
export function validatePaymentInput(
  rawInput: string,
  netBalance: number,
): PaymentValidationResult {
  const cleaned =
    typeof rawInput === "string" ? rawInput.replace(/[\s,]/g, "") : "";

  if (!cleaned) {
    return {
      valid: false,
      message: "Please enter a valid positive payment amount.",
    };
  }

  if (netBalance <= 0) {
    return {
      valid: false,
      message: "No pending fee balance remaining for this student.",
    };
  }

  if (cleaned.startsWith("-")) {
    return {
      valid: false,
      message: "Please enter a valid positive payment amount.",
    };
  }

  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return {
      valid: false,
      message: "Please enter a valid positive payment amount.",
    };
  }

  if (cleaned.includes(".")) {
    return {
      valid: false,
      message: "Please enter a whole rupee amount without decimals.",
    };
  }

  const parsed = Number(cleaned);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return {
      valid: false,
      message: "Please enter a valid positive payment amount.",
    };
  }

  if (parsed > MAX_PG_INT) {
    return {
      valid: false,
      message: "Payment amount exceeds the supported maximum.",
    };
  }

  if (parsed > netBalance) {
    return {
      valid: false,
      message: `Payment amount cannot exceed the pending balance of ${formatRupees(netBalance)}.`,
    };
  }

  return { valid: true, amount: parsed };
}

function compareReceiptsNewestFirst(a: Payment, b: Payment): number {
  const timeA = Date.parse(a.dateTime);
  const timeB = Date.parse(b.dateTime);
  const validA = Number.isFinite(timeA);
  const validB = Number.isFinite(timeB);

  if (validA && validB && timeA !== timeB) {
    return timeB - timeA;
  }
  if (validA !== validB) {
    return validB ? 1 : -1;
  }

  const idA = Number(a.id);
  const idB = Number(b.id);
  if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) {
    return idB - idA;
  }

  return b.id.localeCompare(a.id);
}

/** Filters receipts to the selected child and sorts them newest-first. */
export function buildReceiptListViewModel(
  payments: readonly Payment[],
  studentId: string,
): ReceiptRowViewModel[] {
  if (!studentId) {
    return [];
  }

  return payments
    .filter((receipt) => receipt.belongsTo === studentId)
    .sort(compareReceiptsNewestFirst)
    .map((receipt) => {
      const isSuccess = receipt.status === "SUCCESS";
      return {
        id: receipt.id,
        amountFormatted: formatRupees(receipt.amount),
        timestampFormatted: formatTimestamp(receipt.dateTime),
        isSuccess,
        statusLabel: isSuccess ? "Success" : "Failed",
        failureNote: isSuccess
          ? null
          : "Declined by issuing bank • Balance not deducted",
      };
    });
}
