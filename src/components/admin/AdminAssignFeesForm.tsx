import { useState } from "react";

export interface AdminAssignFeesFormProps {
  assignFees: number;
  pickMonth: string[];
  pickClass: string[];
  onInputChange: (value: number) => void;
  onSubmitFeesForm: (
    targetClass: string,
    targetMonth: string,
    assignFees: number
  ) => void;
}

export function AdminAssignFeesForm({
  assignFees,
  pickMonth,
  pickClass,
  onInputChange,
  onSubmitFeesForm,
}: AdminAssignFeesFormProps) {
  const [selectGrade, setSelectGrade] = useState(pickClass[0] || "1st");
  const [selectMonth, setSelectMonth] = useState(pickMonth[0] || "Jan");

  function handleFeesForm(e: React.FormEvent) {
    e.preventDefault();
    onSubmitFeesForm(selectGrade, selectMonth, assignFees);
  }

  return (
    <div className="card assign-fees-card">
      <div className="card-title">GENERATE MONTHLY CLASS FEE OBLIGATION</div>

      <form onSubmit={handleFeesForm} className="assign-form">
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Target Classroom</label>
            <select
              className="class-selector"
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

          <div className="input-group">
            <label className="input-label">Target Academic Month</label>
            <select
              className="class-selector"
              value={selectMonth}
              onChange={(e) => setSelectMonth(e.target.value)}
            >
              {pickMonth.map((month) => (
                <option value={month} key={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Assigned Tuition Fee (₹)</label>
            <div className="currency-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                className="number-input"
                value={assignFees}
                onChange={(e) => onInputChange(Number(e.target.value))}
                min="0"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="pay-btn">
          📢 Generate ₹{assignFees.toLocaleString()} Fee for Class {selectGrade} ({selectMonth})
        </button>
      </form>
    </div>
  );
}

export default AdminAssignFeesForm;
