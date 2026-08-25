import type { Payment } from "../../types";

export interface AdminCollectionsSummaryProps {
  payments: Payment[];
}

export function AdminCollectionsSummary({
  payments,
}: AdminCollectionsSummaryProps) {
  // Only calculate revenue from SUCCESSFUL payments!
  const successfulPayments = payments.filter((p) => p.status === "SUCCESS");
  const totalRevenue = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const transactionCount = successfulPayments.length;
  const failedCount = payments.filter((p) => p.status === "FAILED").length;

  return (
    <div className="card admin-summary-card">
      <div className="card-title text-center">COLLECTIONS OVERVIEW</div>

      <div className="summary-stats">
        <div className="stat-box highlight">
          <span className="stat-label">TOTAL SCHOOL REVENUE</span>
          <span className="stat-value text-success">
            ₹{totalRevenue.toLocaleString()}
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-label">SETTLED RECEIPTS</span>
          <span className="stat-value">{transactionCount} Settled</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">FAILED ATTEMPTS</span>
          <span
            className={`stat-value ${
              failedCount > 0 ? "text-danger" : "text-muted"
            }`}
          >
            {failedCount} Failed
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminCollectionsSummary;
