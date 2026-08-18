import { useState } from "react";
import type { Student } from "../ParentComponents/ParentStudentSelector";
import type { Parent } from "../ParentComponents/ParentStudentSelector";
export interface AdminEditStudentModalProps {
  student: Student | undefined;
  parent: Parent | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    studentId: string,
    NewStudentName: string,
    newParentName: string,
    newPhone: string,
  ) => void;
}

function AdminEditStudentModal({
  student,
  parent,
  isOpen,
  onClose,
  onSave,
}: AdminEditStudentModalProps) {
  const [studentName, setStudentName] = useState(student?.name || "");

  const [parentName, setParentName] = useState(parent?.name || "");

  const [phone, setPhone] = useState(parent?.phone || "");

  if (!isOpen || !student) {
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    if (!student) return;
    e.preventDefault();
    onSave(student.id, studentName, parentName, phone);
    onClose();
  }
  return (
    <div className="modal-overlay">
      <div className="card modal-card">
        <div className="card-title">
          <p>
            Student ID: <strong>{student.id}</strong> | Class:{" "}
            <strong>{student.gradeName}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />

          <input
            type="text"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
          />

          <input
            type="number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button type="button" onClick={onClose} className="role-btn">
            Cancel
          </button>
          <button type="submit" className="pay-btn">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
export default AdminEditStudentModal;
