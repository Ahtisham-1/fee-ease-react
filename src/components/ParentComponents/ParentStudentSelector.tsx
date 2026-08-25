export interface Student {
  id: string;
  name: string;
  parentId: string;
  gradeName: string;
}

export interface Parent {
  id: string;
  name: string;
  phone: string;
}

interface ParentStudentSelectorProps {
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
  selectedStudentId,
  selectedParentId,
  onSelectParent,
  onSelectStudent,
}: ParentStudentSelectorProps) {
  return (
    <div>
      <div>
        <select
          value={selectedParentId}
          onChange={(e) => onSelectParent(e.target.value)}
        >
          {parents.map((singleParent) => (
            <option key={singleParent.id} value={singleParent.id}>{singleParent.name}</option>
          ))}
        </select>
      </div>

      <div>
        <select
          value={selectedStudentId}
          onChange={(e) => onSelectStudent(e.target.value)}
        >
          {students.map((singleStudent) => (
            <option key={singleStudent.id} value={singleStudent.id}>
              {singleStudent.name} | {singleStudent.gradeName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ParentStudentSelector;
