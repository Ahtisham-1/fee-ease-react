import type { Payment } from "../../types";
import { formatRupees } from "../../utils/format";
import { TrendingUpIcon, CalendarIcon } from "../common/Icons";

export interface AdminCollectionsSummaryProps {
  payments: Payment[];
}

export function AdminCollectionsSummary({ payments }: AdminCollectionsSummaryProps) {
  const now = new Date();

  // Single pass: successful payments bucketed into today / this month / this year.
  let todayRevenue = 0;
  let thisMonthRevenue = 0;
  let thisYearRevenue = 0;

  for (const payment of payments) {
    if (payment.status !== "SUCCESS") continue;
    const paidAt = new Date(payment.dateTime);
    if (isNaN(paidAt.getTime()) || paidAt.getFullYear() !== now.getFullYear()) continue;

    thisYearRevenue += payment.amount;
    if (paidAt.getMonth() === now.getMonth()) {
      thisMonthRevenue += payment.amount;
      if (paidAt.getDate() === now.getDate()) {
        todayRevenue += payment.amount;
      }
    }
  }

  return (
    <div className="card collections-summary-card" role="region" aria-label="Collections Overview">
      <div className="card-title text-center">
        <TrendingUpIcon className="title-icon" />
        <span>TOTAL SCHOOL REVENUE OVERVIEW</span>
      </div>

      <div className="temporal-revenue-grid">
        {/* 1. Daily Today */}
        <div className="revenue-stat-card daily-card">
          <div className="stat-header">
            <span className="stat-label">COLLECTED TODAY</span>
            <span className="live-pulse-dot" title="Live Today"></span>
          </div>
          <strong className="stat-value text-emerald">
            {formatRupees(todayRevenue)}
          </strong>
          <span className="stat-subtext">24-Hour Settlement</span>
        </div>

        {/* 2. Monthly */}
        <div className="revenue-stat-card monthly-card">
          <div className="stat-header">
            <span className="stat-label">MONTHLY REVENUE</span>
            <CalendarIcon className="stat-header-icon" />
          </div>
          <strong className="stat-value text-emerald">
            {formatRupees(thisMonthRevenue)}
          </strong>
          <span className="stat-subtext">
            {now.toLocaleString(undefined, { month: "long" })} {now.getFullYear()}
          </span>
        </div>

        {/* 3. Yearly */}
        <div className="revenue-stat-card yearly-card">
          <div className="stat-header">
            <span className="stat-label">YEARLY REVENUE</span>
            <TrendingUpIcon className="stat-header-icon" />
          </div>
          <strong className="stat-value text-emerald">
            {formatRupees(thisYearRevenue)}
          </strong>
          <span className="stat-subtext">
            Academic Session {now.getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminCollectionsSummary;
