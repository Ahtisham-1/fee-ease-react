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
    parentName: s.parent_name,
    gradeName: s.grade,
    phone: s.phone,
    id: String(s.id),
    parentId: s.phone,
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

export async function deleteStudents(studentId: string) {
  const response = await fetch(
    `http://localhost:8000/api/students/${studentId}`,
    {
      method: "DELETE",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(studentId),
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

export async function updateStudents(
  studentId: string,
  updatedData: Partial<NewStudentData>,
) {
  const updatedDataPayload = {
    student_name: updatedData.studentName,
    parent_name: updatedData.parentName,
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
