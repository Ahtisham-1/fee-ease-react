import PayFeesForm from "./PayFeesForm";
import type { Payment } from "../components/PayFeesForm";

interface PaymentHistoryProps {
  payments: Payment[];
}

function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <>
      <div>
        <ul>
          {payments.map((items) => (
            <li key={items.id}>
              Payment History: Rs:{items.amount} | {items.dateTime}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
export default PaymentHistory;
