import { useState } from "react";

export interface AssignFeesForm {
  assignFees: number;
  pickMonth: string;
  pickClass: string;
}

interface AdminAssignFeesFormProps {
  assignFees: number;
  pickMonth: string[];
  pickClass: string[];
  onInputChange: (value: number) => void;
  onSubmitFeesForm: (
    targetClass: string,
    targetMonth: string,
    amount: number,
  ) => void;
}

function AdminAssignFeesForm({
  assignFees,
  pickMonth,
  pickClass,
  onSubmitFeesForm,
  onInputChange,
}: AdminAssignFeesFormProps) {
  const [selectedMonth, setSelectedMonth] = useState(pickMonth[0]);
  const [selectedClass, setSelectedClass] = useState(pickClass[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmitFeesForm(selectedClass, selectedMonth, assignFees);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form-container">
      <div className="card-title">MASS MONTHLY FEE ASSIGNMENT</div>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Assign and generate monthly fee obligations for all students in a selected class simultaneously.
      </p>

      <div className="form-grid">
        <div className="selector-field">
          <label className="selector-label">TARGET CLASS</label>
          <select
            className="custom-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {pickClass.map((classGrade) => (
              <option key={classGrade} value={classGrade}>
                Class {classGrade}
              </option>
            ))}
          </select>
        </div>

        <div className="selector-field">
          <label className="selector-label">BILLING MONTH</label>
          <select
            className="custom-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {pickMonth.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="selector-field" style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
        <label className="selector-label">MONTHLY TUITION AMOUNT (₹)</label>
        <input
          type="number"
          placeholder="e.g. 2500"
          value={assignFees}
          onChange={(e) => onInputChange(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <button type="submit">
        Generate Monthly Fees for Class {selectedClass}
      </button>
    </form>
  );
}

export default AdminAssignFeesForm;
