import { useState } from "react";

export interface Payment {
  amount: number;
  dateTime: string;
  belongsTo: string;
  id: string;
}
interface PayFeesFormProps {
  onSubmitPayment: (amount: number) => void;
  netbalance: number;
}
function PayFeesForm({ onSubmitPayment, netbalance }: PayFeesFormProps) {
  const [inputAmount, setInputAmount] = useState("");

  function handleInput(e: React.FormEvent) {
    e.preventDefault();
    if (Number(inputAmount) <= 0) {
      alert("enter valid input");
    } else if (netbalance <= 0) {
      alert("no fees for the student ");
    } else if (Number(inputAmount) > netbalance) {
      alert(`you dont owe this much your current money is ${netbalance} `);
    } else {
      onSubmitPayment(Number(inputAmount));
      setInputAmount("");
    }
  }
  return (
    <div>
      <form onSubmit={handleInput}>
        <input
          type="number"
          placeholder="Enter your input"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
export default PayFeesForm;
