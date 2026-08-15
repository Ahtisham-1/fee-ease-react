import type { Payment } from "../ParentComponents/PayFeesForm";
import type { Student } from "../ParentComponents/ParentStudentSelector";
import type { FeeObligation } from "../ParentComponents/FeeDetail";

export interface AdminPaymentHistoryProps {
  payments: Payment[];
  students: Student[];
  feeObligations: FeeObligation[];
}

function AdminPaymentHistory({
  payments,
  students,
  feeObligations,
}: AdminPaymentHistoryProps) {
  return (
    <div className="card">
      <div className="card-title">SCHOOL-WIDE PAYMENT HISTORY</div>

      {payments.map((payId) => {
        const matchingStudent = students.find(
          (student) => student.id === payId.belongsTo,
        );
        return (
          <div key={payId.id} className="history-item">
            <span>
              {matchingStudent?.name} ({matchingStudent?.gradeName})
            </span>
            <span>
              Paid: ₹{payId.amount} | {payId.dateTime} 
            </span>
          </div>
        );
      })}
    </div>
  );
}
export default AdminPaymentHistory;
