import type { Payment, Student } from "../../types";

export interface AdminPaymentHistoryProps {
  payments: Payment[];
  students: Student[];
}

export function AdminPaymentHistory({
  payments,
  students,
}: AdminPaymentHistoryProps) {
  return (
    <div className="card admin-history-card">
      <div className="card-title">SCHOOL-WIDE TRANSACTION LOG</div>

      {payments.length === 0 ? (
        <p className="empty-history">
          No fee payment transactions recorded yet.
        </p>
      ) : (
        <div className="history-list">
          {payments.map((receipt) => {
            const student = students.find((s) => s.id === receipt.belongsTo);

            return (
              <div key={receipt.id} className="history-item">
                <div className="history-meta">
                  <strong>
                    {student ? student.name : "Unknown Student"} (Class{" "}
                    {student ? student.gradeName : "N/A"})
                  </strong>
                  <span className="timestamp">{receipt.dateTime}</span>
                </div>

                <div className="history-finance">
                  <span className="amount-text text-success">
                    +₹{receipt.amount.toLocaleString()}
                  </span>
                  <span className="status-badge paid">PAID</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminPaymentHistory;
