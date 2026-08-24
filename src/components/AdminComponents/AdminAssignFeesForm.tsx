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
    assignFees: number,
  ) => void;
}

function AdminAssignFeesForm({
  assignFees,
  pickMonth,
  pickClass,
  onInputChange,
  onSubmitFeesForm,
}: AdminAssignFeesFormProps) {
  const [selectGrade, setSelectGrade] = useState(pickClass[0]);
  const [selectMonth, setSelectMonth] = useState(pickMonth[0]);

  function handleFeesForm(e: React.FormEvent) {
    e.preventDefault();
    onSubmitFeesForm(selectGrade, selectMonth, assignFees);
  }

  return (
    <form onSubmit={handleFeesForm}>
      <div>
        <select
          value={selectGrade}
          onChange={(e) => setSelectGrade(e.target.value)}
        >
          {pickClass.map((grade) => (
            <option value={grade} key={grade}>
              {grade}
            </option>
          ))}
        </select>

        <select
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

      <div>
        <input
          value={assignFees}
          type="number"
          onChange={(e) => onInputChange(Number(e.target.value))}
        />
        <button type="submit">generate Fees for the {selectGrade}</button>
      </div>
    </form>
  );
}

export default AdminAssignFeesForm;
