import type { NewStudentData, UpdateStudentData } from "../types";
import { expectArray, requestJson } from "./apiClient";

// The real shape coming from FastAPI/PostgreSQL
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

function mapStudent(s: BackendStudent) {
  return {
    name: s.student_name,
    parentName: "",
    gradeName: s.grade,
    phone: s.phone,
    id: String(s.id),
    parentId: s.parent_id != null ? String(s.parent_id) : "",
    hasTransport: s.has_transport,
    transportFee: s.transport_fee,
  };
}

/**
 * WHAT: Fetches students from FastAPI with optional pagination and search filters.
 * WHY: We need the frontend to send `?page=1&limit=50&search=...` query parameters to the backend.
 * HOW: It converts optional query parameters into a URLSearchParams string and appends them to `/api/students`.
 */
export async function getStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.search) query.append("search", params.search);

  const queryString = query.toString();
  const url = queryString ? `/api/students?${queryString}` : "/api/students";

  const rawStudents = await requestJson<BackendStudent[]>(url);
  return expectArray<BackendStudent>(rawStudents, "students").map(mapStudent);
}

// 2. CREATE a student in PostgreSQL
export async function createStudents(data: NewStudentData) {
  return requestJson<BackendStudent>("/api/students", {
    method: "POST",
    body: {
      student_name: data.studentName,
      parent_id: data.parentId,
      phone: data.phone,
      grade: data.grade,
      tuition_fee: data.tuitionFee,
      has_transport: data.hasTransport,
      transport_fee: data.transportFee || 0,
    },
  });
}

// 3. DELETE a student from PostgreSQL
export async function deleteStudents(studentId: string) {
  return requestJson<{ Ok: boolean }>(`/api/students/${studentId}`, {
    method: "DELETE",
  });
}

// 4. UPDATE a student in PostgreSQL (partial patch — only defined fields are sent)
export async function updateStudents(
  studentId: string,
  updatedData: UpdateStudentData,
) {
  const payload: Record<string, unknown> = {};
  if (updatedData.studentName !== undefined) payload.student_name = updatedData.studentName;
  if (updatedData.parentId !== undefined) payload.parent_id = updatedData.parentId;
  if (updatedData.phone !== undefined) payload.phone = updatedData.phone;
  if (updatedData.grade !== undefined) payload.grade = updatedData.grade;
  if (updatedData.tuitionFee !== undefined) payload.tuition_fee = updatedData.tuitionFee;
  if (updatedData.hasTransport !== undefined) payload.has_transport = updatedData.hasTransport;
  if (updatedData.transportFee !== undefined) payload.transport_fee = updatedData.transportFee;

  return requestJson<BackendStudent>(`/api/students/${studentId}`, {
    method: "PATCH",
    body: payload,
  });
}
