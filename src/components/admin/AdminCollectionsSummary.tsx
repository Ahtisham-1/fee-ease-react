import type { Payment } from "../../types";
import { TrendingUpIcon, CalendarIcon } from "../common/Icons";

export interface AdminCollectionsSummaryProps {
  payments: Payment[];
}

export function AdminCollectionsSummary({ payments }: AdminCollectionsSummaryProps) {
  const successfulPayments = payments.filter((p) => p.status === "SUCCESS");
  const now = new Date();

  // 1. Daily Revenue (Today)
  const todayRevenue = successfulPayments
    .filter((p) => {
      const pDate = new Date(p.dateTime);
      return (
        !isNaN(pDate.getTime()) &&
        pDate.getDate() === now.getDate() &&
        pDate.getMonth() === now.getMonth() &&
        pDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // 2. Monthly Revenue (This Month)
  const thisMonthRevenue = successfulPayments
    .filter((p) => {
      const pDate = new Date(p.dateTime);
      return (
        !isNaN(pDate.getTime()) &&
        pDate.getMonth() === now.getMonth() &&
        pDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // 3. Yearly Revenue (This Year)
  const thisYearRevenue = successfulPayments
    .filter((p) => {
      const pDate = new Date(p.dateTime);
      return !isNaN(pDate.getTime()) && pDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

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
            ₹{todayRevenue.toLocaleString("en-IN")}
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
            ₹{thisMonthRevenue.toLocaleString("en-IN")}
          </strong>
          <span className="stat-subtext">
            {now.toLocaleString("default", { month: "long" })} {now.getFullYear()}
          </span>
        </div>

        {/* 3. Yearly */}
        <div className="revenue-stat-card yearly-card">
          <div className="stat-header">
            <span className="stat-label">YEARLY REVENUE</span>
            <TrendingUpIcon className="stat-header-icon" />
          </div>
          <strong className="stat-value text-emerald">
            ₹{thisYearRevenue.toLocaleString("en-IN")}
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
