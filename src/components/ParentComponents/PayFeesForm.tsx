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
    <div className="card">
      <div className="card-title">PAY FEES</div>
      <form onSubmit={handlePayment} className="pay-form">
        <input
          type="number"
          className="pay-input"
          placeholder="Enter payment amount (₹)"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
        />
        <button type="submit" className="pay-btn">
          Submit Amount
        </button>
      </form>
    </div>
  );
}

export default PayFeesForm;


