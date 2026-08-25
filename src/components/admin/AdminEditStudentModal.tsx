import { useState, useEffect } from "react";
import type { Student, Parent } from "../../types";

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

export function AdminEditStudentModal({
  student,
  parent,
  isOpen,
  onClose,
  onSave,
}: AdminEditStudentModalProps) {
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");

  // Sync state whenever active editing student/parent changes
  useEffect(() => {
    if (student) setStudentName(student.name);
    if (parent) {
      setParentName(parent.name);
      setPhone(parent.phone);
    }
  }, [student, parent]);

  // Security Guard & Visibility Gatekeeper
  if (!isOpen || !student) {
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;

    onSave(student.id, studentName, parentName, phone);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">EDIT STUDENT & FAMILY RECORD</h3>
          <span className="modal-meta">
            ID: {student.id} | Class {student.gradeName}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label">Student Full Name</label>
            <input
              type="text"
              className="text-input"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Parent / Guardian Name</label>
            <input
              type="text"
              className="text-input"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Parent Phone Number</label>
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
              Cancel
            </button>
            <button type="submit" className="pay-btn save-btn">
              💾 Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminEditStudentModal;
