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
  onSubmitFeesForm: () => void;
}

function AdminAssignFeesForm({
  assignFees,
  pickMonth,
  pickClass,
  onSubmitFeesForm,
  onInputChange,
}: AdminAssignFeesFormProps) {
  return (
    <form typeof="submit">
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
          <select name="" id="">
            Pick a Month
            {pickMonth.map((month) => (
              <option>{month}</option>
            ))}
          </select>
        </span>
        <span>
          <select name="" id="">
            Pick class to Assign Fees
            {pickClass.map((classGrade) => (
              <option>{classGrade}</option>
            ))}
          </select>
        </span>
        <button onClick={onSubmitFeesForm}>submit fees</button>
      </div>
    </form>
  );
}

export default AdminAssignFeesForm;
