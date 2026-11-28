import type { Payment, PaymentStatus } from "../types/index.ts";
import {
  ApiError,
  expectArray,
  requestJson,
  type ApiClient,
} from "./apiClient.ts";

interface BackendPayment {
  id: number;
  amount: number;
  date_time: string;
  status: string;
  student_id: number;
  fee_id: number;
}

export interface NewPaymentData {
  amount: number;
  fee_id: number;
  student_id: number;
  date_time: string;
  status: PaymentStatus;
}

type PaymentClient = Pick<ApiClient, "requestJson" | "expectArray">;

const defaultPaymentClient: PaymentClient = {
  requestJson,
  expectArray,
};

function parsePaymentStatus(raw: unknown): PaymentStatus {
  if (raw === "SUCCESS" || raw === "FAILED") {
    return raw;
  }
  throw new ApiError(
    "Invalid payment status received from server.",
    0,
    "invalid_response",
  );
}

function mapPayment(p: BackendPayment): Payment {
  return {
    id: String(p.id),
    amount: Number(p.amount),
    dateTime: String(p.date_time ?? ""),
    belongsTo: String(p.student_id),
    status: parsePaymentStatus(p.status),
  };
}

export function createPaymentApi(client: PaymentClient = defaultPaymentClient) {
  async function getPayments(): Promise<Payment[]> {
    const rawPayments = await client.requestJson<BackendPayment[]>(
      "/api/payments/",
    );
    return client
      .expectArray<BackendPayment>(rawPayments, "payments")
      .map(mapPayment);
  }

  async function sendPayment(data: NewPaymentData): Promise<Payment> {
    if (!Number.isSafeInteger(data.amount) || data.amount <= 0) {
      throw new ApiError(
        "Payment must be a positive whole rupee amount.",
        400,
        "http",
      );
    }
    if (
      !Number.isSafeInteger(data.fee_id) ||
      data.fee_id <= 0 ||
      !Number.isSafeInteger(data.student_id) ||
      data.student_id <= 0
    ) {
      throw new ApiError("Invalid student or fee reference.", 400, "http");
    }
    if (typeof data.date_time !== "string" || !data.date_time.trim()) {
      throw new ApiError("Payment timestamp is required.", 400, "http");
    }

    const sentPayment = await client.requestJson<BackendPayment>(
      "/api/payments/",
      {
        method: "POST",
        body: data,
      },
    );
    return mapPayment(sentPayment);
  }

  return { getPayments, sendPayment };
}

const defaultPaymentApi = createPaymentApi();

export const getPayments = defaultPaymentApi.getPayments;
export const sendPayment = defaultPaymentApi.sendPayment;
