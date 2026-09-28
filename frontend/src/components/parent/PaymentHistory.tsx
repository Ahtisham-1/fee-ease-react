import type { Payment } from "../../types";
import { formatRupees, formatTimestamp } from "../../utils/format";
import { ReceiptIcon, CheckCircleIcon, AlertCircleIcon } from "../common/Icons";

export interface PaymentHistoryProps {
  payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  // Newest receipts first
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
  );

  return (
    <div className="card payment-history-card" role="region" aria-label="Transaction Receipts">
      <div className="card-title text-center">
        <ReceiptIcon className="title-icon" />
        <span>PAYMENT HISTORY & RECEIPTS</span>
      </div>

      <div className="history-list scrollable-feed">
        {sortedPayments.length === 0 ? (
          <p className="empty-history text-center">
            No transaction records found for this student.
          </p>
        ) : (
          sortedPayments.map((receipt) => {
            const isSuccess = receipt.status === "SUCCESS";

            return (
              <div
                key={receipt.id}
                className={`history-item ${isSuccess ? "success-receipt-item" : "failed-receipt-item"}`}
              >
                <div className="history-meta">
                  <span className="receipt-id">
                    <ReceiptIcon className="item-icon-inline" />
                    <span>Receipt: {receipt.id}</span>
                  </span>
                  <span className="timestamp">{formatTimestamp(receipt.dateTime)}</span>

                  {!isSuccess && (
                    <span className="failure-note">
                      Declined by issuing bank • Balance not deducted
                    </span>
                  )}
                </div>

                <div className="history-finance">
                  <span
                    className={`amount-text ${
                      isSuccess ? "text-success" : "text-danger strikethrough"
                    }`}
                  >
                    {formatRupees(receipt.amount)}
                  </span>

                  <span
                    className={`status-badge ${
                      isSuccess ? "paid" : "danger-badge"
                    }`}
                  >
                    {isSuccess ? (
                      <>
                        <CheckCircleIcon className="badge-icon" />
                        <span>Success</span>
                      </>
                    ) : (
                      <>
                        <AlertCircleIcon className="badge-icon" />
                        <span>Failed</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default PaymentHistory;
