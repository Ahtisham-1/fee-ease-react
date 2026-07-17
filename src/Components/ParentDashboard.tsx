import type { Student, Parent } from "../types";
import { useState } from "react";

type ParentDashboardProps = {
  students: Student[];
  parents: Parent[];
};

function ParentDashboard({ students, parents }: ParentDashboardProps) {
  const [selectedParentId, setSelectedParentId] = useState("P1");
  const filterStudent = students.filter(
    (s) => s.connectingId === selectedParentId,
  );
  return (
    <div>
      <div></div>
      <ul>
        {filterStudent.map((s) => (
          <li key={s.studentId}>{s.studentName}</li>
        ))}
      </ul>
      <div>
        <select onChange={(e) => setSelectedParentId(e.target.value)}>
          {parents.map((p) => (
            <option key={p.parentId} value={p.parentId}>
              {p.parentName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ParentDashboard;
