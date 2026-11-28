import type { FeeObligation, FeeStatus, FeeType } from "../types/index.ts";
import {
  ApiError,
  expectArray,
  requestJson,
  type ApiClient,
} from "./apiClient.ts";

interface BackendFee {
  id: number;
  student_id: number;
  fee_amount: number;
  month: string;
  academic_year: number;
  fee_type: string;
  fee_status: string;
}

type FeeClient = Pick<ApiClient, "requestJson" | "expectArray">;

const defaultFeeClient: FeeClient = {
  requestJson,
  expectArray,
};

function parseFeeType(raw: unknown): FeeType {
  if (raw === "tuition" || raw === "tuition+transport") {
    return raw;
  }
  throw new ApiError("Invalid fee type received from server.", 0, "invalid_response");
}

function parseFeeStatus(raw: unknown): FeeStatus {
  if (raw === "paid" || raw === "pending") {
    return raw;
  }
  throw new ApiError(
    "Invalid fee status received from server.",
    0,
    "invalid_response",
  );
}

function mapFee(f: BackendFee): FeeObligation {
  return {
    id: String(f.id),
    studentId: String(f.student_id),
    feeAmount: Number(f.fee_amount),
    month: String(f.month ?? ""),
    academicYear: Number(f.academic_year),
    feeType: parseFeeType(f.fee_type),
    feeStatus: parseFeeStatus(f.fee_status),
  };
}

export function createFeeApi(client: FeeClient = defaultFeeClient) {
  async function getFees(): Promise<FeeObligation[]> {
    const rawFees = await client.requestJson<BackendFee[]>("/api/fees/");
    return client.expectArray<BackendFee>(rawFees, "fees").map(mapFee);
  }

  return { getFees };
}

const defaultFeeApi = createFeeApi();

export const getFees = defaultFeeApi.getFees;
