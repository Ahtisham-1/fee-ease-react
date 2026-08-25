import type { FeeObligation, Payment } from "../../types";
import {
  getStudentFinancialSummary,
  calculateSequentialFeeKnockout,
} from "../../utils/feeCalculator";

export interface FeeDetailProps {
  feeObligations: FeeObligation[];
  payments: Payment[];
  selectedStudentId: string;
}

/**
 * Helper to format raw numbers into standard Indian Rupee notation.
 */
function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * FeeDetail Component
 * 
 * Purpose:
 * Renders the comprehensive financial ledger for the currently selected student.
 * 
 * Key Architectural Decisions:
 * 1. Decoupled Business Engine: Delegates summary totals & sequential knockout to pure utility functions.
 * 2. High-Contrast KPI Cards: Displays Total Fees, Total Paid, and Net Balance due.
 * 3. Chronological Obligation Feed: Displays monthly fee obligations with real-time status badges.
 */
export function FeeDetail({
  feeObligations,
  payments,
  selectedStudentId,
}: FeeDetailProps) {
  // Filter obligations assigned specifically to this child
  const studentObligations = feeObligations.filter(
    (item) => item.studentId === selectedStudentId
  );

  // Derive high-level financial summary (Total Fees, Total Paid, Net Balance)
  const financialSummary = getStudentFinancialSummary(
    selectedStudentId,
    feeObligations,
    payments
  );

  // Execute Sequential Wallet Knockout algorithm
  const sequentialKnockoutList = calculateSequentialFeeKnockout(
    studentObligations,
    financialSummary.totalPaid
  );

  return (
    <div className="card fee-detail-card" role="region" aria-label="Student Fee Statement">
      <div className="card-title text-center">STUDENT FEE STATEMENT</div>

      {/* High-Level Financial Metrics */}
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-label">TOTAL FEES:</span>
          <span className="stat-value">
            {formatRupees(financialSummary.totalFees)}
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-label">TOTAL PAID:</span>
          <span className="stat-value text-success">
            {formatRupees(financialSummary.totalPaid)}
          </span>
        </div>

        <div className="stat-box highlight">
          <span className="stat-label">NET BALANCE:</span>
          <span
            className={`stat-value ${
              financialSummary.netBalance === 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatRupees(financialSummary.netBalance)}
          </span>
        </div>
      </div>

      {/* Scrollable Monthly Fee Breakdown */}
      <div className="fee-breakdown-section">
        <div className="section-header-mini">
          <span className="stat-label">MONTHLY FEE BREAKDOWN</span>
        </div>

        {sequentialKnockoutList.length === 0 ? (
          <p className="empty-history text-center">
            No fee obligations assigned to this student yet.
          </p>
        ) : (
          <div className="history-list scrollable-feed">
            {sequentialKnockoutList.map((obligation) => (
              <div key={obligation.id} className="history-item">
                <div className="history-meta">
                  <strong className="month-name">{obligation.month}</strong>
                  <span className="fee-type-tag">({obligation.feeType})</span>
                </div>

                <div className="history-finance">
                  <span className="amount-text">
                    {formatRupees(obligation.feeAmount)}
                  </span>
                  <span
                    className={`status-badge ${
                      obligation.isCovered ? "paid" : "pending"
                    }`}
                  >
                    {obligation.isCovered ? "PAID" : "PENDING"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeeDetail;
