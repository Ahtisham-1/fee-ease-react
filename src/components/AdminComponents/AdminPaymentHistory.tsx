import type { Payment } from "../ParentComponents/PayFeesForm";
import type { Student } from "../ParentComponents/ParentStudentSelector";

export interface AdminPaymentHistoryProps {
  payments: Payment[];
  students: Student[];
}

function AdminPaymentHistory({
  payments,
  students,
}: AdminPaymentHistoryProps) {

  return (
    <div className="card">
      <div className="card-title">SCHOOL-WIDE PAYMENT HISTORY</div>

      {payments.map((payId) => {
        const matchingStudent = students.find(
          (student) => student.id === payId.belongsTo
        );
        return (
          <div key={payId.id} className="history-item">
            <span>
              {matchingStudent?.name} ({matchingStudent?.gradeName} {matchingStudent?.id})
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
