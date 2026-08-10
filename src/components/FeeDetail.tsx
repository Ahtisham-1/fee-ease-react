export type FeeStatus = "paid" | "pending";
export type FeeType = "tuition" | "tuition+transport";
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
}

function FeeDetail({ feeObligation }: FeeDetailProps) {
  const totalFees = feeObligation.reduce(
    (accumulator, currentValue) => accumulator + currentValue.feeAmount,
    0,
  );
  const totalPaid = feeObligation
    .filter((studentPaid) => studentPaid.feeStatus === "paid")
    .reduce((acc, curr) => acc + curr.feeAmount, 0);

  const netBalance = totalFees - totalPaid;

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
        {feeObligation.map((list) => (
          <li key={list.id}>
            {list.month} | {list.feeAmount} | {list.feeStatus}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FeeDetail;
