import { useState, useEffect } from "react";
import type { Student } from "../ParentComponents/ParentStudentSelector";

interface AdminPromoteClassProps {
  gradeClass: string[];
  gradeStudents: Student[];
  selectedGrade: string;
  onDropdownChange: (value: string) => void;
  onPromoteSubmit: (selectedStudentIds: string[]) => void;
}

function AdminPromoteClass({
  gradeClass,
  gradeStudents,
  selectedGrade,
  onDropdownChange,
  onPromoteSubmit,
}: AdminPromoteClassProps) {
  // Initially check all students in the class by default
  const [selectedIDs, setSelectedIDs] = useState<string[]>([]);

  // When the selected class changes, select all students in that new class by default
  useEffect(() => {
    setSelectedIDs(gradeStudents.map((student) => student.id));
  }, [gradeStudents]);

  function handleToggle(studentId: string) {
    if (selectedIDs.includes(studentId)) {
      setSelectedIDs(selectedIDs.filter((id) => id !== studentId));
    } else {
      setSelectedIDs([...selectedIDs, studentId]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onPromoteSubmit(selectedIDs);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card-title">ANNUAL CLASS PROMOTION</div>

      <div className="class-selector-wrapper">
        <select
          className="class-selector"
          value={selectedGrade}
          onChange={(e) => onDropdownChange(e.target.value)}
        >
          {gradeClass.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </div>

      <ul className="roster-list">
        {gradeStudents.map((student) => (
          <li key={student.id} className="roster-row">
            <label className="checkbox-label" style={{ width: "100%", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedIDs.includes(student.id)}
                onChange={() => handleToggle(student.id)}
              />
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                {student.name}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {gradeStudents.length === 0 && (
        <p style={{ color: "var(--text-secondary)", fontStyle: "italic", margin: "1rem 0" }}>
          No students currently enrolled in this class.
        </p>
      )}

      <button
        type="submit"
        disabled={selectedIDs.length === 0}
        style={{ marginTop: "1.5rem" }}
      >
        Promote Selected Students ({selectedIDs.length})
      </button>
    </form>
  );
}

export default AdminPromoteClass;
