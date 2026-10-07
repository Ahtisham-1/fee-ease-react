import type { Student } from "../../types";
import { UsersIcon, SchoolIcon } from "../common/Icons";

export interface ParentStudentSelectorProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
}

/**
 * WHAT: Student Selector for the Parent Portal.
 * WHY: A logged-in parent is already authenticated as themselves. They should never see or select
 * other parents from the school. If they have multiple children enrolled, they can switch between them here.
 * HOW: The backend (GET /api/students/) automatically filters students by current_user.parent_id.
 * This component simply displays the logged-in parent's enrolled child (or children) and allows switching.
 */
export function ParentStudentSelector({
  students,
  selectedStudentId,
  onSelectStudent,
}: ParentStudentSelectorProps) {
  function handleStudentSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onSelectStudent(event.target.value);
  }

  if (students.length === 0) {
    return (
      <div className="card selector-card empty-state-card" role="region" aria-label="Family Account Selection">
        <div className="card-title text-center">STUDENT PORTAL</div>
        <div className="empty-icon-wrap">
          <SchoolIcon className="empty-svg" />
        </div>
        <p className="empty-message text-center">
          <strong>No Children Linked to This Account</strong>
        </p>
        <p className="empty-subtext text-center">
          Please contact the school office to link your parent account to your enrolled children.
        </p>
      </div>
    );
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  return (
    <div className="card selector-card" role="region" aria-label="Family Account Selection">
      <div className="card-title text-center">
        <UsersIcon className="title-icon" />
        <span>MY ENROLLED CHILDREN</span>
      </div>

      <div className="selector-stack">
        {students.length > 1 ? (
          /* Multi-child family: show selector */
          <div className="selector-box">
            <label htmlFor="student-select" className="box-label">
              Select Child to View & Pay Fees
            </label>
            <div className="select-wrapper">
              <select
                id="student-select"
                className="class-selector custom-select"
                value={selectedStudentId}
                onChange={handleStudentSelectChange}
                aria-label="Select Enrolled Student"
              >
                {students.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} — Class {child.gradeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Single-child family: clean summary display */
          <div className="selector-box" style={{ padding: '0.75rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="box-label" style={{ marginBottom: '0.2rem' }}>STUDENT</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedStudent.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="box-label" style={{ marginBottom: '0.2rem' }}>CLASS</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--emerald-primary)' }}>
                  Class {selectedStudent.gradeName}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentStudentSelector;
