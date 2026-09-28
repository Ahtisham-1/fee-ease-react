import type { Payment, Student } from "../../types";
import { formatRupees, formatTimestamp } from "../../utils/format";
import { ReceiptIcon, CheckCircleIcon, AlertCircleIcon, UserIcon } from "../common/Icons";

export interface AdminPaymentHistoryProps {
  payments: Payment[];
  students: Student[];
}

export function AdminPaymentHistory({
  payments,
  students,
}: AdminPaymentHistoryProps) {
  // Index students once instead of scanning the array for every receipt.
  const studentsById = new Map(students.map((student) => [student.id, student]));

  // Newest receipts first
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
  );

  return (
    <div className="card admin-history-card" role="region" aria-label="School Audit Log">
      <div className="card-title text-center">
        <ReceiptIcon className="title-icon" />
        <span>SCHOOL-WIDE TRANSACTION AUDIT LOG</span>
      </div>

      <div className="history-list scrollable-feed">
        {sortedPayments.length === 0 ? (
          <p className="empty-history text-center">
            No payments have been received school-wide yet.
          </p>
        ) : (
          sortedPayments.map((receipt) => {
            const student = studentsById.get(receipt.belongsTo);
            const isSuccess = receipt.status === "SUCCESS";

            return (
              <div
                key={receipt.id}
                className={`history-item ${
                  isSuccess ? "success-receipt-item" : "failed-receipt-item"
                }`}
              >
                <div className="history-meta">
                  <span className="student-name">
                    <UserIcon className="item-icon-inline" />
                    <span>{student ? student.name : "Student (Archived)"}</span>
                    {student && (
                      <span className="grade-tag" style={{ marginLeft: "0.4rem" }}>
                        Class {student.gradeName}
                      </span>
                    )}
                  </span>
                  <span className="timestamp">
                    Receipt: {receipt.id} • {formatTimestamp(receipt.dateTime)}
                  </span>
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

export default AdminPaymentHistory;
