import { useState } from "react";
import type { Role, Student, Parent, FeeObligation, Payment, NewStudentData } from "./types";
import {
  initialParents,
  initialStudents,
  initialFeeObligations,
  gradeArray,
  months,
} from "./data/mockData";

// Components
import Header from "./components/common/Header";
import ParentStudentSelector from "./components/parent/ParentStudentSelector";
import FeeDetail from "./components/parent/FeeDetail";
import PayFeesForm from "./components/parent/PayFeesForm";
import PaymentHistory from "./components/parent/PaymentHistory";

import AdminCollectionsSummary from "./components/admin/AdminCollectionsSummary";
import SelectClassComponent from "./components/admin/SelectClassComponent";
import AdminClassRoster from "./components/admin/AdminClassRoster";
import AdminAssignFeesForm from "./components/admin/AdminAssignFeesForm";
import AdminPromoteClass from "./components/admin/AdminPromoteClass";
import AdminPaymentHistory from "./components/admin/AdminPaymentHistory";
import AdminAddStudentForm from "./components/admin/AdminAddStudentForm";
import AdminEditStudentModal from "./components/admin/AdminEditStudentModal";

export function App() {
  // 1. Role State
  const [role, setRole] = useState<Role>("parent");

  // 2. Central Domain State (Clean Slate - Zero Mock Data)
  const [parentList, setParentList] = useState<Parent[]>(initialParents);
  const [studentList, setStudentList] = useState<Student[]>(initialStudents);
  const [feeObligationList, setFeeObligationList] = useState<FeeObligation[]>(initialFeeObligations);
  const [payments, setPayments] = useState<Payment[]>([]);

  // 3. Parent Portal Active Selection State
  const [selectedParentId, setSelectedParentId] = useState<string>(
    initialParents[0]?.id || ""
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudents[0]?.id || ""
  );

  // 4. Admin Portal State
  const [adminSelectedGrade, setAdminSelectedGrade] = useState<string>(gradeArray[0]);
  const [inputAssignFees, setInputAssignFees] = useState<number>(1500);

  // 5. Modal Edit State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // ==========================================
  // Central Handlers
  // ==========================================

  // Submit Payment (Parent)
  function handlePayment(amount: number) {
    if (!selectedStudentId || amount <= 0) return;

    const newPayment: Payment = {
      id: `rcpt-${Date.now()}`,
      amount,
      dateTime: new Date().toLocaleString(),
      belongsTo: selectedStudentId,
    };

    setPayments((prev) => [newPayment, ...prev]);
  }

  // Enroll Student & Family (Admin)
  function handleAddStudent(data: NewStudentData) {
    const existingParent = parentList.find((p) => p.phone === data.phone);
    const parentId = existingParent ? existingParent.id : `p-${Date.now()}`;

    if (!existingParent) {
      const newParent: Parent = {
        id: parentId,
        name: data.parentName,
        phone: data.phone,
      };
      setParentList((prev) => [...prev, newParent]);
    }

    const newStudentId = `s-${Date.now()}`;
    const newStudent: Student = {
      id: newStudentId,
      name: data.studentName,
      gradeName: data.grade,
      parentId,
    };

    const monthlyAmount = data.tuitionFee + (data.hasTransport ? 1000 : 0);
    const initialObligation: FeeObligation = {
      id: `fee-${Date.now()}`,
      studentId: newStudentId,
      feeAmount: monthlyAmount,
      month: months[new Date().getMonth()] || "Current",
      feeType: data.hasTransport ? "tuition+transport" : "tuition",
      feeStatus: "pending",
    };

    setStudentList((prev) => [...prev, newStudent]);
    setFeeObligationList((prev) => [...prev, initialObligation]);

    // If first parent/student ever, auto-select them for parent portal
    if (!selectedParentId) setSelectedParentId(parentId);
    if (!selectedStudentId) setSelectedStudentId(newStudentId);
  }

  // Edit Student & Parent Record (Admin)
  function handleOpenEditModal(student: Student) {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  }

  function handleSaveStudent(
    studentId: string,
    newStudentName: string,
    newParentName: string,
    newPhone: string
  ) {
    setStudentList((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, name: newStudentName } : s))
    );

    if (editingStudent?.parentId) {
      setParentList((prev) =>
        prev.map((p) =>
          p.id === editingStudent.parentId
            ? { ...p, name: newParentName, phone: newPhone }
            : p
        )
      );
    }
  }

  // Batch Assign Fees to Classroom (Admin)
  function handleAssignFees(
    targetClass: string,
    targetMonth: string,
    amount: number
  ) {
    const classStudents = studentList.filter((s) => s.gradeName === targetClass);
    if (classStudents.length === 0) {
      alert(`No students found in Class ${targetClass} to assign fees.`);
      return;
    }

    const newBills: FeeObligation[] = classStudents.map((s) => ({
      id: `fee-${s.id}-${Date.now()}`,
      studentId: s.id,
      feeAmount: amount,
      month: targetMonth,
      feeType: "tuition",
      feeStatus: "pending",
    }));

    setFeeObligationList((prev) => [...prev, ...newBills]);
    alert(`Successfully generated ${newBills.length} fee obligations for Class ${targetClass} (${targetMonth}).`);
  }

  // Annual Class Promotion (Admin)
  function handlePromoteStudents(selectedStudentIds: string[]) {
    const currentIndex = gradeArray.indexOf(adminSelectedGrade);
    const nextGrade =
      currentIndex < gradeArray.length - 1
        ? gradeArray[currentIndex + 1]
        : "Graduated";

    setStudentList((prev) =>
      prev.map((student) => {
        if (selectedStudentIds.includes(student.id)) {
          return { ...student, gradeName: nextGrade };
        }
        return student;
      })
    );

    alert(`Promoted ${selectedStudentIds.length} students from Class ${adminSelectedGrade} to Class ${nextGrade}!`);
  }

  const activeParent = parentList.find(
    (p) => p.id === (editingStudent ? editingStudent.parentId : selectedParentId)
  );

  return (
    <div className="app-container">
      {/* 1. Global Header */}
      <Header role={role} onRoleChange={setRole} />

      <main className="main-content">
        {/* ========================================== */}
        {/* PARENT PORTAL VIEW */}
        {/* ========================================== */}
        {role === "parent" && (
          <div className="portal-layout parent-portal">
            <ParentStudentSelector
              parents={parentList}
              students={studentList}
              selectedParentId={selectedParentId}
              selectedStudentId={selectedStudentId}
              onSelectParent={setSelectedParentId}
              onSelectStudent={setSelectedStudentId}
            />

            {selectedStudentId && (
              <>
                <FeeDetail
                  feeObligations={feeObligationList}
                  payments={payments}
                  selectedStudentId={selectedStudentId}
                />

                <PayFeesForm
                  netBalance={
                    feeObligationList
                      .filter((f) => f.studentId === selectedStudentId)
                      .reduce((acc, curr) => acc + curr.feeAmount, 0) -
                    payments
                      .filter((p) => p.belongsTo === selectedStudentId)
                      .reduce((acc, curr) => acc + curr.amount, 0)
                  }
                  onSubmitPayment={handlePayment}
                />

                <PaymentHistory
                  payments={payments}
                  selectedStudentId={selectedStudentId}
                />
              </>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* ADMIN PORTAL VIEW */}
        {/* ========================================== */}
        {role === "admin" && (
          <div className="portal-layout admin-portal">
            <AdminCollectionsSummary payments={payments} />

            <div className="admin-roster-section">
              <SelectClassComponent
                classGrade={gradeArray}
                selectedGrade={adminSelectedGrade}
                onSelectGrade={setAdminSelectedGrade}
              />

              <AdminClassRoster
                students={studentList}
                parents={parentList}
                feeObligations={feeObligationList}
                payments={payments}
                selectedGrade={adminSelectedGrade}
                onEditStudent={handleOpenEditModal}
              />
            </div>

            <AdminAddStudentForm
              classGrade={gradeArray}
              onAddStudent={handleAddStudent}
            />

            <AdminAssignFeesForm
              assignFees={inputAssignFees}
              pickClass={gradeArray}
              pickMonth={months}
              onInputChange={setInputAssignFees}
              onSubmitFeesForm={handleAssignFees}
            />

            <AdminPromoteClass
              gradeClass={gradeArray}
              gradeStudents={studentList.filter(
                (s) => s.gradeName === adminSelectedGrade
              )}
              selectedGrade={adminSelectedGrade}
              onDropdownChange={setAdminSelectedGrade}
              onPromoteSubmit={handlePromoteStudents}
            />

            <AdminPaymentHistory
              payments={payments}
              students={studentList}
            />
          </div>
        )}
      </main>

      {/* Global Edit Student Modal */}
      <AdminEditStudentModal
        student={editingStudent}
        parent={activeParent}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveStudent}
      />
    </div>
  );
}

export default App;
