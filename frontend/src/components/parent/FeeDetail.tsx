import type { Student, FeeObligation, Payment } from "../../types";
import {
  getStudentFinancialSummary,
  calculateSequentialFeeKnockout,
} from "../../utils/feeCalculator";
import { CreditCardIcon, CheckCircleIcon, AlertCircleIcon, CalendarIcon } from "../common/Icons";

export interface FeeDetailProps {
  student: Student | undefined;
  feeObligations: FeeObligation[];
  payments: Payment[];
}

export function FeeDetail({
  student,
  feeObligations,
  payments,
}: FeeDetailProps) {
  if (!student) {
    return (
      <div className="card fee-detail-card empty-state-card" role="region" aria-label="Fee Ledger">
        <div className="card-title text-center">STUDENT FEE LEDGER</div>
        <p className="empty-message text-center">No student selected.</p>
      </div>
    );
  }

  const { totalAssigned, totalPaid, netBalance } = getStudentFinancialSummary(
    student.id,
    feeObligations,
    payments
  );

  const sequentialKnockoutSchedule = calculateSequentialFeeKnockout(
    student.id,
    feeObligations,
    payments
  );

  return (
    <div className="card fee-detail-card" role="region" aria-label="Fee Ledger Breakdown">
      <div className="card-title text-center">
        <CreditCardIcon className="title-icon" />
        <span>FEE BREAKDOWN — {student.name.toUpperCase()} (CLASS {student.gradeName})</span>
      </div>

      {/* Top Stats Ribbon */}
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-label">TOTAL ASSIGNED</span>
          <strong className="stat-value">₹{totalAssigned.toLocaleString("en-IN")}</strong>
        </div>

        <div className="stat-box">
          <span className="stat-label">TOTAL PAID</span>
          <strong className="stat-value text-success">
            ₹{totalPaid.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="stat-box">
          <span className="stat-label">NET BALANCE</span>
          <strong
            className={`stat-value ${
              netBalance === 0 ? "text-success" : "text-amber"
            }`}
          >
            ₹{netBalance.toLocaleString("en-IN")}
          </strong>
        </div>
      </div>

      {/* Real-time Settlement Status Ribbon */}
      {netBalance === 0 && sequentialKnockoutSchedule.length > 0 && (
        <div style={{
          background: "var(--success-bg)",
          border: "1px solid var(--success-border)",
          color: "var(--success-text)",
          padding: "0.55rem 0.85rem",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          margin: "0.75rem 0",
        }}>
          <CheckCircleIcon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
          <span>All assigned fee obligations for {student.name} are fully settled!</span>
        </div>
      )}

      {netBalance > 0 && (
        <div style={{
          background: "var(--warning-bg)",
          border: "1px solid var(--warning-border)",
          color: "var(--warning-text)",
          padding: "0.55rem 0.85rem",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          margin: "0.75rem 0",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertCircleIcon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
            <span>Outstanding dues requiring payment:</span>
          </span>
          <strong style={{ fontSize: "0.9rem" }}>₹{netBalance.toLocaleString("en-IN")}</strong>
        </div>
      )}

      {/* Monthly Fee Schedule Feed */}
      <div className="history-list scrollable-feed">
        {sequentialKnockoutSchedule.length === 0 ? (
          <p className="empty-history text-center">
            No fee obligations assigned for this academic session.
          </p>
        ) : (
          sequentialKnockoutSchedule.map((obligation) => {
            const isFullyCleared = obligation.isCovered;
            const isPartiallyPaid = obligation.paidAmount > 0 && !isFullyCleared;

            return (
              <div key={obligation.id} className="history-item">
                <div className="history-meta">
                  <strong className="month-name">
                    <CalendarIcon className="item-icon-inline" />
                    <span>{obligation.month} {obligation.academicYear}</span>
                  </strong>
                  <span className="fee-type-tag">
                    {obligation.feeType === "tuition+transport"
                      ? "Tuition + Bus Transport"
                      : "Tuition Fee"}
                  </span>
                </div>

                <div className="history-finance">
                  <div className="monthly-financial-pill">
                    <span className="amount-text">
                      ₹{obligation.feeAmount.toLocaleString("en-IN")}
                    </span>

                    {/* Real-time Monthly Net Balance Feedback */}
                    {isPartiallyPaid && (
                      <span className="monthly-sub-status text-amber">
                        Paid: ₹{obligation.paidAmount.toLocaleString("en-IN")} • Due: ₹{obligation.remainingDue.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <span
                    className={`status-badge ${
                      isFullyCleared ? "paid" : "pending"
                    }`}
                  >
                    {isFullyCleared ? (
                      <>
                        <CheckCircleIcon className="badge-icon" />
                        <span>Cleared</span>
                      </>
                    ) : isPartiallyPaid ? (
                      <>
                        <AlertCircleIcon className="badge-icon" />
                        <span>Due: ₹{obligation.remainingDue.toLocaleString("en-IN")}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircleIcon className="badge-icon" />
                        <span>Due</span>
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

export default FeeDetail;
