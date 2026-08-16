import type { Payment } from "../ParentComponents/PayFeesForm";

export interface AdminCollectionSummaryProps {
  payments: Payment[];
}

function AdminCollectionSummary({ payments }: AdminCollectionSummaryProps) {
  const todayTotal = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyTotal = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const yearlyTotal = payments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="card">
      <div className="card-title">COLLECTIONS-SUMMARY</div>
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-label">TODAY'S TOTAL</span>
          <span className="stat-value">₹{todayTotal}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">MONTHLY TOTAL</span>
          <span className="stat-value">₹{monthlyTotal}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">YEARLY TOTAL</span>
          <span className="stat-value">₹{yearlyTotal}</span>
        </div>
      </div>
    </div>
  );
}
export default AdminCollectionSummary;
