import { useState } from "react";
export interface Payment {
  amount: number;
  dateTime: string;
  belongsTo: string;
  id: string;
}
export interface PayFeesFormProps {
  onSubmitPayment: (amount: number) => void;
}

function PayFeesForm({ onSubmitPayment }: PayFeesFormProps) {
  const [inputAmount, setInputAmount] = useState("");

  function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    onSubmitPayment(Number(inputAmount));
    setInputAmount("");
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
