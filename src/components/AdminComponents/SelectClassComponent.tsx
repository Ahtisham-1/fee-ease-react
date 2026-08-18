export interface Grades {
  classGrade: string;
}

export interface SelectClassComponentProps {
  classGrade: string[];
  selectedGrade: string;
  onSelectGrade: (setPickGrade: string) => void;
}

function SelectClassComponent({
  classGrade,
  selectedGrade,
  onSelectGrade,
}: SelectClassComponentProps) {
  return (
    <>
      <div className="class-selector-wrapper">
        <select
          className="class-selector"
          value={selectedGrade}
          onChange={(e) => onSelectGrade(e.target.value)}
        >
          {classGrade.map((grade) => (
            <option key={grade}>{grade}</option>
          ))}
        </select>
      </div>
    </>
  );
}

export default SelectClassComponent;
