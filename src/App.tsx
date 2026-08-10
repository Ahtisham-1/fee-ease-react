import { useState } from "react";
import Header from "./components/Header";
import type { Role } from "./components/Header";
import ParentStudentSelector from "./components/ParentStudentSelector";
import FeeDetail from "./components/FeeDetail";
import type { FeeObligation } from "./components/FeeDetail";

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
function App() {
  const [role, setRole] = useState<Role>("parent");
  const [selectedParent, setSelectedParent] = useState("p1");
  const [selectedStudent, setSelectedStudent] = useState("s1");

  const filteredStudents = students.filter(
    (student) => student.parentId === selectedParent,
  );
  return (
    <>
      <Header activeRole={role} onSelectRole={setRole} />
      <ParentStudentSelector
        parents={parents}
        students={filteredStudents}
        selectedParentId={selectedParent}
        selectedStudentId={selectedStudent}
        onSelectParent={setSelectedParent}
        onSelectStudent={setSelectedStudent}
      />
      <FeeDetail />
    </>
  );
}

export default App;
