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
      <div className="card-title text-center">SCHOOL-WIDE TRANSACTION AUDIT LOG</div>

      {payments.length === 0 ? (
        <p className="empty-history text-center">
          No fee payment transactions recorded yet.
        </p>
      ) : (
        <div className="history-list scrollable-feed">
          {payments.map((receipt) => {
            const student = students.find((s) => s.id === receipt.belongsTo);
            const isSuccess = receipt.status === "SUCCESS";

            return (
              <div
                key={receipt.id}
                className={`history-item ${!isSuccess ? "failed-receipt-item" : ""}`}
              >
                <div className="history-meta">
                  <strong>
                    {student ? student.name : "Unknown Student"} (Class{" "}
                    {student ? student.gradeName : "N/A"})
                  </strong>
                  <span className="timestamp">{receipt.dateTime} — Receipt #{receipt.id.slice(-6)}</span>
                  {!isSuccess && (
                    <span className="failure-note">⚠️ Payment Failed / Declined</span>
                  )}
                </div>

                <div className="history-finance">
                  <span
                    className={`amount-text ${
                      isSuccess ? "text-success" : "text-danger strikethrough"
                    }`}
                  >
                    {isSuccess ? "+" : "✕"}₹{receipt.amount.toLocaleString()}
                  </span>
                  <span
                    className={`status-badge ${
                      isSuccess ? "paid" : "danger-badge"
                    }`}
                  >
                    {receipt.status}
                  </span>
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
