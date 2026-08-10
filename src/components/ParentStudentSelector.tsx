export interface Parent {
  id: string;
  name: string;
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
    <>
      <div>
        <select
          value={selectedParentId}
          onChange={(e) => onSelectParent(e.target.value)}
        >
          {parents.map((singleParent) => (
            <option value={singleParent.id} key={singleParent.id}>
              {singleParent.name}
            </option>
          ))}
        </select>

        <select
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
    </>
  );
}

export default ParentStudentSelector;
