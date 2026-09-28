import { useState, useEffect } from "react";
import type {
  Role,
  AdminTab,
  Student,
  Parent,
  FeeObligation,
  Payment,
  NewStudentData,
} from "./types";
import {
  initialParents,
  initialFeeObligations,
  gradeArray,
  months,
} from "./data/mockData";
import { getStudentFinancialSummary } from "./utils/feeCalculator";

// Universal Components
import Header from "./components/common/Header";
import {
  TrendingUpIcon,
  UsersIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "./components/common/Icons";

// Parent Portal Suite
import ParentStudentSelector from "./components/parent/ParentStudentSelector";
import FeeDetail from "./components/parent/FeeDetail";
import PayFeesForm from "./components/parent/PayFeesForm";
import PaymentHistory from "./components/parent/PaymentHistory";

// Admin Portal Suite
import AdminCollectionsSummary from "./components/admin/AdminCollectionsSummary";
import AdminClassRoster from "./components/admin/AdminClassRoster";
import AdminAssignFeesForm from "./components/admin/AdminAssignFeesForm";
import AdminPromoteClass from "./components/admin/AdminPromoteClass";
import AdminPaymentHistory from "./components/admin/AdminPaymentHistory";
import AdminAddStudentForm from "./components/admin/AdminAddStudentForm";
import AdminEditStudentModal from "./components/admin/AdminEditStudentModal";

//Services import
import {
  createStudents,
  getStudents,
  deleteStudents,
  updateStudents,
} from "./services/studentApi";
import { createParent, getParents, updateParent } from "./services/parentApi";
import { getFees, assignBulkFees, deleteFee } from "./services/feeApi";
import { getPayments, sendPayment } from "./services/paymentApi";
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
  const [parentsDatabase, setParentsDatabase] =
    useState<Parent[]>(initialParents);
  const [studentsDatabase, setStudentsDatabase] = useState<Student[]>([]);
  const [feeObligationsDatabase, setFeeObligationsDatabase] = useState<
    FeeObligation[]
  >(initialFeeObligations);
  const [paymentsDatabase, setPaymentsDatabase] = useState<Payment[]>([]);

  // --------------------------------------------------------------------------
  // SCHOOL DATA LOADING STATE (first backend fetch)
  // --------------------------------------------------------------------------
  const [isLoadingSchoolData, setIsLoadingSchoolData] = useState<boolean>(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // PARENT PORTAL ACTIVE CONTEXT SELECTION STATE
  // Connected to: ParentStudentSelector.tsx, FeeDetail.tsx, PayFeesForm.tsx, PaymentHistory.tsx
  // --------------------------------------------------------------------------
  const [selectedParentAccountId, setSelectedParentAccountId] =
    useState<string>(initialParents[0]?.id || "");
  const [selectedStudentProfileId, setSelectedStudentProfileId] =
    useState<string>("");

  // --------------------------------------------------------------------------
  // ADMIN PORTAL FILTER & ASSIGNMENT STATE
  // Connected to: SelectClassComponent.tsx, AdminClassRoster.tsx, AdminAssignFeesForm.tsx, AdminPromoteClass.tsx
  // --------------------------------------------------------------------------
  const [selectedGradeForFilter, setSelectedGradeForFilter] = useState<string>(
    gradeArray[0],
  );
  const [standardTuitionFeeInput, setStandardTuitionFeeInput] =
    useState<number>(1500);

  // --------------------------------------------------------------------------
  // ADMIN EDIT STUDENT MODAL STATE
  // Connected to: AdminClassRoster.tsx (Triggers open) & AdminEditStudentModal.tsx (Renders form)
  // --------------------------------------------------------------------------
  const [studentTargetForEdit, setStudentTargetForEdit] =
    useState<Student | null>(null);
  const [isEditStudentRecordModalOpen, setIsEditStudentRecordModalOpen] =
    useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const loadDatabase = async () => {
      try {
        // Fetch real parents, students, fees, and payments from PostgreSQL together!
        const [parentsData, studentsData, feesData, paymentsData] =
          await Promise.all([
            getParents(),
            getStudents(),
            getFees(),
            getPayments(),
          ]);
        if (cancelled) return;

        setParentsDatabase(parentsData);
        setStudentsDatabase(studentsData);
        setFeeObligationsDatabase(feesData);
        setPaymentsDatabase(paymentsData);

        if (parentsData.length > 0) {
          setSelectedParentAccountId(parentsData[0].id);
          // Keep the student selector in sync with the selected parent so the
          // portal never renders a select whose value matches no option.
          const firstChild = studentsData.find(
            (student) => student.parentId === parentsData[0].id,
          );
          setSelectedStudentProfileId(firstChild ? firstChild.id : "");
        }
      } catch (error) {
        console.error("Failed to load data from database", error);
        if (!cancelled) {
          setDataLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load school records.",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingSchoolData(false);
      }
    };

    loadDatabase();
    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================================
  // COMPONENT-SPECIFIC BUSINESS MUTATION HANDLERS
  // ==========================================================================

  /**
   * LOGIC FOR: PayFeesForm.tsx (Parent Portal)
   * Throws with a user-readable message so the form can surface the exact
   * failure inside its confirmation modal instead of failing silently.
   */
  async function handleProcessPayment(paymentAmount: number) {
    if (!selectedStudentProfileId) {
      throw new Error("No student is selected for this payment.");
    }
    if (paymentAmount <= 0) {
      throw new Error("Please enter a valid positive payment amount.");
    }

    const pendingFee = feeObligationsDatabase.find(
      (f) =>
        f.studentId === selectedStudentProfileId && f.feeStatus === "pending",
    );
    if (!pendingFee) {
      throw new Error(
        "No pending fee record is available to attach this payment to.",
      );
    }

    await sendPayment({
      amount: paymentAmount,
      fee_id: Number(pendingFee.id),
      student_id: Number(selectedStudentProfileId),
      date_time: new Date().toISOString(),
      status: "SUCCESS",
    });

    // Refresh fees + payments so the ledger reflects the server's truth.
    const [feesData, paymentsData] = await Promise.all([
      getFees(),
      getPayments(),
    ]);
    setFeeObligationsDatabase(feesData);
    setPaymentsDatabase(paymentsData);
  }

  /**
   * LOGIC FOR: AdminAddStudentForm.tsx (Admin Tab: students)
   */
  async function handleEnrollStudentAccount(enrollmentData: NewStudentData) {
    try {
      const savedParent = await createParent({
        name: enrollmentData.parentName,
        phone: enrollmentData.phone,
      });

      const savedStudent = await createStudents({
        ...enrollmentData,
        parentId: Number(savedParent.id),
      });

      const [parentsFromDb, studentsFromDb] = await Promise.all([
        getParents(),
        getStudents(),
      ]);

      setParentsDatabase(parentsFromDb);
      setStudentsDatabase(studentsFromDb);

      // Jump the parent portal straight onto the newly enrolled family.
      setSelectedParentAccountId(savedParent.id);
      if (savedStudent?.id != null) {
        setSelectedStudentProfileId(String(savedStudent.id));
      }

      alert(
        `Successfully enrolled student ${enrollmentData.studentName} into Class ${enrollmentData.grade}!`,
      );
    } catch (error) {
      console.error("Failed to enroll student:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error enrolling student. Check backend connection",
      );
    }
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
   * Fee obligations are removed first: the server's student DELETE does not
   * cascade, and leftover fee rows referencing the student would fail the delete.
   */
  async function handleDeleteStudent(studentId: string) {
    const studentToDelete = studentsDatabase.find((s) => s.id === studentId);
    if (!studentToDelete) return;

    const isConfirmed = window.confirm(
      `Are you sure you want to remove ${studentToDelete.name} from Class ${studentToDelete.gradeName}? This will also delete their associated fee records.`,
    );
    if (!isConfirmed) return;

    try {
      const studentFees = feeObligationsDatabase.filter(
        (fee) => fee.studentId === studentId,
      );
      await Promise.all(studentFees.map((fee) => deleteFee(fee.id)));
      await deleteStudents(studentId);

      setStudentsDatabase((prev) => prev.filter((s) => s.id !== studentId));
      setFeeObligationsDatabase((prev) =>
        prev.filter((f) => f.studentId !== studentId),
      );

      if (selectedStudentProfileId === studentId) {
        setSelectedStudentProfileId("");
      }

      alert(
        `Successfully removed ${studentToDelete.name} from school records.`,
      );
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to remove the student. Please try again.",
      );
      // Some fee rows may have been deleted before the failure — re-sync.
      try {
        setFeeObligationsDatabase(await getFees());
      } catch {
        /* keep the current local state */
      }
    }
  }

  /**
   * LOGIC FOR: AdminEditStudentModal.tsx (Global Modal)
   * Persists both the student PATCH and the guardian PATCH (name/phone) so
   * changes survive a refresh instead of only living in local state.
   */
  async function handleSaveStudentProfileChanges(
    studentId: string,
    updatedStudentName: string,
    updatedParentName: string,
    updatedPhoneNumber: string,
    hasTransport: boolean = false,
    transportFee: number = 1000,
  ) {
    try {
      await updateStudents(studentId, {
        studentName: updatedStudentName,
        phone: updatedPhoneNumber,
        hasTransport,
        transportFee: hasTransport ? transportFee : 0,
      });

      if (studentTargetForEdit?.parentId) {
        const guardian = parentsDatabase.find(
          (entry) => entry.id === studentTargetForEdit.parentId,
        );
        if (guardian) {
          await updateParent(guardian.id, {
            name: updatedParentName,
            phone: updatedPhoneNumber,
          });
        }
      }

      setStudentsDatabase((previousStudents) =>
        previousStudents.map((student) =>
          student.id === studentId
            ? {
                ...student,
                name: updatedStudentName,
                hasTransport,
                transportFee: hasTransport ? transportFee : undefined,
              }
            : student,
        ),
      );

      if (studentTargetForEdit?.parentId) {
        setParentsDatabase((previousGuardians) =>
          previousGuardians.map((guardian) =>
            guardian.id === studentTargetForEdit.parentId
              ? {
                  ...guardian,
                  name: updatedParentName,
                  phone: updatedPhoneNumber,
                }
              : guardian,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to save student profile:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save changes. Check the backend connection.",
      );
      // Re-sync from the server so the UI never shows unsaved data.
      try {
        const [parentsFromDb, studentsFromDb] = await Promise.all([
          getParents(),
          getStudents(),
        ]);
        setParentsDatabase(parentsFromDb);
        setStudentsDatabase(studentsFromDb);
      } catch {
        /* keep the current local state */
      }
    }
  }

  /**
   * LOGIC FOR: AdminAssignFeesForm.tsx (Admin Tab: fees)
   */
  async function handleBatchGenerateClassFees(
    targetGradeClass: string,
    targetAcademicMonth: string,
    feeAmount: number,
    academicYear: number,
  ) {
    try {
      const result = await assignBulkFees({
        targetClass: targetGradeClass,
        targetMonth: targetAcademicMonth,
        assignFees: feeAmount,
        academicYear: academicYear,
      });

      // Refresh fees from the database so UI stays in sync
      const updatedFees = await getFees();
      setFeeObligationsDatabase(updatedFees);

      alert(
        `Successfully generated ${result.count} fee obligations for Class ${targetGradeClass} (${targetAcademicMonth} ${academicYear}).`,
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to assign fees",
      );
    }
  }

  /**
   * LOGIC FOR: AdminPromoteClass.tsx (Admin Tab: promotion)
   * Persists each promotion via PATCH so grade changes survive a refresh.
   */
  async function handleExecuteAnnualPromotion(studentIdsToPromote: string[]) {
    if (studentIdsToPromote.length === 0) return;

    const currentGradeIndex = gradeArray.indexOf(selectedGradeForFilter);
    const nextGradeLevel =
      currentGradeIndex < gradeArray.length - 1
        ? gradeArray[currentGradeIndex + 1]
        : "Graduated";

    const results = await Promise.allSettled(
      studentIdsToPromote.map((studentId) =>
        updateStudents(studentId, { grade: nextGradeLevel }),
      ),
    );

    const promotedIds = studentIdsToPromote.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failedCount = studentIdsToPromote.length - promotedIds.length;

    if (promotedIds.length > 0) {
      setStudentsDatabase((previousStudents) =>
        previousStudents.map((student) =>
          promotedIds.includes(student.id)
            ? { ...student, gradeName: nextGradeLevel }
            : student,
        ),
      );
    }

    if (failedCount === 0) {
      alert(
        `Promoted ${promotedIds.length} students from Class ${selectedGradeForFilter} to Class ${nextGradeLevel}!`,
      );
    } else {
      console.error(
        `${failedCount} promotion(s) failed to save`,
        results.filter((r) => r.status === "rejected"),
      );
      alert(
        `Promoted ${promotedIds.length} students, but ${failedCount} could not be saved. Check the backend connection and try again.`,
      );
    }
  }

  // --------------------------------------------------------------------------
  // DERIVED SELECTORS
  // --------------------------------------------------------------------------
  const editStudentGuardian = studentTargetForEdit
    ? parentsDatabase.find(
        (guardian) => guardian.id === studentTargetForEdit.parentId,
      )
    : undefined;

  const activeSelectedStudent = studentsDatabase.find(
    (student) => student.id === selectedStudentProfileId,
  );

  const activeStudentFinancials = getStudentFinancialSummary(
    selectedStudentProfileId,
    feeObligationsDatabase,
    paymentsDatabase,
  );

  return (
    <div className="app-container">
      {/* 1. Global Navigation Header */}
      <Header role={activeUserRole} onRoleChange={setActiveUserRole} />

      <main className="main-content">
        {dataLoadError && (
          <div className="error-banner load-error-banner" role="alert">
            <strong>Could not load school records:</strong> {dataLoadError} —
            check the backend connection and refresh the page.
          </div>
        )}

        {isLoadingSchoolData ? (
          <div className="app-loading" role="status" aria-live="polite">
            <span className="spinner-lg" aria-hidden="true" />
            <p className="empty-message">Loading school records…</p>
          </div>
        ) : (
          <>
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

                  {activeSelectedStudent && (
                    <FeeDetail
                      student={activeSelectedStudent}
                      feeObligations={feeObligationsDatabase}
                      payments={paymentsDatabase}
                    />
                  )}
                </div>

                <div className="column-right">
                  {activeSelectedStudent && (
                    <>
                      <PayFeesForm
                        student={activeSelectedStudent}
                        netPendingBalance={activeStudentFinancials.netBalance}
                        onPayFee={handleProcessPayment}
                      />

                      <PaymentHistory
                        payments={paymentsDatabase.filter(
                          (receipt) =>
                            receipt.belongsTo === selectedStudentProfileId,
                        )}
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
                    <TrendingUpIcon className="nav-btn-icon" />
                    <span>Overview & Audit</span>
                  </button>

                  <button
                    type="button"
                    className={`admin-tab-btn ${activeAdminTab === "students" ? "active" : ""}`}
                    onClick={() => setActiveAdminTab("students")}
                  >
                    <UsersIcon className="nav-btn-icon" />
                    <span>Class Roster & Enrollment</span>
                  </button>

                  <button
                    type="button"
                    className={`admin-tab-btn ${activeAdminTab === "fees" ? "active" : ""}`}
                    onClick={() => setActiveAdminTab("fees")}
                  >
                    <CalendarIcon className="nav-btn-icon" />
                    <span>Generate Class Fees</span>
                  </button>

                  <button
                    type="button"
                    className={`admin-tab-btn ${activeAdminTab === "promotion" ? "active" : ""}`}
                    onClick={() => setActiveAdminTab("promotion")}
                  >
                    <ArrowRightIcon className="nav-btn-icon" />
                    <span>Class Promotion</span>
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
                    feeObligations={feeObligationsDatabase}
                    students={studentsDatabase}
                    onInputChange={setStandardTuitionFeeInput}
                    onSubmitFeesForm={handleBatchGenerateClassFees}
                  />
                )}

                {/* TAB 4: Annual Class Promotion Tool */}
                {activeAdminTab === "promotion" && (
                  <AdminPromoteClass
                    gradeClass={gradeArray}
                    gradeStudents={studentsDatabase.filter(
                      (student) => student.gradeName === selectedGradeForFilter,
                    )}
                    selectedGrade={selectedGradeForFilter}
                    onDropdownChange={setSelectedGradeForFilter}
                    onPromoteSubmit={handleExecuteAnnualPromotion}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Global Student & Guardian Record Edit Modal */}
      <AdminEditStudentModal
        student={studentTargetForEdit}
        parent={editStudentGuardian}
        isOpen={isEditStudentRecordModalOpen}
        onClose={() => setIsEditStudentRecordModalOpen(false)}
        onSave={handleSaveStudentProfileChanges}
      />
    </div>
  );
}

export default App;
