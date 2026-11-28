import type { FeeObligation, FeeStatus, FeeType } from "../types/index.ts";
import {
  expectRecord,
  parseNonNegativeInt,
  parsePositiveInt,
  parsePositiveIntId,
  parseStringField,
} from "../utils/validation.ts";
import { ApiError, expectArray, requestJson, type ApiClient } from "./apiClient.ts";

export interface FeeApi {
  getFees(): Promise<FeeObligation[]>;
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
  throw new ApiError(
    "Invalid fee type received from server.",
    0,
    "invalid_response",
  );
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

function mapFee(raw: unknown): FeeObligation {
  const f = expectRecord(raw, "fee");
  const academicYear = parsePositiveInt(f.academic_year, "academic_year", 2100);
  if (academicYear < 2000) {
    throw new ApiError(
      "Invalid academic_year received from server.",
      0,
      "invalid_response",
    );
  }

  return {
    id: parsePositiveIntId(f.id, "fee"),
    studentId: parsePositiveIntId(f.student_id, "student"),
    feeAmount: parseNonNegativeInt(f.fee_amount, "fee_amount"),
    month: parseStringField(f.month, "month", true),
    academicYear,
    feeType: parseFeeType(f.fee_type),
    feeStatus: parseFeeStatus(f.fee_status),
  };
}

export function createFeeApi(client: FeeClient = defaultFeeClient): FeeApi {
  async function getFees(): Promise<FeeObligation[]> {
    const rawFees = await client.requestJson<unknown>("/api/fees/");
    return client.expectArray<unknown>(rawFees, "fees").map(mapFee);
  }

  return { getFees };
}

const defaultFeeApi = createFeeApi();

export const getFees = defaultFeeApi.getFees;
