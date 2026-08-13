import { useState } from "react";
export interface Payment {
  amount: number;
  dateTime: string;
  belongsTo: string;
  id: string;
}
export interface PayFeesFormProps {
  onSubmitPayment: (amount: number) => void;
  netbalance: number;
}

function PayFeesForm({ onSubmitPayment, netbalance }: PayFeesFormProps) {
  const [inputAmount, setInputAmount] = useState("");

  function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (Number(inputAmount) <= 0) {
      alert("Please enter a valid amount");
    } else if (netbalance <= 0) {
      alert("All fees for this student are already fully paid");
    } else if (Number(inputAmount) > netbalance) {
      alert(`Payment exceeds balance! You only owe Rs ${netbalance}`);
    } else {
      onSubmitPayment(Number(inputAmount));
      setInputAmount("");
    }
  }
  return (
    <>
      <form onSubmit={handlePayment}>
        <input
          type="number"
          placeholder="Enter your amount"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
        />

        <button>Submit</button>
      </form>
    </>
  );
}
export default PayFeesForm;
