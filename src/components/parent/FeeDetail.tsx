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

      {/* Monthly Fee Schedule Feed */}
      <div className="history-list scrollable-feed">
        {sequentialKnockoutSchedule.length === 0 ? (
          <p className="empty-history text-center">
            No fee obligations assigned for this academic session.
          </p>
        ) : (
          sequentialKnockoutSchedule.map((obligation) => (
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
                <span className="amount-text">
                  ₹{obligation.feeAmount.toLocaleString("en-IN")}
                </span>
                <span
                  className={`status-badge ${
                    obligation.feeStatus === "paid" ? "paid" : "pending"
                  }`}
                >
                  {obligation.feeStatus === "paid" ? (
                    <>
                      <CheckCircleIcon className="badge-icon" />
                      <span>Cleared</span>
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
          ))
        )}
      </div>
    </div>
  );
}

export default FeeDetail;
