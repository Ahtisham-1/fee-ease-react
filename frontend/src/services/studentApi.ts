import type { NewStudentData } from "../types";

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

// 1. GET all students from PostgreSQL
export async function getStudents() {
  const response = await fetch("http://localhost:8000/api/students");
  if (!response.ok) {
    throw new Error("Failed to fetch the students");
  }

  const rawStudents = await response.json();
  const mappedStudents = rawStudents.map((s: BackendStudent) => ({
    name: s.student_name,
    parentName: "",
    gradeName: s.grade,
    phone: s.phone,
    id: String(s.id),
    parentId: s.parent_id ? String(s.parent_id) : "",
    hasTransport: s.has_transport,
    transportFee: s.transport_fee,
  }));
  return mappedStudents;
}

// 2. CREATE a student in PostgreSQL
export async function createStudents(data: NewStudentData) {
  const payload = {
    student_name: data.studentName,
    parent_id: data.parentId,
    phone: data.phone,
    grade: data.grade,
    tuition_fee: data.tuitionFee,
    has_transport: data.hasTransport,
    transport_fee: data.transportFee || 0,
  };

  const response = await fetch("http://localhost:8000/api/students", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to enroll student: ${response.statusText}`);
  }
  const savedStudent = await response.json();
  return savedStudent;
}

// 3. DELETE a student from PostgreSQL
export async function deleteStudents(studentId: string) {
  const response = await fetch(
    `http://localhost:8000/api/students/${studentId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to find the student of this Id ${response.statusText}`,
    );
  }
  const removedStudent = await response.json();
  return removedStudent;
}

// 4. UPDATE a student in PostgreSQL
export async function updateStudents(
  studentId: string,
  updatedData: Partial<NewStudentData>,
) {
  const updatedDataPayload = {
    student_name: updatedData.studentName,
    parent_id: updatedData.parentId,
    phone: updatedData.phone,
    grade: updatedData.grade,
    tuition_fee: updatedData.tuitionFee,
    has_transport: updatedData.hasTransport,
    transport_fee: updatedData.transportFee,
  };

  const response = await fetch(
    `http://localhost:8000/api/students/${studentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedDataPayload),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to update student data ${response.statusText}`);
  }
  const updatedStudent = await response.json();
  return updatedStudent;
}
