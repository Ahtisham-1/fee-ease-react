// interface PromoteClassAdmin {
//   gradeClass: string;
//   students: string;
// }
import type { Student } from "../ParentComponents/ParentStudentSelector";

interface AdminPromoteClassProps {
  gradeClass: string[];
  gradeStudents: Student[];
  selectedGrade: string;
  onDropdownChange: (value: string) => void;
  onPromoteSubmit: (gradeName: string) => void;
}

function AdminPromoteClass({
  gradeClass,
  gradeStudents,
  onPromoteSubmit,
  onDropdownChange,
  selectedGrade,
}: AdminPromoteClassProps) {
  function handlePromote(e: React.FormEvent) {
    e.preventDefault();
  }
  return (
    <form onSubmit={onPromoteSubmit}>
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
      <button type="button" onClick={onPromoteSubmit}>
        Promote
      </button>
    </form>
  );
}

export default AdminPromoteClass;
