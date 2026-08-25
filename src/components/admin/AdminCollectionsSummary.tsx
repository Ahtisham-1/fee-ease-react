import type { Payment } from "../../types";

export interface AdminCollectionsSummaryProps {
  payments: Payment[];
}

export function AdminCollectionsSummary({
  payments,
}: AdminCollectionsSummaryProps) {
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const transactionCount = payments.length;

  return (
    <div className="card admin-summary-card">
      <div className="card-title">COLLECTIONS OVERVIEW</div>

      <div className="summary-stats">
        <div className="stat-box highlight">
          <span className="stat-label">TOTAL SCHOOL REVENUE</span>
          <span className="stat-value text-success">
            ₹{totalRevenue.toLocaleString()}
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-label">SETTLED TRANSACTIONS</span>
          <span className="stat-value">{transactionCount} Receipts</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">AVERAGE PAYMENT</span>
          <span className="stat-value">
            ₹
            {transactionCount > 0
              ? Math.round(totalRevenue / transactionCount).toLocaleString()
              : 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminCollectionsSummary;
