import type { Parent, Student } from "../../types";
import { UsersIcon, SchoolIcon } from "../common/Icons";

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
  const enrolledChildren = students.filter(
    (student) => student.parentId === selectedParentId
  );

  function handleParentSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newParentId = event.target.value;
    onSelectParent(newParentId);

    const associatedChildren = students.filter((s) => s.parentId === newParentId);
    if (associatedChildren.length > 0) {
      onSelectStudent(associatedChildren[0].id);
    } else {
      onSelectStudent("");
    }
  }

  function handleStudentSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onSelectStudent(event.target.value);
  }

  if (parents.length === 0) {
    return (
      <div className="card selector-card empty-state-card" role="region" aria-label="Family Account Selection">
        <div className="card-title text-center">ACCOUNT SELECTION</div>
        <div className="empty-icon-wrap">
          <SchoolIcon className="empty-svg" />
        </div>
        <p className="empty-message text-center">
          <strong>No Student Records Found</strong>
        </p>
        <p className="empty-subtext text-center">
          Please navigate to the <strong>Admin Office</strong> to enroll students.
        </p>
      </div>
    );
  }

  return (
    <div className="card selector-card" role="region" aria-label="Family Account Selection">
      <div className="card-title text-center">
        <UsersIcon className="title-icon" />
        <span>SELECT FAMILY ACCOUNT</span>
      </div>

      <div className="selector-stack">
        {/* Tier 1: Parent Account Selector */}
        <div className="selector-box">
          <label htmlFor="parent-select" className="box-label">
            1. Select Parent Account
          </label>
          <div className="select-wrapper">
            <select
              id="parent-select"
              className="class-selector custom-select"
              value={selectedParentId}
              onChange={handleParentSelectChange}
              aria-label="Select Parent Account"
            >
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} ({parent.phone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tier 2: Enrolled Child Selector */}
        <div className="selector-box">
          <label htmlFor="student-select" className="box-label">
            2. Select Enrolled Student
          </label>
          <div className="select-wrapper">
            <select
              id="student-select"
              className="class-selector custom-select"
              value={selectedStudentId}
              onChange={handleStudentSelectChange}
              disabled={enrolledChildren.length === 0}
              aria-label="Select Enrolled Student"
            >
              {enrolledChildren.length === 0 ? (
                <option value="">No children registered under this account</option>
              ) : (
                enrolledChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} — Class {child.gradeName}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentStudentSelector;
