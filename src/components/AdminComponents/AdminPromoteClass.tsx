// interface PromoteClassAdmin {
//   gradeClass: string;
//   students: string;
// }
import type { Student } from "../ParentComponents/ParentStudentSelector";

interface AdminPromoteClassProps {
  gradeClass: string[];
  gradeStudents: Student[];
  selectedGrade: string;
  onSubmit: () => void;
  onDropdownChange: (value: string) => void;
}

function AdminPromoteClass({
  gradeClass,
  gradeStudents,
  onSubmit,
  onDropdownChange,
  selectedGrade,
}: AdminPromoteClassProps) {
  return (
    <div>
      <span>
        <select
          value={selectedGrade}
          onChange={(e) => onDropdownChange(e.target.value)}
        >
          {gradeClass.map((grade) => (
            <option value={grade}>{grade}</option>
          ))}
        </select>
      </span>
      <ul>
        {gradeStudents.map((student) => (
          <li>{student.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPromoteClass;
