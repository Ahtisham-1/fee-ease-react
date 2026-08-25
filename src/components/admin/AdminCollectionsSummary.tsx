import type { Payment } from "../../types";

export interface AdminCollectionsSummaryProps {
  payments: Payment[];
}

/**
 * Helper to format raw numbers into standard Indian Rupee notation.
 */
function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * AdminCollectionsSummary Component
 * 
 * Purpose:
 * Renders the school administration's real-time collections breakdown across 3 primary
 * temporal dimensions: Daily (Today), Monthly (This Month), and Yearly (This Year).
 * 
 * Key Architectural Decisions:
 * 1. Verified Revenue Only: Only payments with status === "SUCCESS" are aggregated.
 * 2. Temporal Aggregation: Dynamically compares transaction timestamps against current calendar date.
 * 3. High-Contrast KPI Cards: 3 prominent stat boxes designed for rapid administrative scanning.
 */
export function AdminCollectionsSummary({
  payments,
}: AdminCollectionsSummaryProps) {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter strictly verified successful payments
  const successfulPayments = payments.filter((p) => p.status === "SUCCESS");

  // 1. Calculate Today's Revenue
  const todayRevenue = successfulPayments
    .filter((p) => {
      const paymentDate = new Date(p.dateTime);
      return (
        paymentDate.getDate() === currentDay &&
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Calculate This Month's Revenue
  const monthlyRevenue = successfulPayments
    .filter((p) => {
      const paymentDate = new Date(p.dateTime);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 3. Calculate This Year's Revenue
  const yearlyRevenue = successfulPayments
    .filter((p) => {
      const paymentDate = new Date(p.dateTime);
      return paymentDate.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="card admin-summary-card" role="region" aria-label="Collections Overview">
      <div className="card-title text-center">COLLECTIONS OVERVIEW</div>

      {/* 3 Temporal Revenue KPI Cards */}
      <div className="summary-stats">
        {/* Daily Metric */}
        <div className="stat-box highlight">
          <span className="stat-label">TODAY'S REVENUE</span>
          <span className="stat-value text-success">
            {formatRupees(todayRevenue)}
          </span>
          <span className="timestamp" style={{ fontSize: "0.72rem", marginTop: "0.2rem" }}>
            {currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>

        {/* Monthly Metric */}
        <div className="stat-box">
          <span className="stat-label">MONTHLY REVENUE</span>
          <span className="stat-value text-success">
            {formatRupees(monthlyRevenue)}
          </span>
          <span className="timestamp" style={{ fontSize: "0.72rem", marginTop: "0.2rem" }}>
            {currentDate.toLocaleDateString("en-US", { month: "long" })}
          </span>
        </div>

        {/* Yearly Metric */}
        <div className="stat-box">
          <span className="stat-label">YEARLY REVENUE</span>
          <span className="stat-value text-success">
            {formatRupees(yearlyRevenue)}
          </span>
          <span className="timestamp" style={{ fontSize: "0.72rem", marginTop: "0.2rem" }}>
            Session {currentYear}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminCollectionsSummary;
