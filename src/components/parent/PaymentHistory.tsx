import type { Payment } from "../../types";

export interface PaymentHistoryProps {
  payments: Payment[];
  selectedStudentId: string;
}

/**
 * Helper to display a clean truncated receipt identifier.
 */
function formatReceiptIdentifier(rawId: string): string {
  return rawId.length > 8 ? `Receipt #${rawId.slice(-6)}` : `Receipt #${rawId}`;
}

/**
 * PaymentHistory Component
 * 
 * Purpose:
 * Displays a chronological audit feed of all payment transactions (both successful
 * and declined) associated with the active student account.
 * 
 * Key Architectural Decisions:
 * 1. Multi-Status Auditing: Renders green SUCCESS receipts alongside red FAILED alerts.
 * 2. High-Contrast Typography: Clearly demarcates timestamps, receipt IDs, and debited amounts.
 * 3. Self-Contained Scrolling: Constrained to an internal scrollable feed to preserve layout symmetry.
 */
export function PaymentHistory({
  payments,
  selectedStudentId,
}: PaymentHistoryProps) {
  // Filter receipts belonging strictly to the active student
  const studentReceipts = payments.filter(
    (item) => item.belongsTo === selectedStudentId
  );

  return (
    <div className="card payment-history-card" role="region" aria-label="Payment Receipts History">
      <div className="card-title text-center">PAYMENT HISTORY</div>

      {studentReceipts.length === 0 ? (
        <p className="empty-history text-center">
          No previous payment receipts on file for this student.
        </p>
      ) : (
        <div className="history-list scrollable-feed">
          {studentReceipts.map((receipt) => {
            const isSuccess = receipt.status === "SUCCESS";

            return (
              <div
                key={receipt.id}
                className={`history-item ${!isSuccess ? "failed-receipt-item" : ""}`}
              >
                <div className="history-meta">
                  <strong className="receipt-id">
                    {formatReceiptIdentifier(receipt.id)}
                  </strong>
                  <span className="timestamp">{receipt.dateTime}</span>
                  {!isSuccess && (
                    <span className="failure-note">
                      ⚠️ Transaction declined by bank / gateway
                    </span>
                  )}
                </div>

                <div className="history-finance">
                  <span
                    className={`amount-text ${
                      isSuccess ? "text-success" : "text-danger strikethrough"
                    }`}
                  >
                    {isSuccess ? "+" : "✕"}₹{receipt.amount.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`status-badge ${
                      isSuccess ? "paid" : "danger-badge"
                    }`}
                  >
                    {receipt.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;
