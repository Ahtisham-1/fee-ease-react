import { useState } from "react";
import type { NewStudentData } from "../../types";
import { PlusIcon, BusIcon } from "../common/Icons";

export interface AdminAddStudentFormProps {
  classGrade: string[];
  onAddStudent: (data: NewStudentData) => void;
  onClassChange?: (grade: string) => void;
}

export function AdminAddStudentForm({
  classGrade,
  onAddStudent,
  onClassChange,
}: AdminAddStudentFormProps) {
  const [selectedGrade, setSelectedGrade] = useState(classGrade[0] || "1st");
  const [studentFullName, setStudentFullName] = useState("");
  const [parentFullName, setParentFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [baseMonthlyTuition, setBaseMonthlyTuition] = useState("1500");
  const [hasBusTransport, setHasBusTransport] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleClassroomSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newGrade = event.target.value;
    setSelectedGrade(newGrade);
    if (onClassChange) {
      onClassChange(newGrade);
    }
  }

  function handleEnrollmentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const parsedTuition = Number(baseMonthlyTuition);

    if (!studentFullName.trim()) {
      setValidationError("Please enter the student's full name.");
      return;
    }
    if (!parentFullName.trim()) {
      setValidationError("Please enter the parent/guardian's name.");
      return;
    }
    if (!phoneNumber.trim()) {
      setValidationError("Please enter the parent's contact phone number.");
      return;
    }
    if (isNaN(parsedTuition) || parsedTuition <= 0) {
      setValidationError("Please enter a valid positive base tuition fee amount.");
      return;
    }

    onAddStudent({
      studentName: studentFullName.trim(),
      parentName: parentFullName.trim(),
      phone: phoneNumber.trim(),
      grade: selectedGrade,
      tuitionFee: parsedTuition,
      hasTransport: hasBusTransport,
    });

    setStudentFullName("");
    setParentFullName("");
    setPhoneNumber("");
    setBaseMonthlyTuition("1500");
    setHasBusTransport(false);
  }

  return (
    <div className="card add-student-card" role="region" aria-label="Student Enrollment Form">
      <div className="card-title text-center">
        <PlusIcon className="title-icon" />
        <span>ENROLL NEW STUDENT & GUARDIAN</span>
      </div>

      <form onSubmit={handleEnrollmentSubmit} className="enrollment-form-grid">
        {/* Top Field: Select Class */}
        <div className="input-group full-width mb-3">
          <label htmlFor="enroll-class-select" className="box-label">
            SELECT CLASSROOM
          </label>
          <select
            id="enroll-class-select"
            className="class-selector custom-select"
            value={selectedGrade}
            onChange={handleClassroomSelectChange}
            aria-label="Select Enrollment Classroom"
          >
            {classGrade.map((grade) => (
              <option key={grade} value={grade}>
                Class {grade}
              </option>
            ))}
          </select>
        </div>

        {/* Row 1: Student Name & Parent Name */}
        <div className="form-two-col">
          <div className="input-group">
            <label htmlFor="student-name-input" className="box-label">
              STUDENT NAME *
            </label>
            <input
              id="student-name-input"
              type="text"
              className="text-input"
              placeholder="e.g. Zaid Farooq"
              value={studentFullName}
              onChange={(e) => {
                setStudentFullName(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
          </div>

          <div className="input-group">
            <label htmlFor="parent-name-input" className="box-label">
              PARENT NAME *
            </label>
            <input
              id="parent-name-input"
              type="text"
              className="text-input"
              placeholder="e.g. Farooq Ahmad"
              value={parentFullName}
              onChange={(e) => {
                setParentFullName(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
          </div>
        </div>

        {/* Row 2: Phone Number & Transport Option */}
        <div className="form-two-col align-center mt-3">
          <div className="input-group">
            <label htmlFor="phone-input" className="box-label">
              PHONE NUMBER *
            </label>
            <input
              id="phone-input"
              type="tel"
              className="text-input"
              placeholder="e.g. 9876543210"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
          </div>

          <div className="input-group checkbox-cell">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={hasBusTransport}
                onChange={(e) => setHasBusTransport(e.target.checked)}
              />
              <span className="student-name-label">
                <BusIcon className="item-icon-inline" />
                <span>Add Bus Service (+₹1,000/mo)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Row 3: Base Monthly Fee & Submit Button */}
        <div className="form-two-col align-center mt-3">
          <div className="input-group">
            <label htmlFor="tuition-fee-input" className="box-label">
              BASE MONTHLY FEE (₹)
            </label>
            <div className="currency-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                id="tuition-fee-input"
                type="number"
                className="number-input"
                placeholder="Enter fee amount"
                value={baseMonthlyTuition}
                onChange={(e) => {
                  setBaseMonthlyTuition(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                min="1"
              />
            </div>
          </div>

          <div className="input-group submit-cell">
            <button type="submit" className="pay-btn full-width-btn">
              <PlusIcon className="btn-icon" />
              <span>Complete Enrollment</span>
            </button>
          </div>
        </div>

        {validationError && (
          <div className="error-banner mt-3" role="alert">
            {validationError}
          </div>
        )}
      </form>
    </div>
  );
}

export default AdminAddStudentForm;
