import type { Payment } from "../ParentComponents/PayFeesForm";

interface AdminCollectionsSummaryProps {
  payments: Payment[];
}

function AdminCollectionsSummary({ payments }: AdminCollectionsSummaryProps) {
  const todaysTotal = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyTotal = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const yearlyTotal = payments.reduce((acc, curr) => acc + curr.amount, 0);
  return (
    <div>
      <div>
        <span>Todays Total: {todaysTotal}</span>
      </div>
      <div>
        <span>Monthly Total: {monthlyTotal}</span>
      </div>
      <div>
        <span>Yearly Total: {yearlyTotal}</span>
      </div>
    </div>
  );
}
export default AdminCollectionsSummary;
