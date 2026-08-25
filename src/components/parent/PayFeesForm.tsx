import { useState } from "react";

export interface PayFeesFormProps {
  netBalance: number;
  onSubmitPayment: (amount: number) => void;
}

export function PayFeesForm({
  netBalance,
  onSubmitPayment,
}: PayFeesFormProps) {
  const [inputAmount, setInputAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = Number(inputAmount);

    // Guard 1: Zero or negative amount
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter a valid positive payment amount.");
      return;
    }

    // Guard 2: No balance owed
    if (netBalance <= 0) {
      setErrorMessage("All fees are fully settled. No pending balance due.");
      return;
    }

    // Guard 3: Overpayment prevention
    if (numericAmount > netBalance) {
      setErrorMessage(
        `Payment exceeds balance. Maximum payable is ₹${netBalance.toLocaleString()}.`
      );
      return;
    }

    // Success dispatch & form reset
    onSubmitPayment(numericAmount);
    setInputAmount("");
  }

  return (
    <div className="card pay-fees-card">
      <div className="card-title">SUBMIT ONLINE FEE PAYMENT</div>

      <form onSubmit={handleSubmit} className="pay-form">
        <div className="input-group">
          <label className="input-label">Enter Amount to Pay (₹)</label>
          <div className="currency-input-wrapper">
            <span className="currency-symbol">₹</span>
            <input
              type="number"
              className="number-input"
              placeholder={netBalance > 0 ? `Max: ${netBalance}` : "0"}
              value={inputAmount}
              onChange={(e) => {
                setInputAmount(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={netBalance <= 0}
            />
          </div>
        </div>

        {errorMessage && <div className="error-banner">⚠️ {errorMessage}</div>}

        <button
          type="submit"
          className="pay-btn"
          disabled={netBalance <= 0 || !inputAmount}
        >
          {netBalance <= 0
            ? "✅ Fees Fully Settled"
            : `Pay ₹${Number(inputAmount) || 0} Towards Balance`}
        </button>
      </form>
    </div>
  );
}

export default PayFeesForm;
