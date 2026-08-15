import { useState } from "react";
import Header from "./components/Header";
import type { Role } from "./components/Header";
import ParentStudentSelector from "./components/ParentComponents/ParentStudentSelector";
import FeeDetail from "./components/ParentComponents/FeeDetail";
import type { Payment } from "./components/ParentComponents/PayFeesForm";
import PayFeesForm from "./components/ParentComponents/PayFeesForm";
import PaymentHistory from "./components/ParentComponents/PaymentHistory";
import AdminCollectionSummary from "./components/AdminComponents/AdminCollectionsSummary";
import AdminPaymentHistory from "./components/AdminComponents/AdminPaymentHistory";
import type { Grades } from "./components/AdminComponents/SelectClassComponent";
import SelectClassComponent from "./components/AdminComponents/SelectClassComponent";

const parents = [
  {
    id: "p1",
    name: "Quyoom",
    phone: "7889123123",
  },
  {
    id: "p2",
    name: "Mukhtar",
    phone: "9797123123",
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
    month: "July",
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

  const [subTab, setSubTab] = useState("dashboard");
  const [pickGrade, setPickGrade] = useState("ist");

  const gradeArray = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
  ];

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

    const result = formatter
      .format(date)
      .replace(" am", " AM")
      .replace(" pm", " PM");

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

  const totalFees = filteredFeeObligations.reduce(
    (acc, curr) => acc + curr.feeAmount,
    0,
  );
  const totalPaid = filteredPayments.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const currentNetBalance = totalFees - totalPaid;

  return (
    <div className="app-container">
      <Header activeRole={role} onSelectRole={setRole} />

      <main className="main-content">
        {role === "parent" ? (
          <div className="parent-grid">
            <div className="column-left">
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
              <PayFeesForm
                onSubmitPayment={handlePaymentSubmit}
                netbalance={currentNetBalance}
              />
            </div>

            <div className="column-right">
              <PaymentHistory payments={filteredPayments} />
            </div>
          </div>
        ) : (
          <div className="card">
            <nav className="navigation-bar">
              <button
                className="dashboard"
                onClick={() => setSubTab("dashboard")}
              >
                Dashboard
              </button>
              <button className="classes" onClick={() => setSubTab("classes")}>
                Classes
              </button>
            </nav>

            {subTab === "dashboard" ? (
              <div>
                <div className="card-title">ADMIN DASHBOARD</div>
                <AdminCollectionSummary payments={payments} />
                <AdminPaymentHistory
                  payments={payments}
                  students={students}
                  feeObligations={feeObligations}
                />
              </div>
            ) : (
              <div>
                <div>
                  <SelectClassComponent
                    classGrade={gradeArray}
                    selectedGrade={pickGrade}
                    onSelectGrade={setPickGrade}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
