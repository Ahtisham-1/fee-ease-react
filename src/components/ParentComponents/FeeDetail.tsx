import type { Payment } from "./PayFeesForm";
export interface FeeObligation {
  id: string;
  studentId: string;
  feeAmount: number;
  month: string;
  feeType: string;
  feeStatus: string;
}

interface FeeDetailProps {
  feeObligation: FeeObligation[];
  payments: Payment[];
}

function FeeDetail({ feeObligation, payments }: FeeDetailProps) {
  const totalFees = feeObligation
    .filter((fee) => fee.feeAmount)
    .reduce((acc, curr) => acc + curr.feeAmount, 0);

  const totalPaid = payments
    .filter((pay) => pay.amount)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netbalance = totalFees - totalPaid;
  let remainingbalance = totalPaid;
  return (
    <div>
      <div>
        <div>Pending fees:{totalFees}</div>
        <div>paid fees:{totalPaid}</div>
        <div>netbalance fees:{netbalance}</div>
      </div>

      <div>
        <ul>
          {feeObligation.map((item) => {
            let money = remainingbalance >= item.feeAmount;
            if (money) {
              remainingbalance = remainingbalance - item.feeAmount;
            }
            return (
              <li key={item.id}>
                {item.month} | {item.feeType} | {item.feeAmount} |
                {money ? "paid" : "Pending"}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
export default FeeDetail;
