import type { NewStudentData } from "../types";

interface BackendStudent {
  id: number;
  student_name: string;
  parent_name: string;
  phone: string;
  grade: string;
  tuition_fee: number;
  has_transport: boolean;
  transport_fee: number;
}

export async function getStudents() {
  const response = await fetch("http://localhost:8000/api/students");
  if (!response.ok) {
    throw new Error("Failed to fetch the students");
  }

  const rawStudents = await response.json();
  const mappedStudents = rawStudents.map((s: BackendStudent) => ({
    name: s.student_name,
    gradeName: s.grade,
    id: String(s.id),
    parentId: "",
    hasTransport: s.has_transport,
    transportFee: s.transport_fee,
  }));
  return mappedStudents;
}

export async function createStudents(data: NewStudentData) {
  const payload = {
    student_name: data.studentName,
    parent_name: data.parentName,
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
