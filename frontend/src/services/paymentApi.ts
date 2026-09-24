import type { Payment } from "../types";
import type { PaymentStatus } from "../types";

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

export async function getPayments(): Promise<Payment[]> {
  const response = await fetch("http://localhost:8000/api/payments");

  if (!response.ok) {
    throw new Error("Failed to fetch payments from the database");
  }
  const rawPayments: BackendPayment[] = await response.json();
  return rawPayments.map((p) => ({
    id: String(p.id),
    amount: Number(p.amount),
    dateTime: String(p.date_time),
    belongsTo: String(p.student_id),
    status: p.status as Payment["status"],
  }));
}

export async function sendPayment(data: NewPaymentData): Promise<Payment> {
  const response = await fetch(`http://localhost:8000/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to send Payment: ${response.statusText}`);
  }
  const sentPayment: BackendPayment = await response.json();

  return {
    id: String(sentPayment.id),
    amount: Number(sentPayment.amount),
    dateTime: String(sentPayment.date_time),
    belongsTo: String(sentPayment.student_id),
    status: sentPayment.status as BackendPayment["status"],
  };
}
