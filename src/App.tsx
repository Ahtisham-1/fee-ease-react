import { useState } from "react";
import Header from "./components/Header";
import type { Role } from "./components/Header";
import ParentStudentSelector from "./components/ParentStudentSelector";
import FeeDetail from "./components/FeeDetail";
import type { FeeObligation } from "./components/FeeDetail";
import type { FeeDetailProps } from "./components/FeeDetail";

const parents = [
  {
    id: "p1",
    name: "Quyoom",
  },
  {
    id: "p2",
    name: "Mukhtar",
  },
];

const students = [
  {
    id: "s1",
    name: "Ahtisham",
    parentId: "p1",
    gradeName: "10th",
  },
  {
    id: "s2",
    name: "Arooj",
    parentId: "p1",
    gradeName: "12th",
  },
  {
    id: "s3",
    name: "Mehnan",
    parentId: "p2",
    gradeName: "11th",
  },
];

const feeObligations = [
  {
    id: "f1",
    studentId: "s1",
    feeAmount: 33000,
    month: "June",
    feeType: "tuition",
    feeStatus: "paid",
  },
  {
    id: "f2",
    studentId: "s1",
    feeAmount: 33000,
    month: "july",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f3",
    studentId: "s2",
    feeAmount: 3000,
    month: "June",
    feeType: "tuition",
    feeStatus: "paid",
  },
  {
    id: "f4",
    studentId: "s3",
    feeAmount: 4000,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "paid",
  },
];
function App() {
  const [role, setRole] = useState<Role>("parent");
  const [selectedParent, setSelectedParent] = useState("p1");
  const [selectedStudent, setSelectedStudent] = useState("s1");

  const filteredStudents = students.filter(
    (student) => student.parentId === selectedParent,
  );

  const filteredFeeObligations = feeObligations.filter(
    (feeObligationStudents) =>
      feeObligationStudents.studentId === selectedStudent,
  );

  function handleParentChange(parentId: string) {
    setSelectedParent(parentId);
    const filteredStudent = students.filter(
      (student) => parentId === student.parentId,
    );
    setSelectedStudent(filteredStudent[0].id);
  }
  return (
    <>
      <Header activeRole={role} onSelectRole={setRole} />
      <ParentStudentSelector
        parents={parents}
        students={filteredStudents}
        selectedParentId={selectedParent}
        selectedStudentId={selectedStudent}
        onSelectParent={handleParentChange}
        onSelectStudent={setSelectedStudent}
      />
      <FeeDetail feeObligation={filteredFeeObligations} />
    </>
  );
}

export default App;
