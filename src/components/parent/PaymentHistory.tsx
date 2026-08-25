import type { Payment } from "../../types";

export interface PaymentHistoryProps {
  payments: Payment[];
  selectedStudentId: string;
}

export function PaymentHistory({
  payments,
  selectedStudentId,
}: PaymentHistoryProps) {
  // Only show payments belonging to this specific child
  const studentPayments = payments.filter(
    (item) => item.belongsTo === selectedStudentId
  );

  return (
    <div className="card payment-history-card">
      <div className="card-title">PAYMENT RECEIPTS & TRANSACTIONS</div>

      {studentPayments.length === 0 ? (
        <p className="empty-history">
          No previous payment receipts on file for this student.
        </p>
      ) : (
        <div className="history-list">
          {studentPayments.map((receipt) => (
            <div key={receipt.id} className="history-item">
              <div className="history-meta">
                <strong>Receipt #{receipt.id}</strong>
                <span className="timestamp">{receipt.dateTime}</span>
              </div>

              <div className="history-finance">
                <span className="amount-text text-success">
                  +₹{receipt.amount.toLocaleString()}
                </span>
                <span className="status-badge paid">SUCCESS</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;
