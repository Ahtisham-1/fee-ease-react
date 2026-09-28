import type { Payment, PaymentStatus } from "../types";
import { expectArray, requestJson } from "./apiClient";

interface BackendPayment {
  id: number;
  amount: number;
  date_time: string;
  status: PaymentStatus;
  student_id: number;
  fee_id: number;
}

export interface NewPaymentData {
  amount: number;
  fee_id: number;
  student_id: number;
  date_time: string;
  status: string;
}

function mapPayment(p: BackendPayment): Payment {
  return {
    id: String(p.id),
    amount: Number(p.amount),
    dateTime: String(p.date_time),
    belongsTo: String(p.student_id),
    status: p.status as Payment["status"],
  };
}

export async function getPayments(): Promise<Payment[]> {
  const rawPayments = await requestJson<BackendPayment[]>("/api/payments");
  return expectArray<BackendPayment>(rawPayments, "payments").map(mapPayment);
}

export async function sendPayment(data: NewPaymentData): Promise<Payment> {
  const sentPayment = await requestJson<BackendPayment>("/api/payments", {
    method: "POST",
    body: data,
  });
  return mapPayment(sentPayment);
}
