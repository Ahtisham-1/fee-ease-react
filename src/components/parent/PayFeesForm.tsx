import { useState } from "react";

export interface PayFeesFormProps {
  netBalance: number;
  onSubmitPayment: (amount: number) => void;
}

/**
 * PayFeesForm Component
 * 
 * Purpose:
 * Provides a secure, validated interface for parents to submit online fee payments.
 * 
 * Key Architectural Decisions:
 * 1. 3-Tier Defensive Validation: Blocks negative numbers, zero balances, and overpayments.
 * 2. Two-Step Authorization Modal: Requires explicit parent confirmation before debiting funds.
 * 3. Controlled State Isolation: Retains transaction state locally until confirmed by the user.
 */
export function PayFeesForm({
  netBalance,
  onSubmitPayment,
}: PayFeesFormProps) {
  // Local Form State
  const [paymentInputValue, setPaymentInputValue] = useState("");
  const [validationErrorMessage, setValidationErrorMessage] = useState<string | null>(null);

  // Two-Step Confirmation State
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState<number | null>(null);

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationErrorMessage(null);

    const parsedAmount = Number(paymentInputValue);

    // Defensive Guard 1: Must be a positive numeric value
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationErrorMessage("Please enter a valid positive payment amount.");
      return;
    }

    // Defensive Guard 2: No balance currently due
    if (netBalance <= 0) {
      setValidationErrorMessage("All fees are fully settled. No pending balance due.");
      return;
    }

    // Defensive Guard 3: Overpayment prevention
    if (parsedAmount > netBalance) {
      setValidationErrorMessage(
        `Payment amount exceeds current balance. Maximum payable is ₹${netBalance.toLocaleString("en-IN")}.`
      );
      return;
    }

    // Open Confirmation Dialog
    setPendingPaymentAmount(parsedAmount);
    setIsConfirmationModalVisible(true);
  }

  function handleCancelPayment() {
    setIsConfirmationModalVisible(false);
    setPendingPaymentAmount(null);
  }

  function handleConfirmAndProceedPayment() {
    if (pendingPaymentAmount && pendingPaymentAmount > 0) {
      onSubmitPayment(pendingPaymentAmount);
    }
    setIsConfirmationModalVisible(false);
    setPendingPaymentAmount(null);
    setPaymentInputValue("");
  }

  return (
    <div className="card pay-fees-card" role="region" aria-label="Fee Payment Form">
      <div className="card-title text-center">SUBMIT ONLINE FEE PAYMENT</div>

      <form onSubmit={handleFormSubmit} className="vertical-pay-form">
        <div className="input-group full-width">
          <label htmlFor="payment-amount-input" className="input-label">
            Enter Payment Amount (₹)
          </label>
          <div className="currency-input-wrapper">
            <span className="currency-symbol" aria-hidden="true">
              ₹
            </span>
            <input
              id="payment-amount-input"
              type="number"
              className="number-input full-width-input"
              placeholder={
                netBalance > 0
                  ? `Enter amount (Max: ₹${netBalance.toLocaleString("en-IN")})`
                  : "0"
              }
              value={paymentInputValue}
              onChange={(e) => {
                setPaymentInputValue(e.target.value);
                if (validationErrorMessage) setValidationErrorMessage(null);
              }}
              disabled={netBalance <= 0}
              min="1"
              max={netBalance}
              aria-label="Payment Amount in Rupees"
            />
          </div>
        </div>

        {validationErrorMessage && (
          <div className="error-banner" role="alert">
            ⚠️ {validationErrorMessage}
          </div>
        )}

        <button
          type="submit"
          className="pay-btn full-width-btn mt-3"
          disabled={netBalance <= 0 || !paymentInputValue}
        >
          {netBalance <= 0
            ? "✅ Fees Fully Settled"
            : `💳 Pay ₹${Number(paymentInputValue) || 0} Towards Balance`}
        </button>
      </form>

      {/* ========================================== */}
      {/* TWO-STEP CONFIRMATION MODAL DIALOG         */}
      {/* ========================================== */}
      {isConfirmationModalVisible && pendingPaymentAmount && (
        <div
          className="modal-overlay"
          onClick={handleCancelPayment}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            className="modal-card confirmation-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="confirm-modal-title" className="modal-title">
                CONFIRM ONLINE PAYMENT
              </h3>
            </div>

            <div className="confirmation-body">
              <p className="confirmation-subtext">
                Please verify your transaction details before proceeding:
              </p>

              <div className="confirmation-amount-box">
                <span className="confirmation-label">AMOUNT TO DEBIT:</span>
                <strong className="confirmation-amount">
                  ₹{pendingPaymentAmount.toLocaleString("en-IN")}
                </strong>
              </div>

              <p className="security-notice">
                🔒 Authorizing will generate an official receipt and update your student fee ledger.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="role-btn cancel-btn"
                onClick={handleCancelPayment}
              >
                ❌ Cancel
              </button>

              <button
                type="button"
                className="pay-btn confirm-proceed-btn"
                onClick={handleConfirmAndProceedPayment}
              >
                ✅ Proceed & Authorize ₹{pendingPaymentAmount.toLocaleString("en-IN")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayFeesForm;
