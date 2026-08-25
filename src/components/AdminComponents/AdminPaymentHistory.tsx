import type { Student } from "../ParentComponents/ParentStudentSelector";
import type { Payment } from "../ParentComponents/PayFeesForm";

interface AdminPaymentHistoryProps {
  students: Student[];
  payments: Payment[];
}

function AdminPaymentHistory({ students, payments }: AdminPaymentHistoryProps) {
  return (
    <div>
      <div>Payment history of students</div>

      <div>
        {payments.map((payId) => {
          const matchingStudents = students.find(
            (student) => student.id === payId.belongsTo,
          );
          return (
            <div>
              {matchingStudents?.name} | {matchingStudents?.gradeName} |{" "}
              {payId.amount} | {payId.dateTime}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default AdminPaymentHistory;
