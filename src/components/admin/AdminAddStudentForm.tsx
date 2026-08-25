import { useState } from "react";
import type { NewStudentData } from "../../types";

export interface AdminAddStudentFormProps {
  classGrade: string[];
  onAddStudent: (data: NewStudentData) => void;
}

export function AdminAddStudentForm({
  classGrade,
  onAddStudent,
}: AdminAddStudentFormProps) {
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState(classGrade[0] || "1st");
  const [tuitionFee, setTuitionFee] = useState(1500);
  const [hasTransport, setHasTransport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentName.trim() || !parentName.trim() || !phone.trim() || !grade.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    onAddStudent({
      studentName: studentName.trim(),
      parentName: parentName.trim(),
      phone: phone.trim(),
      grade,
      tuitionFee,
      hasTransport,
    });

    // Reset inputs
    setStudentName("");
    setParentName("");
    setPhone("");
    setGrade(classGrade[0] || "1st");
    setTuitionFee(1500);
    setHasTransport(false);
  }

  return (
    <div className="card add-student-card">
      <div className="card-title">ENROLL NEW STUDENT & FAMILY</div>

      <form onSubmit={handleSubmit} className="enroll-form">
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Student Full Name *</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Zaid Farooq"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Parent / Guardian Name *</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Farooq Ahmad"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Parent Phone Number *</label>
            <input
              type="tel"
              className="text-input"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Enrolling Classroom *</label>
            <select
              className="class-selector"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              {classGrade.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Base Monthly Tuition Fee (₹)</label>
            <div className="currency-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                className="number-input"
                value={tuitionFee}
                onChange={(e) => setTuitionFee(Number(e.target.value))}
                min="0"
              />
            </div>
          </div>

          <div className="input-group checkbox-group">
            <label className="checkbox-container mt-6">
              <input
                type="checkbox"
                checked={hasTransport}
                onChange={(e) => setHasTransport(e.target.checked)}
              />
              <span className="student-name-label">
                Include Bus Service (+₹1,000/mo)
              </span>
            </label>
          </div>
        </div>

        {errorMessage && <div className="error-banner">⚠️ {errorMessage}</div>}

        <button type="submit" className="pay-btn mt-4">
          ➕ Complete Enrollment & Generate Account
        </button>
      </form>
    </div>
  );
}

export default AdminAddStudentForm;
