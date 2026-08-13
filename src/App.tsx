import { useState } from "react";
import Header from "./components/Header";
import type { Role } from "./components/Header";
import ParentStudentSelector from "./components/ParentStudentSelector";
import FeeDetail from "./components/FeeDetail";
import type { Payment } from "./components/PayFeesForm";
import PayFeesForm from "./components/PayFeesForm";
import PaymentHistory from "./components/PaymentHistory";

const parents = [
  {
    id: "p1",
    name: "Quyoom",
  },
  {
    id: "p2",
    name: "Mukhtar",
  },
];

const students = [
  {
    id: "s1",
    name: "Ahtisham",
    parentId: "p1",
    gradeName: "10th",
  },
  {
    id: "s2",
    name: "Arooj",
    parentId: "p1",
    gradeName: "12th",
  },
  {
    id: "s3",
    name: "Mehnan",
    parentId: "p2",
    gradeName: "11th",
  },
];

const feeObligations = [
  {
    id: "f1",
    studentId: "s1",
    feeAmount: 33000,
    month: "June",
    feeType: "tuition",
    feeStatus: "paid",
  },
  {
    id: "f2",
    studentId: "s1",
    feeAmount: 33000,
    month: "july",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f3",
    studentId: "s2",
    feeAmount: 3000,
    month: "June",
    feeType: "tuition",
    feeStatus: "paid",
  },
  {
    id: "f4",
    studentId: "s3",
    feeAmount: 4000,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "paid",
  },
];
function App() {
  const [role, setRole] = useState<Role>("parent");
  const [selectedParent, setSelectedParent] = useState("p1");
  const [selectedStudent, setSelectedStudent] = useState("s1");

  const [payments, setPayments] = useState<Payment[]>([]);

  function handlePaymentSubmit(amount: number) {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    // Format and fix the AM/PM spacing
    const result = formatter
      .format(date)
      .replace(" am", "AM")
      .replace(" pm", "PM");

    const paymentObject = {
      id: `pay-${Date.now()}`,
      belongsTo: selectedStudent,
      amount: amount,
      dateTime: result.toString(),
    };
    setPayments([...payments, paymentObject]);
  }

  const filteredPayments = payments.filter(
    (filteredList) => filteredList.belongsTo === selectedStudent,
  );

  const filteredStudents = students.filter(
    (student) => student.parentId === selectedParent,
  );

  const filteredFeeObligations = feeObligations.filter(
    (feeObligationStudents) =>
      feeObligationStudents.studentId === selectedStudent,
  );

  function handleParentChange(parentId: string) {
    setSelectedParent(parentId);
    const filteredStudent = students.filter(
      (student) => parentId === student.parentId,
    );
    setSelectedStudent(filteredStudent[0].id);
  }
  return (
    <>
      <Header activeRole={role} onSelectRole={setRole} />
      <ParentStudentSelector
        parents={parents}
        students={filteredStudents}
        selectedParentId={selectedParent}
        selectedStudentId={selectedStudent}
        onSelectParent={handleParentChange}
        onSelectStudent={setSelectedStudent}
      />
      <FeeDetail
        feeObligation={filteredFeeObligations}
        payments={filteredPayments}
      />

      <PayFeesForm onSubmitPayment={handlePaymentSubmit} />
      <PaymentHistory payments={filteredPayments} />
    </>
  );
}

export default App;
