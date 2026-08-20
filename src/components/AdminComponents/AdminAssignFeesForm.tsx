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
    setSelectedClass(pickMonth[0]);
    setSelectedMonth(pickClass[0]);
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
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            Pick Month
            {pickMonth.map((month) => (
              <option>{month}</option>
            ))}
          </select>
        </span>
        <span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            Pick Grade
            {pickClass.map((classGrade) => (
              <option>{classGrade}</option>
            ))}
          </select>
        </span>
        <button onClick={handleSubmit}>submit fees</button>
      </div>
    </form>
  );
}

export default AdminAssignFeesForm;
