import type { Payment } from "./ParentComponents/PayFeesForm";

interface PaymentHistoryProps {
  payments: Payment[];
}

function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <div className="card">
      <div className="card-title">PAYMENT HISTORY</div>
      {payments.length === 0 ? (
        <p className="empty-history">No payment records found for this student.</p>
      ) : (
        <ul className="history-list">
          {payments.map((item) => (
            <li key={item.id} className="history-item">
              <span className="history-amount">₹{item.amount}</span>
              <span className="history-date">{item.dateTime}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PaymentHistory;
