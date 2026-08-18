import type { Student } from "../ParentComponents/ParentStudentSelector";
import type { Parent } from "../ParentComponents/ParentStudentSelector";
import type { FeeObligation } from "../ParentComponents/FeeDetail";
import type { Payment } from "../ParentComponents/PayFeesForm";

export interface AdminClassRosterProps {
  students: Student[];
  parents: Parent[];
  feeObligations: FeeObligation[];
  payments: Payment[];
  selectedGrade: string;
}
  
function AdminClassRoster({
  students,
  parents,
  feeObligations,
  payments,
  selectedGrade,
}: AdminClassRosterProps) {
  // 1. Filter students to only those in the selected grade
  const matchingStudentGrade = students.filter(
    (student) => student.gradeName === selectedGrade,
  );

  return (
    <div className="card">
      <div className="card-title">CLASS ROSTER — {selectedGrade}</div>

      {matchingStudentGrade.length === 0 ? (
        <p className="empty-history">
          No students enrolled in {selectedGrade} class yet.
        </p>
      ) : (
        <div className="history-list">
          {matchingStudentGrade.map((studentN) => {
            const parent = parents.find((p) => p.id === studentN.parentId);

            const totalFeesObligations = feeObligations
              .filter((obligations) => obligations.studentId === studentN.id)
              .reduce((acc, curr) => acc + curr.feeAmount, 0);

            const totalPaidObligations = payments
              .filter((totalPaid) => totalPaid.belongsTo === studentN.id)
              .reduce((acc, curr) => acc + curr.amount, 0);

            const total = totalFeesObligations - totalPaidObligations;

            return (
              <div key={studentN.id} className="history-item">
                <span>
                  <strong>{studentN.name}</strong> (ID: {studentN.id})
                </span>
                <span>
                  Parent: {parent?.name} ({parent?.phone})
                </span>
                <span>
                  Pending: <strong>₹{total}</strong>
                </span>
                <button className="role-btn">Edit</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminClassRoster;
