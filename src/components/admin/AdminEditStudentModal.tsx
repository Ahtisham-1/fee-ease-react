import { useState } from "react";
import type { Student, Parent } from "../../types";
import { EditIcon, CheckIcon, XIcon, BusIcon } from "../common/Icons";

export interface AdminEditStudentModalProps {
  student: Student | null | undefined;
  parent: Parent | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    studentId: string,
    newStudentName: string,
    newParentName: string,
    newPhone: string,
    hasTransport: boolean,
    transportFee: number
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
    newPhone: string,
    hasTransport: boolean,
    transportFee: number
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
  const [hasTransport, setHasTransport] = useState<boolean>(Boolean(student.hasTransport));
  const [transportFeeInput, setTransportFeeInput] = useState<string>(
    String(student.transportFee ?? 1000)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedTransportFee = hasTransport ? Number(transportFeeInput) || 1000 : 0;
    onSave(
      student.id,
      studentName.trim(),
      parentName.trim(),
      phone.trim(),
      hasTransport,
      parsedTransportFee
    );
    onClose();
  }

  return (
    <>
      <div className="modal-header">
        <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <EditIcon className="title-icon" />
          <span>EDIT STUDENT & TRANSPORT SETTINGS</span>
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

        {/* Bus Service & Variable Transport Fee */}
        <div style={{ background: "var(--input-bg)", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--input-border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label className="checkbox-container">
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={hasTransport}
              onChange={(e) => setHasTransport(e.target.checked)}
            />
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <BusIcon style={{ width: "16px", height: "16px", color: "var(--emerald-dark)" }} />
              <strong>Enrolled in Bus Service</strong>
            </span>
          </label>

          {hasTransport && (
            <div className="input-group" style={{ marginTop: "0.25rem" }}>
              <label htmlFor="edit-transport-fee-input" className="box-label">
                MONTHLY TRANSPORT FEE (₹) — BASED ON DISTANCE / ROUTE
              </label>
              <div className="currency-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  id="edit-transport-fee-input"
                  type="number"
                  className="number-input"
                  placeholder="e.g. 500, 1000, 1500"
                  value={transportFeeInput}
                  onChange={(e) => setTransportFeeInput(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <span className="timestamp" style={{ color: "var(--emerald-dark)" }}>
                💡 Variable rate: Set according to student distance (e.g. 2km = ₹500, 10km = ₹1,000).
              </span>
            </div>
          )}
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
            <span>Save Profile & Transport</span>
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
