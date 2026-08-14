export type FeeStatus = "paid" | "pending";
export type FeeType = "tuition" | "tuition+transport";
import type { Payment } from "./PayFeesForm";

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
    <div className="card">
      <div className="card-title">FEE OBLIGATIONS & SUMMARY</div>

      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-label">TOTAL FEES</span>
          <span className="stat-value">₹{totalFees}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">TOTAL PAID</span>
          <span className="stat-value">₹{totalPaid}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">NET BALANCE</span>
          <span className="stat-value balance">₹{netBalance}</span>
        </div>
      </div>

      <ul className="month-list">
        {feeObligation.map((list) => {
          const isPaid = remainingMoney >= list.feeAmount;
          if (isPaid) {
            remainingMoney = remainingMoney - list.feeAmount;
          }
          const currentStatus = isPaid ? "paid" : "pending";

          return (
            <li key={list.id} className="month-item">
              <span className="month-info">
                {list.month} Fee ({list.feeType}): ₹{list.feeAmount}
              </span>
              <span className={`status-badge ${currentStatus}`}>
                {currentStatus}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FeeDetail;
