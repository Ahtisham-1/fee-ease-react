import type { Student } from "../types/index.ts";
import { expectArray, requestJson, type ApiClient } from "./apiClient.ts";

interface BackendStudent {
  id: number;
  student_name: string;
  parent_id: number | null;
  phone: string;
  grade: string;
  tuition_fee: number;
  has_transport: boolean;
  transport_fee: number;
}

type StudentClient = Pick<ApiClient, "requestJson" | "expectArray">;

const defaultStudentClient: StudentClient = {
  requestJson,
  expectArray,
};

function mapStudent(s: BackendStudent): Student {
  return {
    id: String(s.id),
    name: String(s.student_name ?? ""),
    parentId: s.parent_id != null ? String(s.parent_id) : "",
    gradeName: String(s.grade ?? ""),
    hasTransport: Boolean(s.has_transport),
    transportFee: Number(s.transport_fee) || 0,
  };
}

export function createStudentApi(client: StudentClient = defaultStudentClient) {
  async function getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<Student[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.limit !== undefined) {
      query.append("limit", String(params.limit));
    }
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString();
    const url = queryString ? `/api/students/?${queryString}` : "/api/students/";

    const rawStudents = await client.requestJson<BackendStudent[]>(url);
    return client.expectArray<BackendStudent>(rawStudents, "students").map(
      mapStudent,
    );
  }

  return { getStudents };
}

const defaultStudentApi = createStudentApi();

export const getStudents = defaultStudentApi.getStudents;
