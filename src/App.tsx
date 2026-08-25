import { useState } from "react";
import type { Role, AdminTab, Student, Parent, FeeObligation, Payment, NewStudentData } from "./types";
import {
  initialParents,
  initialStudents,
  initialFeeObligations,
  gradeArray,
  months,
} from "./data/mockData";
import { getStudentFinancialSummary } from "./utils/feeCalculator";

// Universal Components
import Header from "./components/common/Header";

// Parent Portal Suite
import ParentStudentSelector from "./components/parent/ParentStudentSelector";
import FeeDetail from "./components/parent/FeeDetail";
import PayFeesForm from "./components/parent/PayFeesForm";
import PaymentHistory from "./components/parent/PaymentHistory";

// Admin Portal Suite
import AdminCollectionsSummary from "./components/admin/AdminCollectionsSummary";
import SelectClassComponent from "./components/admin/SelectClassComponent";
import AdminClassRoster from "./components/admin/AdminClassRoster";
import AdminAssignFeesForm from "./components/admin/AdminAssignFeesForm";
import AdminPromoteClass from "./components/admin/AdminPromoteClass";
import AdminPaymentHistory from "./components/admin/AdminPaymentHistory";
import AdminAddStudentForm from "./components/admin/AdminAddStudentForm";
import AdminEditStudentModal from "./components/admin/AdminEditStudentModal";

/**
 * ============================================================================
 * FeeEase Central Application Orchestrator (App.tsx)
 * ============================================================================
 * 
 * Architectural Purpose:
 * Serves as the central state store, in-memory domain database, and top-level
 * orchestrator connecting all Parent and Admin components.
 */
