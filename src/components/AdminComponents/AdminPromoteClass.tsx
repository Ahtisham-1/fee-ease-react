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
  const [selectedIDs, setSelectedIDs] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIDs(gradeStudents.map((s) => s.id));
  }, [gradeStudents]);

  function handleToggle(studentId: string) {
    if (selectedIDs.includes(studentId)) {
      setSelectedIDs(selectedIDs.filter((id) => id !== studentId));
    } else {
      setSelectedIDs([...selectedIDs, studentId]);
    }
  }

  function handleSelectAll() {
    setSelectedIDs(gradeStudents.map((student) => student.id));
  }

  function handleDeselectAll() {
    setSelectedIDs([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onPromoteSubmit(selectedIDs);
  }

  const currentIndex = gradeClass.indexOf(selectedGrade);
  const nextGrade =
    currentIndex < gradeClass.length - 1
      ? gradeClass[currentIndex + 1]
      : "Graduated";

  return (
    <form onSubmit={handleSubmit}>
      <h2>ANNUAL CLASS PROMOTION</h2>

      <p>
        Advance students to the next academic level. Uncheck any students who
        are repeating the grade.
      </p>

      <div>
        <span>SELECT GRADE:</span>
        <select
          value={selectedGrade}
          onChange={(e) => onDropdownChange(e.target.value)}
        >
          {gradeClass.map((grade) => (
            <option key={grade} value={grade}>
              Class {grade}
            </option>
          ))}
        </select>

        <span>
          Current: {selectedGrade} ➔ Next: {nextGrade}
        </span>
      </div>

      {/* Selection Toolbar */}
      <div>
        <span>
          Students Selected: {selectedIDs.length} / {gradeStudents.length}
        </span>

        <div>
          <button type="button" onClick={handleSelectAll}>
            Select All
          </button>
          <button type="button" onClick={handleDeselectAll}>
            Deselect All
          </button>
        </div>
      </div>

      {/* Student Roster Checkbox List */}
      <ul>
        {gradeStudents.map((student) => {
          const isSelected = selectedIDs.includes(student.id);
          return (
            <li key={student.id}>
              <label>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(student.id)}
                />
                <span>{student.name}</span>
              </label>

              <span>
                {isSelected ? `Promoting to ${nextGrade}` : "Repeating"}
              </span>
            </li>
          );
        })}
      </ul>

      {gradeStudents.length === 0 && (
        <div>No students are currently enrolled in Class {selectedGrade}.</div>
      )}

      <button type="submit" disabled={selectedIDs.length === 0}>
        Promote {selectedIDs.length} Selected Student
        {selectedIDs.length === 1 ? "" : "s"} to {nextGrade}
      </button>
    </form>
  );
}

export default AdminPromoteClass;
