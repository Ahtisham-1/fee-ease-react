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
    setSelectedIDs(gradeStudents.map((student) => student.id));
  }, [gradeStudents]);

  function handleToggle(studentId: string) {
    if (selectedIDs.includes(studentId)) {
      setSelectedIDs(selectedIDs.filter((id) => id !== studentId));
    } else {
      setSelectedIDs([...selectedIDs, studentId]);
    }
  }

  function handleSelectAll() {
    setSelectedIDs(gradeStudents.map((s) => s.id));
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
    <form onSubmit={handleSubmit} className="admin-form-container">
      <div className="card-title">ANNUAL CLASS PROMOTION</div>
      
      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Advance students to the next academic level. Uncheck any students who are repeating the grade.
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--input-bg)",
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--input-border)",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
            SELECT GRADE:
          </span>
          <select
            className="class-selector"
            value={selectedGrade}
            onChange={(e) => onDropdownChange(e.target.value)}
            style={{ minHeight: "40px", padding: "0.5rem 2rem 0.5rem 0.85rem" }}
          >
            {gradeClass.map((grade) => (
              <option key={grade} value={grade}>
                Class {grade}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="status-badge pending" style={{ fontSize: "0.78rem" }}>
            Current: {selectedGrade}
          </span>
          <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>➔</span>
          <span className="status-badge paid" style={{ fontSize: "0.78rem" }}>
            Next: {nextGrade}
          </span>
        </div>
      </div>

      {/* Selection Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
          Students Selected: <strong style={{ color: "#ffffff" }}>{selectedIDs.length}</strong> / {gradeStudents.length}
        </span>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="edit-btn"
            onClick={handleSelectAll}
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}
          >
            Select All
          </button>
          <button
            type="button"
            className="edit-btn"
            onClick={handleDeselectAll}
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Student Roster Checkbox List */}
      <ul className="roster-list">
        {gradeStudents.map((student) => {
          const isSelected = selectedIDs.includes(student.id);
          return (
            <li
              key={student.id}
              className="roster-row"
              style={{
                cursor: "pointer",
                borderColor: isSelected ? "rgba(249, 115, 22, 0.4)" : "var(--card-border)",
                backgroundColor: isSelected ? "rgba(249, 115, 22, 0.05)" : "var(--input-bg)",
              }}
              onClick={() => handleToggle(student.id)}
            >
              <label
                className="checkbox-label"
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  minHeight: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(student.id)}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: isSelected ? "var(--text-primary)" : "var(--text-muted)",
                    textDecoration: isSelected ? "none" : "line-through",
                  }}
                >
                  {student.name}
                </span>
              </label>

              <span
                className={`status-badge ${isSelected ? "paid" : "pending"}`}
                style={{ fontSize: "0.68rem" }}
              >
                {isSelected ? `Promoting to ${nextGrade}` : "Repeating"}
              </span>
            </li>
          );
        })}
      </ul>

      {gradeStudents.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            color: "var(--text-secondary)",
            fontStyle: "italic",
            background: "var(--input-bg)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--input-border)",
            margin: "1rem 0",
          }}
        >
          No students are currently enrolled in Class {selectedGrade}.
        </div>
      )}

      <button
        type="submit"
        disabled={selectedIDs.length === 0}
        style={{
          marginTop: "1.75rem",
          opacity: selectedIDs.length === 0 ? 0.5 : 1,
          cursor: selectedIDs.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        Promote {selectedIDs.length} Selected Student{selectedIDs.length === 1 ? "" : "s"} to {nextGrade}
      </button>
    </form>
  );
}

export default AdminPromoteClass;
