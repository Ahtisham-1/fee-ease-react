import type { Payment } from "./PayFeesForm";

interface PaymentHistoryProps {
  payments: Payment[];
}

function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <div>
      <div>
        <h2>Payment History</h2>
      </div>

      <div>
        {payments.length === 0 ? (
          "NO Payment history of this student"
        ) : (
          <ul>
            {payments.map((item) => (
              <li key={item.id}>
                <span>{item.amount}</span>
                <span>{item.dateTime}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PaymentHistory;
