import type { Student, Parent, Fee, Transaction } from "../types";
import { useState } from "react";
type ParentDashboardProps = {
  students: Student[];
  parents: Parent[];
  fees: Fee[];
  transactions: Transaction[];
};

function ParentDashboard({ students, parents, fees, transactions }: ParentDashboardProps) {
  const [selectedParentId, setSelectedParentId] = useState("P1");
  const [selectedStudentId, setSelectedStudentId] = useState("S1");

  const filteredStudents = students.filter(
    (fs) => fs.connectingId === selectedParentId,
  );
  const filteredFees = fees.filter(
    (ff) => ff.studentFeesConnectingID === selectedStudentId,
  );
  const totalFees = filteredFees.reduce((acc, current) => {
    return acc + current.fees;
  }, 0);

  const filteredTransactions = transactions.filter(
    (t) => t.studentId === selectedStudentId,
  );
  
  const totalPaid = filteredTransactions.reduce((acc, current) => {
    return acc + current.paidAmount;
  }, 0);

  const balance = totalFees - totalPaid;
  return (
    <>
      <select
        onChange={(e) => {
          const newParentId = e.target.value;
          setSelectedParentId(newParentId);
          const newchildren = students.filter(
            (sf) => sf.connectingId === newParentId,
          );
          if (newchildren.length > 0) {
            setSelectedStudentId(newchildren[0].studentId);
          }
        }}
      >
        {parents.map((p) => (
          <option value={p.parentId} key={p.parentId}>
            {p.parentName}
          </option>
        ))}
      </select>

      <select onChange={(e) => setSelectedStudentId(e.target.value)}>
        {filteredStudents.map((ps) => (
          <option value={ps.studentId} key={ps.studentId}>
            {ps.studentName}
          </option>
        ))}
      </select>

      <h2>Total Fees: ₹{totalFees}</h2>
      <h2>Total Paid: ₹{totalPaid}</h2>
      <h2>Balance Owed: ₹{balance}</h2>
    </>
  );
}

export default ParentDashboard;
