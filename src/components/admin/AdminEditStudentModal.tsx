import { useState } from "react";
import type { Student, Parent } from "../../types";
import { EditIcon, CheckIcon, XIcon } from "../common/Icons";

export interface AdminEditStudentModalProps {
  student: Student | null | undefined;
  parent: Parent | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    studentId: string,
    newStudentName: string,
    newParentName: string,
    newPhone: string
  ) => void;
}

interface InnerFormProps {
  student: Student;
  parent: Parent | null | undefined;
  onClose: () => void;
  onSave: (
    studentId: string,
    newStudentName: string,
    newParentName: string,
    newPhone: string
  ) => void;
}

function AdminEditStudentForm({
  student,
  parent,
  onClose,
  onSave,
}: InnerFormProps) {
  const [studentName, setStudentName] = useState(student.name);
  const [parentName, setParentName] = useState(parent?.name || "");
  const [phone, setPhone] = useState(parent?.phone || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(student.id, studentName.trim(), parentName.trim(), phone.trim());
    onClose();
  }

  return (
    <>
      <div className="modal-header">
        <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <EditIcon className="title-icon" />
          <span>EDIT STUDENT & GUARDIAN RECORD</span>
        </h3>
        <span className="timestamp" style={{ marginTop: "0.25rem", display: "block" }}>
          ID: {student.id} • Class {student.gradeName}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="input-group">
          <label className="box-label">Student Full Name</label>
          <input
            type="text"
            className="text-input"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="box-label">Parent / Guardian Name</label>
          <input
            type="text"
            className="text-input"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="box-label">Parent Phone Number</label>
          <input
            type="tel"
            className="text-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="role-btn cancel-btn"
            onClick={onClose}
          >
            <XIcon className="btn-icon" />
            <span>Cancel</span>
          </button>
          <button type="submit" className="pay-btn save-btn">
            <CheckIcon className="btn-icon" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </>
  );
}

export function AdminEditStudentModal({
  student,
  parent,
  isOpen,
  onClose,
  onSave,
}: AdminEditStudentModalProps) {
  if (!isOpen || !student) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <AdminEditStudentForm
          key={student.id}
          student={student}
          parent={parent}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

export default AdminEditStudentModal;
