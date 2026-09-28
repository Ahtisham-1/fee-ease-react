import type { FeeObligation, AssignFeesPayload } from "../types";
import { expectArray, requestJson } from "./apiClient";

interface BackendFee {
  id: number;
  student_id: number;
  fee_amount: number;
  month: string;
  academic_year: number;
  fee_type: string;
  fee_status: string;
}

export async function getFees(): Promise<FeeObligation[]> {
  const rawFees = await requestJson<BackendFee[]>("/api/fees");
  return expectArray<BackendFee>(rawFees, "fees").map((f) => ({
    id: String(f.id),
    studentId: String(f.student_id),
    feeAmount: f.fee_amount,
    month: f.month,
    academicYear: f.academic_year,
    feeType: f.fee_type as FeeObligation["feeType"],
    feeStatus: f.fee_status as FeeObligation["feeStatus"],
  }));
}

export async function assignBulkFees(
  payload: AssignFeesPayload,
): Promise<{ message: string; count: number }> {
  return requestJson<{ message: string; count: number }>("/api/fees/assign", {
    method: "POST",
    body: {
      target_class: payload.targetClass,
      target_month: payload.targetMonth,
      assign_fees: payload.assignFees,
      academic_year: payload.academicYear,
    },
  });
}

/** Removes a single fee obligation via the existing DELETE /api/fees/{id} route. */
export async function deleteFee(feeId: string): Promise<void> {
  await requestJson<{ Ok: boolean }>(`/api/fees/${feeId}`, {
    method: "DELETE",
  });
}
