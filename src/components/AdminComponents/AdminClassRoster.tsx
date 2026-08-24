import type { Payment } from "../ParentComponents/PayFeesForm";
import type { FeeObligation } from "../ParentComponents/FeeDetail";
import type { Student } from "../ParentComponents/ParentStudentSelector";
import type { Parent } from "../ParentComponents/ParentStudentSelector";

interface AdminClassRosterProps {
  payments: Payment[];
  feeObligations: FeeObligation[];
  students: Student[];
  parents: Parent[];
  onEditStudent: (student: Student) => void;
  selectedGrade: string;
}
function AdminClassRoster({
  payments,
  feeObligations,
  students,
  parents,
  onEditStudent,
  selectedGrade,
}: AdminClassRosterProps) {
  const matchingStudentGrade = students.filter(
    (student) => student.gradeName === selectedGrade,
  );

  return (
    <div>
      <div>Class roaster</div>

      <div>
        {matchingStudentGrade.length === 0 ? (
          <p>No student found for this class</p>
        ) : (
          <div>
            {matchingStudentGrade.map((studentN) => {
              const newParnet = parents.find((p) => p.id === studentN.parentId);

              const totalFeeAmount = feeObligations
                .filter((fee) => fee.studentId === studentN.id)
                .reduce((acc, curr) => acc + curr.feeAmount, 0);

              const totalpayment = payments
                .filter((pay) => pay.belongsTo === studentN.id)
                .reduce((acc, curr) => acc + curr.amount, 0);
              const total = totalFeeAmount - totalpayment;
              return (
                <div key={studentN.id}>
                  <span>
                    <strong>{studentN.name}</strong>
                    <strong>{studentN.id}</strong>
                    <strong>{newParnet?.name}</strong>
                    <strong>{newParnet?.phone}</strong>
                    <strong>{total}</strong>
                    <button onClick={() => onEditStudent(studentN)}>
                      Click
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminClassRoster;
