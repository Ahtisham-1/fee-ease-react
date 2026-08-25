export interface SelectClassComponentProps {
  classGrade: string[];
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
}

export function SelectClassComponent({
  classGrade,
  selectedGrade,
  onSelectGrade,
}: SelectClassComponentProps) {
  return (
    <div className="class-selector-wrapper">
      <label className="selector-label">Active Classroom Filter:</label>
      <select
        className="class-selector"
        value={selectedGrade}
        onChange={(e) => onSelectGrade(e.target.value)}
      >
        {classGrade.map((grade) => (
          <option key={grade} value={grade}>
            Class {grade}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectClassComponent;
