export type FeeStatus = "paid" | "pending";
export type FeeType = "tuition" | "tuition+transport";
import type { Payment } from "../components/PayFeesForm";

export interface FeeObligation {
  id: string;
  studentId: string;
  feeAmount: number;
  month: string;
  receipt?: string;
  feeType: FeeType;
  feeStatus: FeeStatus;
}

export interface FeeDetailProps {
  feeObligation: FeeObligation[];
  payments: Payment[];
}

function FeeDetail({ feeObligation, payments }: FeeDetailProps) {
  const totalFees = feeObligation.reduce(
    (accumulator, currentValue) => accumulator + currentValue.feeAmount,
    0,
  );
  const totalPaid = payments
    .filter((pay) => pay.amount)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalFees - totalPaid;
  let remainingMoney = totalPaid;

  return (
    <div>
      <div>
        <p>
          <strong>Total Fees:</strong> ₹{totalFees}
        </p>

        <p>
          <strong>Total Paid:</strong> ₹{totalPaid}
        </p>

        <p>
          <strong>Net Balance:</strong> ₹{netBalance}
        </p>
      </div>
      <ul>
        {feeObligation.map((list) => {
          const isPaid = remainingMoney >= list.feeAmount;
          if (isPaid) {
            remainingMoney = remainingMoney - list.feeAmount;
          }
          const currentStatus = isPaid ? "paid" : "pending";
          return (
            <li key={list.id}>
              {list.month} | ₹{list.feeAmount} | {currentStatus}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FeeDetail;