export function App() {
  // --------------------------------------------------------------------------
  // GLOBAL APPLICATION NAVIGATION STATE
  // Connected to: Header.tsx
  // --------------------------------------------------------------------------
  const [activeUserRole, setActiveUserRole] = useState<Role>("admin");

  // --------------------------------------------------------------------------
  // ADMIN SUB-NAVIGATION TAB STATE
  // Tabs: overview | students | fees | promotion
  // --------------------------------------------------------------------------
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>("overview");

  // --------------------------------------------------------------------------
  // CENTRAL IN-MEMORY DOMAIN DATABASES (Clean Slate / Zero Mock Data)
  // Shared across ALL components in the school system
  // --------------------------------------------------------------------------
  const [parentsDatabase, setParentsDatabase] = useState<Parent[]>(initialParents);
  const [studentsDatabase, setStudentsDatabase] = useState<Student[]>(initialStudents);
  const [feeObligationsDatabase, setFeeObligationsDatabase] = useState<FeeObligation[]>(initialFeeObligations);
  const [paymentsDatabase, setPaymentsDatabase] = useState<Payment[]>([]);

  // --------------------------------------------------------------------------
  // PARENT PORTAL ACTIVE CONTEXT SELECTION STATE
  // Connected to: ParentStudentSelector.tsx, FeeDetail.tsx, PayFeesForm.tsx, PaymentHistory.tsx
  // --------------------------------------------------------------------------
  const [selectedParentAccountId, setSelectedParentAccountId] = useState<string>(
    initialParents[0]?.id || ""
  );
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<string>(
    initialStudents[0]?.id || ""
  );

  // --------------------------------------------------------------------------
  // ADMIN PORTAL FILTER & ASSIGNMENT STATE
  // Connected to: SelectClassComponent.tsx, AdminClassRoster.tsx, AdminAssignFeesForm.tsx, AdminPromoteClass.tsx
  // --------------------------------------------------------------------------
  const [selectedGradeForFilter, setSelectedGradeForFilter] = useState<string>(gradeArray[0]);
  const [standardTuitionFeeInput, setStandardTuitionFeeInput] = useState<number>(1500);

  // --------------------------------------------------------------------------
  // ADMIN EDIT STUDENT MODAL STATE
  // Connected to: AdminClassRoster.tsx (Triggers open) & AdminEditStudentModal.tsx (Renders form)
  // --------------------------------------------------------------------------
  const [studentTargetForEdit, setStudentTargetForEdit] = useState<Student | null>(null);
  const [isEditStudentRecordModalOpen, setIsEditStudentRecordModalOpen] = useState<boolean>(false);

  // ==========================================================================
  // COMPONENT-SPECIFIC BUSINESS MUTATION HANDLERS
  // ==========================================================================

  /**
   * LOGIC FOR: PayFeesForm.tsx (Parent Portal)
   */
  function handleProcessPayment(paymentAmount: number) {
    if (!selectedStudentProfileId || paymentAmount <= 0) return;

    const newPaymentReceipt: Payment = {
      id: `rcpt-${Date.now()}`,
      amount: paymentAmount,
      dateTime: new Date().toLocaleString(),
      belongsTo: selectedStudentProfileId,
      status: "SUCCESS",
    };

    setPaymentsDatabase((previousPayments) => [newPaymentReceipt, ...previousPayments]);
  }

  /**
   * LOGIC FOR: AdminAddStudentForm.tsx (Admin Tab: students)
   */
  function handleEnrollStudentAccount(enrollmentData: NewStudentData) {
    const existingGuardian = parentsDatabase.find(
      (guardian) => guardian.phone === enrollmentData.phone
    );
    const guardianId = existingGuardian ? existingGuardian.id : `p-${Date.now()}`;

    if (!existingGuardian) {
      const newGuardianRecord: Parent = {
        id: guardianId,
        name: enrollmentData.parentName,
        phone: enrollmentData.phone,
      };
      setParentsDatabase((previousGuardians) => [...previousGuardians, newGuardianRecord]);
    }

    const newStudentId = `s-${Date.now()}`;
    const newStudentRecord: Student = {
      id: newStudentId,
      name: enrollmentData.studentName,
      gradeName: enrollmentData.grade,
      parentId: guardianId,
    };

    const baseMonthlyFee = enrollmentData.tuitionFee + (enrollmentData.hasTransport ? 1000 : 0);
    const initialObligation: FeeObligation = {
      id: `fee-${Date.now()}`,
      studentId: newStudentId,
      feeAmount: baseMonthlyFee,
      month: months[new Date().getMonth()] || "Current",
      feeType: enrollmentData.hasTransport ? "tuition+transport" : "tuition",
      feeStatus: "pending",
    };

    setStudentsDatabase((previousStudents) => [...previousStudents, newStudentRecord]);
    setFeeObligationsDatabase((previousObligations) => [...previousObligations, initialObligation]);

    if (!selectedParentAccountId) setSelectedParentAccountId(guardianId);
    if (!selectedStudentProfileId) setSelectedStudentProfileId(newStudentId);

    alert(`Successfully enrolled student ${enrollmentData.studentName} into Class ${enrollmentData.grade}!`);
  }

  /**
   * LOGIC FOR: AdminClassRoster.tsx (Admin Tab: students)
   */
  function handleInitiateStudentEdit(targetStudent: Student) {
    setStudentTargetForEdit(targetStudent);
    setIsEditStudentRecordModalOpen(true);
  }

  /**
   * LOGIC FOR: AdminClassRoster.tsx (Delete Student Action)
   */
  function handleDeleteStudent(studentId: string) {
    const studentToDelete = studentsDatabase.find((s) => s.id === studentId);
    if (!studentToDelete) return;

    const isConfirmed = window.confirm(
      `Are you sure you want to remove ${studentToDelete.name} from Class ${studentToDelete.gradeName}? This will also delete their associated fee records.`
    );
    if (!isConfirmed) return;

    setStudentsDatabase((prev) => prev.filter((s) => s.id !== studentId));
    setFeeObligationsDatabase((prev) => prev.filter((f) => f.studentId !== studentId));

    if (selectedStudentProfileId === studentId) {
      setSelectedStudentProfileId("");
    }

    alert(`Successfully removed ${studentToDelete.name} from school records.`);
  }

  /**
   * LOGIC FOR: AdminEditStudentModal.tsx (Global Modal)
   */
  function handleSaveStudentProfileChanges(
    studentId: string,
    updatedStudentName: string,
    updatedParentName: string,
    updatedPhoneNumber: string
  ) {
    setStudentsDatabase((previousStudents) =>
      previousStudents.map((student) =>
        student.id === studentId ? { ...student, name: updatedStudentName } : student
      )
    );

    if (studentTargetForEdit?.parentId) {
      setParentsDatabase((previousGuardians) =>
        previousGuardians.map((guardian) =>
          guardian.id === studentTargetForEdit.parentId
            ? { ...guardian, name: updatedParentName, phone: updatedPhoneNumber }
            : guardian
        )
      );
    }
  }

  /**
   * LOGIC FOR: AdminAssignFeesForm.tsx (Admin Tab: fees)
   */
  function handleBatchGenerateClassFees(
    targetGradeClass: string,
    targetAcademicMonth: string,
    feeAmount: number
  ) {
    const classEnrolledStudents = studentsDatabase.filter(
      (student) => student.gradeName === targetGradeClass
    );

    if (classEnrolledStudents.length === 0) {
      alert(`No students currently enrolled in Class ${targetGradeClass} to assign fees.`);
      return;
    }

    const generatedObligations: FeeObligation[] = classEnrolledStudents.map((student) => ({
      id: `fee-${student.id}-${Date.now()}`,
      studentId: student.id,
      feeAmount: feeAmount,
      month: targetAcademicMonth,
      feeType: "tuition",
      feeStatus: "pending",
    }));

    setFeeObligationsDatabase((previousObligations) => [
      ...previousObligations,
      ...generatedObligations,
    ]);

    alert(
      `Successfully generated ${generatedObligations.length} fee obligations for Class ${targetGradeClass} (${targetAcademicMonth}).`
    );
  }

  /**
   * LOGIC FOR: AdminPromoteClass.tsx (Admin Tab: promotion)
   */
  function handleExecuteAnnualPromotion(studentIdsToPromote: string[]) {
    const currentGradeIndex = gradeArray.indexOf(selectedGradeForFilter);
    const nextGradeLevel =
      currentGradeIndex < gradeArray.length - 1
        ? gradeArray[currentGradeIndex + 1]
        : "Graduated";

    setStudentsDatabase((previousStudents) =>
      previousStudents.map((student) => {
        if (studentIdsToPromote.includes(student.id)) {
          return { ...student, gradeName: nextGradeLevel };
        }
        return student;
      })
    );

    alert(
      `Promoted ${studentIdsToPromote.length} students from Class ${selectedGradeForFilter} to Class ${nextGradeLevel}!`
    );
  }

  // --------------------------------------------------------------------------
  // DERIVED SELECTORS
  // --------------------------------------------------------------------------
  const activeGuardianProfile = parentsDatabase.find(
    (guardian) =>
      guardian.id ===
      (studentTargetForEdit ? studentTargetForEdit.parentId : selectedParentAccountId)
  );

  const activeStudentFinancials = getStudentFinancialSummary(
    selectedStudentProfileId,
    feeObligationsDatabase,
    paymentsDatabase
  );

  return (
    <div className="app-container">
      {/* 1. Global Navigation Header */}
      <Header role={activeUserRole} onRoleChange={setActiveUserRole} />

      <main className="main-content">
        {/* =================================================================== */}
        {/* PARENT PORTAL VIEW                                                  */}
        {/* =================================================================== */}
        {activeUserRole === "parent" && (
          <div className="parent-grid">
            <div className="column-left">
              <ParentStudentSelector
                parents={parentsDatabase}
                students={studentsDatabase}
                selectedParentId={selectedParentAccountId}
                selectedStudentId={selectedStudentProfileId}
                onSelectParent={setSelectedParentAccountId}
                onSelectStudent={setSelectedStudentProfileId}
              />

              {selectedStudentProfileId && (
                <FeeDetail
                  feeObligations={feeObligationsDatabase}
                  payments={paymentsDatabase}
                  selectedStudentId={selectedStudentProfileId}
                />
              )}
            </div>

            <div className="column-right">
              {selectedStudentProfileId && (
                <>
                  <PayFeesForm
                    netBalance={activeStudentFinancials.netBalance}
                    onSubmitPayment={handleProcessPayment}
                  />

                  <PaymentHistory
                    payments={paymentsDatabase}
                    selectedStudentId={selectedStudentProfileId}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ADMIN PORTAL VIEW WITH SUB-NAVIGATION BAR                           */}
        {/* =================================================================== */}
        {activeUserRole === "admin" && (
          <div className="portal-layout admin-portal">
            {/* Admin Sub-Navigation Control Bar */}
            <nav className="admin-nav-bar" aria-label="Admin Sub Navigation">
              <button
                type="button"
                className={`admin-tab-btn ${activeAdminTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveAdminTab("overview")}
              >
                📊 Overview & Audit
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${activeAdminTab === "students" ? "active" : ""}`}
                onClick={() => setActiveAdminTab("students")}
              >
                👥 Class Roster & Enrollment
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${activeAdminTab === "fees" ? "active" : ""}`}
                onClick={() => setActiveAdminTab("fees")}
              >
                📢 Generate Class Fees
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${activeAdminTab === "promotion" ? "active" : ""}`}
                onClick={() => setActiveAdminTab("promotion")}
              >
                🚀 Class Promotion
              </button>
            </nav>

            {/* TAB 1: Collections Overview + Audit History (SIDE BY SIDE) */}
            {activeAdminTab === "overview" && (
              <div className="admin-overview-grid">
                <AdminCollectionsSummary payments={paymentsDatabase} />
                <AdminPaymentHistory
                  payments={paymentsDatabase}
                  students={studentsDatabase}
                />
              </div>
            )}

            {/* TAB 2: Class Roster & Enrollment (SIDE BY SIDE 50/50 GRID) */}
            {activeAdminTab === "students" && (
              <div className="admin-overview-grid">
                {/* Left Column: Enrollment Form */}
                <AdminAddStudentForm
                  classGrade={gradeArray}
                  onAddStudent={handleEnrollStudentAccount}
                  onClassChange={setSelectedGradeForFilter}
                />

                {/* Right Column: Classroom Student Roster Table */}
                <AdminClassRoster
                  students={studentsDatabase}
                  parents={parentsDatabase}
                  feeObligations={feeObligationsDatabase}
                  payments={paymentsDatabase}
                  selectedGrade={selectedGradeForFilter}
                  classGrade={gradeArray}
                  onSelectGrade={setSelectedGradeForFilter}
                  onEditStudent={handleInitiateStudentEdit}
                  onDeleteStudent={handleDeleteStudent}
                />
              </div>
            )}

            {/* TAB 3: Batch Generate Class Fees */}
            {activeAdminTab === "fees" && (
              <AdminAssignFeesForm
                assignFees={standardTuitionFeeInput}
                pickClass={gradeArray}
                pickMonth={months}
                onInputChange={setStandardTuitionFeeInput}
                onSubmitFeesForm={handleBatchGenerateClassFees}
              />
            )}

            {/* TAB 4: Annual Class Promotion Tool */}
            {activeAdminTab === "promotion" && (
              <AdminPromoteClass
                gradeClass={gradeArray}
                gradeStudents={studentsDatabase.filter(
                  (student) => student.gradeName === selectedGradeForFilter
                )}
                selectedGrade={selectedGradeForFilter}
                onDropdownChange={setSelectedGradeForFilter}
                onPromoteSubmit={handleExecuteAnnualPromotion}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Student & Guardian Record Edit Modal */}
      <AdminEditStudentModal
        student={studentTargetForEdit}
        parent={activeGuardianProfile}
        isOpen={isEditStudentRecordModalOpen}
        onClose={() => setIsEditStudentRecordModalOpen(false)}
        onSave={handleSaveStudentProfileChanges}
      />
    </div>
  );
}

export default App;
