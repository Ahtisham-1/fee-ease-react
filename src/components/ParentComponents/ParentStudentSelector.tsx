export interface Parent {
  id: string;
  name: string;
  phone:string
}

export interface Student {
  id: string;
  name: string;
  parentId: string;
  gradeName: string;
}

export interface ParentStudentSelectorProps {
  parents: Parent[];
  students: Student[];
  selectedParentId: string;
  selectedStudentId: string;
  onSelectParent: (parentId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

function ParentStudentSelector({
  parents,
  students,
  selectedParentId,
  selectedStudentId,
  onSelectParent,
  onSelectStudent,
}: ParentStudentSelectorProps) {
  return (
    <div className="card">
      <div className="selector-group">
        <div className="selector-field">
          <label className="selector-label">SELECT PARENT</label>
          <select
            className="custom-select"
            value={selectedParentId}
            onChange={(e) => onSelectParent(e.target.value)}
          >
            {parents.map((singleParent) => (
              <option value={singleParent.id} key={singleParent.id}>
                {singleParent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="selector-field">
          <label className="selector-label">SELECT STUDENT</label>
          <select
            className="custom-select"
            value={selectedStudentId}
            onChange={(e) => onSelectStudent(e.target.value)}
          >
            {students.map((singleStudent) => (
              <option value={singleStudent.id} key={singleStudent.id}>
                {singleStudent.name} ({singleStudent.gradeName})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default ParentStudentSelector;
