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

export function FeeDetail({
  feeObligations,
  payments,
  selectedStudentId,
}: FeeDetailProps) {
  // 1. Filter raw obligations and payments for the active student
  const studentObligations = feeObligations.filter(
    (item) => item.studentId === selectedStudentId
  );
  const studentPayments = payments.filter(
    (item) => item.belongsTo === selectedStudentId
  );

  // 2. Derive high-level financial summary
  const { totalFees, totalPaid, netBalance } = getStudentFinancialSummary(
    selectedStudentId,
    feeObligations,
    payments
  );

  // 3. Run the Sequential Wallet Knockout algorithm
  const knockoutList = calculateSequentialFeeKnockout(
    studentObligations,
    totalPaid
  );

  return (
    <div className="card fee-detail-card">
      <div className="card-title">STUDENT FEE STATEMENT</div>

      {/* 3 Summary Metric Cards */}
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-label">TOTAL ASSIGNED FEES</span>
          <span className="stat-value">₹{totalFees.toLocaleString()}</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">TOTAL PAID TO DATE</span>
          <span className="stat-value text-success">
            ₹{totalPaid.toLocaleString()}
          </span>
        </div>

        <div className="stat-box highlight">
          <span className="stat-label">CURRENT NET BALANCE</span>
          <span
            className={`stat-value ${
              netBalance === 0 ? "text-success" : "text-danger"
            }`}
          >
            ₹{netBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Monthly Breakdown Feed */}
      <div className="fee-breakdown-section">
        <h3 className="section-subtitle">MONTHLY FEE OBLIGATIONS</h3>

        {knockoutList.length === 0 ? (
          <p className="empty-history">
            No fee obligations assigned to this student yet.
          </p>
        ) : (
          <div className="history-list">
            {knockoutList.map((bill) => (
              <div key={bill.id} className="history-item">
                <div className="history-meta">
                  <strong className="month-name">{bill.month} Session</strong>
                  <span className="fee-type-tag">{bill.feeType}</span>
                </div>

                <div className="history-finance">
                  <span className="amount-text">
                    ₹{bill.feeAmount.toLocaleString()}
                  </span>
                  <span
                    className={`status-badge ${
                      bill.isCovered ? "paid" : "pending"
                    }`}
                  >
                    {bill.isCovered ? "PAID" : "PENDING"}
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
