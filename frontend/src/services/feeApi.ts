import type { FeeObligation, AssignFeesPayload } from "../types";

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
  const response = await fetch("http://localhost:8000/api/fees");
  if (!response.ok) {
    throw new Error("Failed to fetch fees from the database");
  }
  const rawFees: BackendFee[] = await response.json();
  return rawFees.map((f) => ({
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
  const response = await fetch("http://localhost:8000/api/fees/assign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_class: payload.targetClass,
      target_month: payload.targetMonth,
      assign_fees: payload.assignFees,
      academic_year: payload.academicYear,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to assign fees");
  }
  return response.json();
}