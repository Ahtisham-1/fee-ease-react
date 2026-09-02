import { useState } from "react";
import type { Student } from "../../types";
import { WalletIcon, XIcon, ShieldIcon, CheckIcon } from "../common/Icons";

export interface PayFeesFormProps {
  student: Student | undefined;
  netPendingBalance: number;
  onPayFee: (amount: number) => void;
}

export function PayFeesForm({
  student,
  netPendingBalance,
  onPayFee,
}: PayFeesFormProps) {
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>("");
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState<string | null>(null);

  const numericAmount = Number(paymentAmountInput) || 0;
  const remainingAfterPayment = Math.max(0, netPendingBalance - numericAmount);

  function handleInitiatePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationErrorMessage(null);

    const validAmount = Number(paymentAmountInput);

    if (isNaN(validAmount) || validAmount <= 0) {
      setValidationErrorMessage("Please enter a valid positive payment amount.");
      return;
    }

    if (netPendingBalance <= 0) {
      setValidationErrorMessage("No pending fee balance remaining for this student.");
      return;
    }

    if (validAmount > netPendingBalance) {
      setValidationErrorMessage(
        `Payment amount cannot exceed the pending balance of ₹${netPendingBalance.toLocaleString("en-IN")}.`
      );
      return;
    }

    setIsConfirmationModalOpen(true);
  }

  function handleCancelPayment() {
    setIsConfirmationModalOpen(false);
  }

  function handleConfirmAndProceedPayment() {
    const validAmount = Number(paymentAmountInput);
    onPayFee(validAmount);
    setPaymentAmountInput("");
    setIsConfirmationModalOpen(false);
  }

  const isFormDisabled = !student || netPendingBalance <= 0;

  return (
    <div className="card pay-fees-card" role="region" aria-label="Fee Payment Form">
      <div className="card-title text-center">
        <WalletIcon className="title-icon" />
        <span>SUBMIT FEE PAYMENT</span>
      </div>

      <form onSubmit={handleInitiatePayment} className="pay-form-vertical">
        <div className="input-group">
          <label htmlFor="payment-amount-input" className="box-label">
            ENTER PAYMENT AMOUNT (₹)
          </label>
          <div className="currency-input-wrapper">
            <span className="currency-symbol">₹</span>
            <input
              id="payment-amount-input"
              type="number"
              className="number-input"
              placeholder={isFormDisabled ? "0" : "Enter amount to pay"}
              value={paymentAmountInput}
              onChange={(e) => {
                setPaymentAmountInput(e.target.value);
                if (validationErrorMessage) setValidationErrorMessage(null);
              }}
              min="1"
              max={netPendingBalance}
              disabled={isFormDisabled}
            />
          </div>
        </div>

        {/* Real-time Payment Impact Preview (Parent Satisfaction) */}
        {!isFormDisabled && numericAmount > 0 && numericAmount <= netPendingBalance && (
          <div className="payment-impact-preview">
            <span className="impact-label">Remaining Dues After Payment:</span>
            <strong className={`impact-value ${remainingAfterPayment === 0 ? "text-emerald" : "text-amber"}`}>
              ₹{remainingAfterPayment.toLocaleString("en-IN")} {remainingAfterPayment === 0 ? "(Fully Cleared)" : ""}
            </strong>
          </div>
        )}

        {validationErrorMessage && (
          <div className="error-banner" role="alert">
            {validationErrorMessage}
          </div>
        )}

        <button
          type="submit"
          className="pay-btn full-width-btn"
          disabled={isFormDisabled || !paymentAmountInput}
        >
          <WalletIcon className="btn-icon" />
          <span>
            {netPendingBalance <= 0
              ? "All Fees Cleared"
              : `Proceed to Pay ₹${Number(paymentAmountInput) || 0}`}
          </span>
        </button>
      </form>

      {/* Confirmation Modal */}
      {isConfirmationModalOpen && (
        <div
          className="modal-overlay"
          onClick={handleCancelPayment}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-confirm-title"
        >
          <div
            className="modal-card confirmation-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="modal-confirm-title" className="modal-title">
                CONFIRM FEE PAYMENT
              </h3>
            </div>

            <div className="confirmation-body">
              <p className="confirmation-subtext">
                You are authorizing an online school fee payment for:
              </p>

              <div className="confirmation-amount-box">
                <span className="confirmation-label">STUDENT BENEFICIARY:</span>
                <strong className="confirmation-student">
                  {student?.name} (Class {student?.gradeName})
                </strong>
                <span className="confirmation-amount">
                  ₹{Number(paymentAmountInput).toLocaleString("en-IN")}
                </span>
                <span className="timestamp" style={{ color: "var(--emerald-dark)", fontWeight: 700 }}>
                  {remainingAfterPayment === 0 ? "✅ This will clear all pending monthly obligations!" : `Remaining Debt After Payment: ₹${remainingAfterPayment.toLocaleString("en-IN")}`}
                </span>
              </div>

              <p className="security-notice">
                <ShieldIcon className="security-icon" />
                <span>Encrypted Banking Gateway • Instant Ledger Settlement</span>
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="role-btn cancel-btn"
                onClick={handleCancelPayment}
              >
                <XIcon className="btn-icon" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                className="pay-btn confirm-proceed-btn"
                onClick={handleConfirmAndProceedPayment}
              >
                <CheckIcon className="btn-icon" />
                <span>Proceed & Pay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayFeesForm;
