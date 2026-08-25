import type { Student, Parent, FeeObligation, Payment } from "../../types";
import { getStudentFinancialSummary } from "../../utils/feeCalculator";

export interface AdminClassRosterProps {
  students: Student[];
  parents: Parent[];
  feeObligations: FeeObligation[];
  payments: Payment[];
  selectedGrade: string;
  onEditStudent: (student: Student) => void;
}

export function AdminClassRoster({
  students,
  parents,
  feeObligations,
  payments,
  selectedGrade,
  onEditStudent,
}: AdminClassRosterProps) {
  const gradeStudents = students.filter(
    (student) => student.gradeName === selectedGrade
  );

  return (
    <div className="card roster-card">
      <div className="card-title">CLASS ROSTER — CLASS {selectedGrade}</div>

      {gradeStudents.length === 0 ? (
        <p className="empty-history">
          No students currently enrolled in Class {selectedGrade}. Use the enrollment form below to add students.
        </p>
      ) : (
        <div className="history-list">
          {gradeStudents.map((student) => {
            const parent = parents.find((p) => p.id === student.parentId);
            const { netBalance } = getStudentFinancialSummary(
              student.id,
              feeObligations,
              payments
            );

            return (
              <div key={student.id} className="history-item roster-row">
                <div className="student-info">
                  <strong className="student-name">{student.name}</strong>
                  <span className="student-id-tag">ID: {student.id}</span>
                </div>

                <div className="parent-info">
                  <span className="parent-name">
                    👤 {parent ? parent.name : "Parent N/A"}
                  </span>
                  <span className="parent-phone">
                    📞 {parent ? parent.phone : "No Phone"}
                  </span>
                </div>

                <div className="finance-info">
                  <span className="pending-label">Pending Dues:</span>
                  <strong
                    className={`pending-amount ${
                      netBalance === 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    ₹{netBalance.toLocaleString()}
                  </strong>
                </div>

                <button
                  type="button"
                  className="role-btn edit-action-btn"
                  onClick={() => onEditStudent(student)}
                >
                  ✏️ Edit
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminClassRoster;
