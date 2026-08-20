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
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="number"
          placeholder="Assign Fees"
          value={assignFees}
          onChange={(e) => onInputChange(Number(e.target.value))}
        />
      </div>
      <div>
        <span>
          value={selectedMonth}
          <select>
            Pick Month
            {pickMonth.map((month) => (
              <option onChange={(e) => setSelectedMonth(e.target.value)}>
                {month}
              </option>
            ))}
          </select>
        </span>
        <span>
          <select value={selectedClass}>
            Pick Grade
            {pickClass.map((classGrade) => (
              <option onChange={(e) => setSelectedClass(e.target.value)}>
                {classGrade}
              </option>
            ))}
          </select>
        </span>
        <button onClick={handleSubmit}>submit fees</button>
      </div>
    </form>
  );
}

export default AdminAssignFeesForm;
