import type { NewStudentData } from "../types";

export async function getStudents() {
  const response = await fetch("http://localhost:8000/api/students");
  if (!response.ok) {
    throw new Error("Failed to fetch the students");
  }
  return await response.json();
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
