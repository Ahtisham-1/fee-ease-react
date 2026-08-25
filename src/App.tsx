import { useState } from "react";
import type { Role, Student, Parent, FeeObligation, Payment, NewStudentData } from "./types";
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
 * orchestrator connecting all 13 Parent and Admin components.
 */
export function App() {
  // --------------------------------------------------------------------------
  // GLOBAL APPLICATION NAVIGATION STATE
  // Connected to: Header.tsx
  // --------------------------------------------------------------------------
  const [activeUserRole, setActiveUserRole] = useState<Role>("parent");

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
   * LOGIC FOR: PayFeesForm.tsx (Component #3)
   * 
   * Purpose:
   * Processes an authorized online payment, generates a verified Payment receipt
   * object with status 'SUCCESS', and prepends it to the transaction history.
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
   * LOGIC FOR: AdminAddStudentForm.tsx (Component #8)
   * 
   * Purpose:
   * Enrolls a new student. Checks if the guardian already exists via phone number;
   * if not, creates a new guardian account. Generates the baseline fee obligation.
   */
  function handleEnrollStudentAccount(enrollmentData: NewStudentData) {
    // 1. Relational Check: Does this guardian already have a profile in the school?
    const existingGuardian = parentsDatabase.find(
      (guardian) => guardian.phone === enrollmentData.phone
    );
    const guardianId = existingGuardian ? existingGuardian.id : `p-${Date.now()}`;

    // 2. If new guardian, register family account
    if (!existingGuardian) {
      const newGuardianRecord: Parent = {
        id: guardianId,
        name: enrollmentData.parentName,
        phone: enrollmentData.phone,
      };
      setParentsDatabase((previousGuardians) => [...previousGuardians, newGuardianRecord]);
    }

    // 3. Register student profile linked to the guardian
    const newStudentId = `s-${Date.now()}`;
    const newStudentRecord: Student = {
      id: newStudentId,
      name: enrollmentData.studentName,
      gradeName: enrollmentData.grade,
      parentId: guardianId,
    };

    // 4. Generate initial fee obligation (Tuition + Optional Transport Service)
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

    // If first student in empty database, auto-select for immediate parent view
    if (!selectedParentAccountId) setSelectedParentAccountId(guardianId);
    if (!selectedStudentProfileId) setSelectedStudentProfileId(newStudentId);
  }

  /**
   * LOGIC FOR: AdminClassRoster.tsx (Component #7)
   * 
   * Purpose:
   * Triggered when the admin clicks "✏️ Edit" on any student row in the roster.
   * Sets the active editing student and displays the modal.
   */
  function handleInitiateStudentEdit(targetStudent: Student) {
    setStudentTargetForEdit(targetStudent);
    setIsEditStudentRecordModalOpen(true);
  }

  /**
   * LOGIC FOR: AdminEditStudentModal.tsx (Component #12)
   * 
   * Purpose:
   * Saves updated student name and guardian contact details back into the database.
   */
  function handleSaveStudentProfileChanges(
    studentId: string,
    updatedStudentName: string,
    updatedParentName: string,
    updatedPhoneNumber: string
  ) {
    // Update student name in studentsDatabase
    setStudentsDatabase((previousStudents) =>
      previousStudents.map((student) =>
        student.id === studentId ? { ...student, name: updatedStudentName } : student
      )
    );

    // Update parent name and phone in parentsDatabase
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
   * LOGIC FOR: AdminAssignFeesForm.tsx (Component #9)
   * 
   * Purpose:
   * Batch creates fee obligations for all students currently enrolled in a target class.
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
   * LOGIC FOR: AdminPromoteClass.tsx (Component #10)
   * 
   * Purpose:
   * Advances selected student cohort to the next grade on the academic ladder.
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
  // DERIVED SELECTORS (Pure Calculations)
  // --------------------------------------------------------------------------
  
  // Derived for: AdminEditStudentModal.tsx
  const activeGuardianProfile = parentsDatabase.find(
    (guardian) =>
      guardian.id ===
      (studentTargetForEdit ? studentTargetForEdit.parentId : selectedParentAccountId)
  );

  // Derived for: FeeDetail.tsx & PayFeesForm.tsx
  const activeStudentFinancials = getStudentFinancialSummary(
    selectedStudentProfileId,
    feeObligationsDatabase,
    paymentsDatabase
  );

  // ==========================================================================
  // VIEW RENDERING
  // ==========================================================================
  return (
    <div className="app-container">
      {/* 1. Global Navigation Header */}
      <Header role={activeUserRole} onRoleChange={setActiveUserRole} />

      <main className="main-content">
        {/* =================================================================== */}
        {/* PARENT PORTAL VIEW (2-COLUMN MASTER GRID)                           */}
        {/* =================================================================== */}
        {activeUserRole === "parent" && (
          <div className="parent-grid">
            {/* LEFT COLUMN: Account Selector (Top) + Financial Ledger (Bottom) */}
            <div className="column-left">
              {/* COMPONENT 1: Parent & Student Cascade Dropdowns */}
              <ParentStudentSelector
                parents={parentsDatabase}
                students={studentsDatabase}
                selectedParentId={selectedParentAccountId}
                selectedStudentId={selectedStudentProfileId}
                onSelectParent={setSelectedParentAccountId}
                onSelectStudent={setSelectedStudentProfileId}
              />

              {/* COMPONENT 2: Student Fee Statement & Monthly Breakdown */}
              {selectedStudentProfileId && (
                <FeeDetail
                  feeObligations={feeObligationsDatabase}
                  payments={paymentsDatabase}
                  selectedStudentId={selectedStudentProfileId}
                />
              )}
            </div>

            {/* RIGHT COLUMN: Payment Authorization (Top) + Receipt History (Bottom) */}
            <div className="column-right">
              {selectedStudentProfileId && (
                <>
                  {/* COMPONENT 3: Online Fee Payment Form & 2-Step Modal */}
                  <PayFeesForm
                    netBalance={activeStudentFinancials.netBalance}
                    onSubmitPayment={handleProcessPayment}
                  />

                  {/* COMPONENT 4: Transaction Receipts & Audit History */}
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
        {/* ADMIN PORTAL VIEW                                                   */}
        {/* =================================================================== */}
        {activeUserRole === "admin" && (
          <div className="portal-layout admin-portal">
            {/* COMPONENT 5: School-Wide Financial Revenue Overview */}
            <AdminCollectionsSummary payments={paymentsDatabase} />

            <div className="admin-roster-section">
              {/* COMPONENT 6: Active Classroom Grade Filter */}
              <SelectClassComponent
                classGrade={gradeArray}
                selectedGrade={selectedGradeForFilter}
                onSelectGrade={setSelectedGradeForFilter}
              />

              {/* COMPONENT 7: Classroom Student Roster Table & Edit Triggers */}
              <AdminClassRoster
                students={studentsDatabase}
                parents={parentsDatabase}
                feeObligations={feeObligationsDatabase}
                payments={paymentsDatabase}
                selectedGrade={selectedGradeForFilter}
                onEditStudent={handleInitiateStudentEdit}
              />
            </div>

            {/* COMPONENT 8: New Student & Guardian Enrollment Form */}
            <AdminAddStudentForm
              classGrade={gradeArray}
              onAddStudent={handleEnrollStudentAccount}
            />

            {/* COMPONENT 9: Batch Class Monthly Fee Obligation Generator */}
            <AdminAssignFeesForm
              assignFees={standardTuitionFeeInput}
              pickClass={gradeArray}
              pickMonth={months}
              onInputChange={setStandardTuitionFeeInput}
              onSubmitFeesForm={handleBatchGenerateClassFees}
            />

            {/* COMPONENT 10: Annual Classroom Cohort Promotion Tool */}
            <AdminPromoteClass
              gradeClass={gradeArray}
              gradeStudents={studentsDatabase.filter(
                (student) => student.gradeName === selectedGradeForFilter
              )}
              selectedGrade={selectedGradeForFilter}
              onDropdownChange={setSelectedGradeForFilter}
              onPromoteSubmit={handleExecuteAnnualPromotion}
            />

            {/* COMPONENT 11: School-Wide Master Audit Transaction Log */}
            <AdminPaymentHistory
              payments={paymentsDatabase}
              students={studentsDatabase}
            />
          </div>
        )}
      </main>

      {/* COMPONENT 12: Global Student & Guardian Record Edit Modal */}
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
