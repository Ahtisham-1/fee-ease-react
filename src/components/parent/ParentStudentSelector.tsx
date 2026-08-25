import type { Parent, Student } from "../../types";

export interface ParentStudentSelectorProps {
  parents: Parent[];
  students: Student[];
  selectedParentId: string;
  selectedStudentId: string;
  onSelectParent: (parentId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export function ParentStudentSelector({
  parents,
  students,
  selectedParentId,
  selectedStudentId,
  onSelectParent,
  onSelectStudent,
}: ParentStudentSelectorProps) {
  // Cascading Filter: Only show children belonging to the selected parent
  const parentChildren = students.filter(
    (student) => student.parentId === selectedParentId
  );

  function handleParentChange(newParentId: string) {
    onSelectParent(newParentId);
    // Cascade-select the first child of the new parent to prevent "Ghost Child" state
    const newChildren = students.filter((s) => s.parentId === newParentId);
    if (newChildren.length > 0) {
      onSelectStudent(newChildren[0].id);
    } else {
      onSelectStudent("");
    }
  }

  if (parents.length === 0) {
    return (
      <div className="card empty-state-card">
        <p className="empty-message">
          🏫 <strong>No Students Enrolled Yet</strong>
        </p>
        <p className="empty-subtext">
          Switch to the <strong>Admin Office</strong> tab above to enroll your first student and generate fee obligations.
        </p>
      </div>
    );
  }

  return (
    <div className="card selector-card">
      <div className="card-title">SELECT FAMILY ACCOUNT</div>

      <div className="selector-grid">
        <div className="selector-group">
          <label className="selector-label">1. Select Parent Account</label>
          <select
            className="class-selector"
            value={selectedParentId}
            onChange={(e) => handleParentChange(e.target.value)}
          >
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                👤 {parent.name} ({parent.phone})
              </option>
            ))}
          </select>
        </div>

        <div className="selector-group">
          <label className="selector-label">2. Select Enrolled Child</label>
          <select
            className="class-selector"
            value={selectedStudentId}
            onChange={(e) => onSelectStudent(e.target.value)}
            disabled={parentChildren.length === 0}
          >
            {parentChildren.length === 0 ? (
              <option value="">No children linked to this parent</option>
            ) : (
              parentChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  🎒 {child.name} — Class {child.gradeName}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

export default ParentStudentSelector;
