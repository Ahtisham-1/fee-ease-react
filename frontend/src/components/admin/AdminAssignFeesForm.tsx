import { useState } from "react";
import type { Student, FeeObligation } from "../../types";
import { CalendarIcon, CheckCircleIcon, XIcon, PlusIcon, ShieldIcon } from "../common/Icons";

export interface AdminAssignFeesFormProps {
  assignFees: number;
  pickMonth: string[];
  pickClass: string[];
  feeObligations: FeeObligation[];
  students: Student[];
  onInputChange: (value: number) => void;
  onSubmitFeesForm: (
    targetClass: string,
    targetMonth: string,
    assignFees: number,
    academicYear: number
  ) => void;
}

export function AdminAssignFeesForm({
  assignFees,
  pickMonth,
  pickClass,
  feeObligations,
  students,
  onInputChange,
  onSubmitFeesForm,
}: AdminAssignFeesFormProps) {
  const currentAcademicYear = new Date().getFullYear();

  const [selectGrade, setSelectGrade] = useState(pickClass[0] || "1st");
  const [selectMonth, setSelectMonth] = useState(pickMonth[0] || "January");
  const [feeInputString, setFeeInputString] = useState(String(assignFees));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const classStudents = students.filter((s) => s.gradeName === selectGrade);
  const transportCount = classStudents.filter((s) => Boolean(s.hasTransport)).length;
  const standardCount = classStudents.length - transportCount;
  const parsedFee = Number(feeInputString) || 0;
  const totalBatchAmount = classStudents.reduce(
    (sum, s) => sum + (parsedFee + (s.hasTransport ? (s.transportFee ?? 1000) : 0)),
    0
  );

  function isMonthAssignedToClass(monthName: string, gradeName: string): boolean {
    const classStudentIds = students
      .filter((s) => s.gradeName === gradeName)
      .map((s) => s.id);

    return feeObligations.some(
      (bill) =>
        bill.month === monthName &&
        bill.academicYear === currentAcademicYear &&
        classStudentIds.includes(bill.studentId)
    );
  }

  const isCurrentSelectionAssigned = isMonthAssignedToClass(selectMonth, selectGrade);

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const validFee = Number(feeInputString);

    if (isNaN(validFee) || validFee <= 0) {
      setValidationError("Please specify a valid tuition fee amount greater than ₹0.");
      return;
    }

    if (classStudents.length === 0) {
      setValidationError(`No students currently enrolled in Class ${selectGrade}. Enroll students first.`);
      return;
    }

    if (isCurrentSelectionAssigned) {
      setValidationError(
        `Class ${selectGrade} has already been assigned fee obligations for ${selectMonth} (${currentAcademicYear}).`
      );
      return;
    }

    setIsConfirmModalOpen(true);
  }

  function handleCancelGeneration() {
    setIsConfirmModalOpen(false);
  }

  function handleProceedGeneration() {
    const validFee = Number(feeInputString);
    onSubmitFeesForm(selectGrade, selectMonth, validFee, currentAcademicYear);
    setIsConfirmModalOpen(false);
  }

  return (
    <div className="card assign-fees-card compact-card" role="region" aria-label="Generate Class Fees">
      <div className="card-title text-center">
        <CalendarIcon className="title-icon" />
        <span>GENERATE MONTHLY CLASS FEE OBLIGATIONS</span>
      </div>

      <form onSubmit={handleFormSubmit} className="compact-assign-form">
        <div className="form-three-col">
          {/* 1. Target Classroom */}
          <div className="input-group">
            <label htmlFor="assign-class-select" className="box-label">
              TARGET CLASSROOM
            </label>
            <select
              id="assign-class-select"
              className="class-selector custom-select"
              value={selectGrade}
              onChange={(e) => setSelectGrade(e.target.value)}
            >
              {pickClass.map((grade) => (
                <option value={grade} key={grade}>
                  Class {grade}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Target Academic Month */}
          <div className="input-group">
            <label htmlFor="assign-month-select" className="box-label">
              ACADEMIC MONTH ({currentAcademicYear})
            </label>
            <select
              id="assign-month-select"
              className="class-selector custom-select"
              value={selectMonth}
              onChange={(e) => setSelectMonth(e.target.value)}
            >
              {pickMonth.map((month) => {
                const alreadyAssigned = isMonthAssignedToClass(month, selectGrade);
                return (
                  <option
                    value={month}
                    key={month}
                    disabled={alreadyAssigned}
                  >
                    {month} {alreadyAssigned ? `(Assigned ${currentAcademicYear})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Assigned Tuition Fee */}
          <div className="input-group">
            <label htmlFor="assign-fee-amount-input" className="box-label">
              BASE TUITION FEE PER STUDENT (₹)
            </label>
            <div className="currency-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                id="assign-fee-amount-input"
                type="number"
                className="number-input"
                placeholder="Enter fee amount"
                value={feeInputString}
                onChange={(e) => {
                  setFeeInputString(e.target.value);
                  onInputChange(Number(e.target.value) || 0);
                  if (validationError) setValidationError(null);
                }}
                min="1"
              />
            </div>
          </div>
        </div>

        {isCurrentSelectionAssigned && (
          <div className="error-banner mt-3" role="alert">
            <strong>Notice:</strong> Fees for Class {selectGrade} ({selectMonth} {currentAcademicYear}) have already been created.
          </div>
        )}

        {validationError && (
          <div className="error-banner mt-3" role="alert">
            {validationError}
          </div>
        )}

        <button
          type="submit"
          className="pay-btn full-width-btn mt-3"
          disabled={isCurrentSelectionAssigned || classStudents.length === 0}
        >
          <PlusIcon className="btn-icon" />
          <span>
            Generate Fees for Class {selectGrade} ({selectMonth} {currentAcademicYear})
          </span>
        </button>
      </form>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div
          className="modal-overlay"
          onClick={handleCancelGeneration}
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-confirm-title"
        >
          <div
            className="modal-card confirmation-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="batch-confirm-title" className="modal-title">
                CONFIRM BATCH FEE GENERATION
              </h3>
            </div>

            <div className="confirmation-body">
              <p className="confirmation-subtext">
                You are about to issue monthly fee obligations for an entire classroom:
              </p>

              <div className="confirmation-amount-box">
                <span className="confirmation-label">TARGET CLASS & SESSION:</span>
                <strong className="confirmation-student" style={{ fontSize: "1.2rem" }}>
                  Class {selectGrade} — {selectMonth} {currentAcademicYear}
                </strong>
                <span className="confirmation-amount">
                  ₹{totalBatchAmount.toLocaleString("en-IN")} Total Batch
                </span>
                <span className="timestamp">
                  Cohort: {classStudents.length} Students ({standardCount} Standard @ ₹{parsedFee.toLocaleString("en-IN")}{transportCount > 0 ? ` + ${transportCount} Bus Transport @ ₹${(parsedFee + 1000).toLocaleString("en-IN")}` : ""})
                </span>
              </div>

              <p className="security-notice">
                <ShieldIcon className="security-icon" />
                <span>Automatically applies +₹1,000 transport fee for students enrolled in bus service.</span>
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="role-btn cancel-btn"
                onClick={handleCancelGeneration}
              >
                <XIcon className="btn-icon" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                className="pay-btn confirm-proceed-btn"
                onClick={handleProceedGeneration}
              >
                <CheckCircleIcon className="btn-icon" />
                <span>Proceed & Generate Bills</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAssignFeesForm;
