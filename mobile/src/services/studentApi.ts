import type { Student } from "../types/index.ts";
import {
  expectRecord,
  parseBooleanField,
  parseNonNegativeInt,
  parsePositiveIntId,
  parseStringField,
} from "../utils/validation.ts";
import { ApiError, expectArray, requestJson, type ApiClient } from "./apiClient.ts";

export interface StudentApi {
  getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<Student[]>;
}

type StudentClient = Pick<ApiClient, "requestJson" | "expectArray">;

const defaultStudentClient: StudentClient = {
  requestJson,
  expectArray,
};

function mapStudent(raw: unknown): Student {
  const s = expectRecord(raw, "student");
  return {
    id: parsePositiveIntId(s.id, "student"),
    name: parseStringField(s.student_name, "student_name"),
    parentId: s.parent_id === null ? "" : parsePositiveIntId(s.parent_id, "parent"),
    gradeName: parseStringField(s.grade, "grade"),
    hasTransport: parseBooleanField(s.has_transport, "has_transport"),
    transportFee: parseNonNegativeInt(s.transport_fee, "transport_fee"),
  };
}

export function createStudentApi(
  client: StudentClient = defaultStudentClient,
): StudentApi {
  async function getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<Student[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) {
      if (!Number.isSafeInteger(params.page) || params.page < 1) {
        throw new ApiError("Invalid page number.", 400, "validation");
      }
      query.append("page", String(params.page));
    }
    if (params?.limit !== undefined) {
      if (
        !Number.isSafeInteger(params.limit) ||
        params.limit < 1 ||
        params.limit > 100
      ) {
        throw new ApiError("Invalid page limit.", 400, "validation");
      }
      query.append("limit", String(params.limit));
    }
    if (params?.search !== undefined) {
      const trimmed = params.search.trim();
      if (trimmed.length > 100 || /[\x00-\x1f\x7f]/.test(trimmed)) {
        throw new ApiError("Invalid search query.", 400, "validation");
      }
      if (trimmed) {
        query.append("search", trimmed);
      }
    }

    const queryString = query.toString();
    const url = queryString ? `/api/students/?${queryString}` : "/api/students/";

    const rawStudents = await client.requestJson<unknown>(url);
    return client.expectArray<unknown>(rawStudents, "students").map(mapStudent);
  }

  return { getStudents };
}

const defaultStudentApi = createStudentApi();

export const getStudents = defaultStudentApi.getStudents;
