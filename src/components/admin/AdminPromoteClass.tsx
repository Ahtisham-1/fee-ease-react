import { useState, useEffect } from "react";
import type { Student } from "../../types";

export interface AdminPromoteClassProps {
  gradeClass: string[];
  gradeStudents: Student[];
  selectedGrade: string;
  onDropdownChange: (value: string) => void;
  onPromoteSubmit: (selectedStudentIds: string[]) => void;
}

export function AdminPromoteClass({
  gradeClass,
  gradeStudents,
  selectedGrade,
  onDropdownChange,
  onPromoteSubmit,
}: AdminPromoteClassProps) {
  const [selectedIDs, setSelectedIDs] = useState<string[]>([]);

  // Automatically select all students in the classroom upon grade switch
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
    <div className="card promotion-card">
      <div className="card-title">ANNUAL ACADEMIC CLASS PROMOTION</div>

      <form onSubmit={handleSubmit}>
        <div className="promotion-header-box">
          <div className="selector-group">
            <label className="selector-label">Select Grade to Advance:</label>
            <select
              className="class-selector"
              value={selectedGrade}
              onChange={(e) => onDropdownChange(e.target.value)}
            >
              {gradeClass.map((grade) => (
                <option key={grade} value={grade}>
                  Class {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="promotion-path-badge">
            <span className="badge-pill current">Current: Class {selectedGrade}</span>
            <span className="arrow-indicator">➔</span>
            <span className="badge-pill next">Next: Class {nextGrade}</span>
          </div>
        </div>

        {/* Selection Toolbar */}
        <div className="selection-toolbar">
          <span className="selected-counter">
            Selected for Promotion: <strong>{selectedIDs.length}</strong> /{" "}
            {gradeStudents.length} Students
          </span>

          <div className="toolbar-buttons">
            <button
              type="button"
              className="role-btn text-xs"
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              type="button"
              className="role-btn text-xs"
              onClick={handleDeselectAll}
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Student Roster Checkbox List */}
        {gradeStudents.length === 0 ? (
          <p className="empty-history">
            No students currently enrolled in Class {selectedGrade} to promote.
          </p>
        ) : (
          <ul className="promotion-roster-list">
            {gradeStudents.map((student) => {
              const isSelected = selectedIDs.includes(student.id);
              return (
                <li
                  key={student.id}
                  className={`promotion-row ${isSelected ? "selected" : "unselected"}`}
                  onClick={() => handleToggle(student.id)}
                >
                  <label
                    className="checkbox-container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(student.id)}
                    />
                    <span className="student-name-label">{student.name}</span>
                  </label>

                  <span
                    className={`status-badge ${
                      isSelected ? "paid" : "pending"
                    }`}
                  >
                    {isSelected ? `Promoting to ${nextGrade}` : "Repeating Grade"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="submit"
          className="pay-btn mt-4"
          disabled={selectedIDs.length === 0}
        >
          🚀 Advance {selectedIDs.length} Selected Student
          {selectedIDs.length === 1 ? "" : "s"} to Class {nextGrade}
        </button>
      </form>
    </div>
  );
}

export default AdminPromoteClass;
