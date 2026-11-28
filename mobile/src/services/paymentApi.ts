import type { Payment, PaymentStatus } from "../types/index";
import {
  expectRecord,
  isRecord,
  MAX_PG_INT,
  parsePositiveInt,
  parsePositiveIntId,
  parseStringField,
} from "../utils/validation";
import { ApiError, expectArray, requestJson, type ApiClient } from "./apiClient";

export interface NewPaymentData {
  amount: number;
  fee_id: number;
  student_id: number;
  date_time: string;
  status: PaymentStatus;
}

export interface PaymentApi {
  getPayments(): Promise<Payment[]>;
  sendPayment(data: NewPaymentData): Promise<Payment>;
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

function mapPayment(raw: unknown): Payment {
  const p = expectRecord(raw, "payment");
  return {
    id: parsePositiveIntId(p.id, "payment"),
    amount: parsePositiveInt(p.amount, "amount"),
    dateTime: parseStringField(p.date_time, "date_time", true),
    belongsTo: parsePositiveIntId(p.student_id, "student"),
    status: parsePaymentStatus(p.status),
  };
}

export function createPaymentApi(
  client: PaymentClient = defaultPaymentClient,
): PaymentApi {
  async function getPayments(): Promise<Payment[]> {
    const rawPayments = await client.requestJson<unknown>("/api/payments/");
    return client.expectArray<unknown>(rawPayments, "payments").map(mapPayment);
  }

  async function sendPayment(data: NewPaymentData): Promise<Payment> {
    if (!isRecord(data)) {
      throw new ApiError("Invalid payment payload.", 400, "validation");
    }
    if (
      !Number.isSafeInteger(data.amount) ||
      data.amount <= 0 ||
      data.amount > MAX_PG_INT
    ) {
      throw new ApiError(
        "Payment must be a positive whole rupee amount.",
        400,
        "validation",
      );
    }
    if (
      !Number.isSafeInteger(data.fee_id) ||
      data.fee_id <= 0 ||
      data.fee_id > MAX_PG_INT ||
      !Number.isSafeInteger(data.student_id) ||
      data.student_id <= 0 ||
      data.student_id > MAX_PG_INT
    ) {
      throw new ApiError(
        "Invalid student or fee reference.",
        400,
        "validation",
      );
    }
    if (typeof data.date_time !== "string" || !data.date_time.trim()) {
      throw new ApiError("Payment timestamp is required.", 400, "validation");
    }
    const trimmedDateTime = data.date_time.trim();
    if (!Number.isFinite(Date.parse(trimmedDateTime))) {
      throw new ApiError(
        "Invalid payment timestamp format.",
        400,
        "validation",
      );
    }

    if (data.status !== "SUCCESS" && data.status !== "FAILED") {
      throw new ApiError("Invalid payment status.", 400, "validation");
    }

    const payload: NewPaymentData = {
      amount: data.amount,
      fee_id: data.fee_id,
      student_id: data.student_id,
      date_time: trimmedDateTime,
      status: data.status,
    };

    const sentPayment = await client.requestJson<unknown>("/api/payments/", {
      method: "POST",
      body: payload,
    });
    return mapPayment(sentPayment);
  }

  return { getPayments, sendPayment };
}

const defaultPaymentApi = createPaymentApi();

export const getPayments = defaultPaymentApi.getPayments;
export const sendPayment = defaultPaymentApi.sendPayment;
