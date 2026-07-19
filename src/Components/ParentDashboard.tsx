import type { Student, Parent } from "../types";
import { useState } from "react";

type ParentDashboardProps = {
  students: Student[];
  parents: Parent[];
};

function ParentDashboard({ students, parents }: ParentDashboardProps) {
  const [selectedParentId, setSelectedParentId] = useState("P1");

  const filteredStudents = students.filter(
    (fs) => fs.connectingId === selectedParentId,
  );
  return (
    <>
      <select onChange={(e) => setSelectedParentId(e.target.value)}>
        {parents.map((p) => (
          <option value={p.parentId} key={p.parentId}>
            {p.parentName}
          </option>
        ))}
      </select>

      <select>
        {filteredStudents.map((ps) => (
          <option value={ps.studentId} key={ps.studentId}>
            {ps.studentName}
          </option>
        ))}
      </select>
    </>
  );
}

export default ParentDashboard;
