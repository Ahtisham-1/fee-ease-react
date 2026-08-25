import { useState } from "react";
import type { Student } from "../../types";
import {
  TrendingUpIcon,
  SearchIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  ShieldIcon,
  UserIcon,
} from "../common/Icons";

export interface AdminPromoteClassProps {
  gradeClass: string[];
  gradeStudents: Student[];
  selectedGrade: string;
  onDropdownChange: (value: string) => void;
  onPromoteSubmit: (selectedStudentIds: string[]) => void;
}

export function AdminPromoteClass({
  gradeClass,
  gradeStudents,
  selectedGrade,
  onDropdownChange,
  onPromoteSubmit,
}: AdminPromoteClassProps) {
  // Sync state during render when selectedGrade changes (React 19 standard)
  const [prevGrade, setPrevGrade] = useState(selectedGrade);
  const [selectedIDs, setSelectedIDs] = useState<string[]>(() => gradeStudents.map((s) => s.id));
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  if (prevGrade !== selectedGrade) {
    setPrevGrade(selectedGrade);
    setSelectedIDs(gradeStudents.map((s) => s.id));
    setSearchQuery("");
  }

  function handleToggle(studentId: string) {
    if (selectedIDs.includes(studentId)) {
      setSelectedIDs(selectedIDs.filter((id) => id !== studentId));
    } else {
      setSelectedIDs([...selectedIDs, studentId]);
    }
  }

  function handleSelectAll() {
    setSelectedIDs(gradeStudents.map((student) => student.id));
  }

  function handleDeselectAll() {
    setSelectedIDs([]);
  }

  function handleInitiatePromotion(event: React.FormEvent) {
    event.preventDefault();
    if (selectedIDs.length === 0) return;
    setIsConfirmModalOpen(true);
  }

  function handleCancelPromotion() {
    setIsConfirmModalOpen(false);
  }

  function handleProceedPromotion() {
    onPromoteSubmit(selectedIDs);
    setIsConfirmModalOpen(false);
  }

  const currentIndex = gradeClass.indexOf(selectedGrade);
  const nextGrade =
    currentIndex < gradeClass.length - 1
      ? gradeClass[currentIndex + 1]
      : "Graduated";

  const filteredStudents = gradeStudents.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="card promotion-card" role="region" aria-label="Class Promotion Tool">
      <div className="card-title text-center">
        <TrendingUpIcon className="title-icon" />
        <span>ANNUAL ACADEMIC CLASS PROMOTION</span>
      </div>

      <form onSubmit={handleInitiatePromotion}>
        {/* Top Section */}
        <div className="input-group full-width mb-4">
          <label htmlFor="promote-grade-select" className="box-label">
            SELECT GRADE TO PROMOTE
          </label>
          <select
            id="promote-grade-select"
            className="class-selector custom-select"
            value={selectedGrade}
            onChange={(e) => onDropdownChange(e.target.value)}
          >
            {gradeClass.map((grade) => (
              <option key={grade} value={grade}>
                Class {grade}
              </option>
            ))}
          </select>
        </div>

        {/* Lower Main 2-Column Grid */}
        <div className="promotion-split-grid">
          {/* LEFT COLUMN */}
          <div className="promotion-left-col">
            <div className="progression-banner-box">
              <span className="box-label">PROMOTION TRAJECTORY</span>
              <div className="promotion-path-display">
                <div className="badge-pill current">Current: Class {selectedGrade}</div>
                <ArrowRightIcon className="arrow-indicator" />
                <div className="badge-pill next">Next: Class {nextGrade}</div>
              </div>
              <p className="empty-subtext mt-2" style={{ fontSize: "0.82rem" }}>
                Checked students will advance to Class {nextGrade}. Unchecked students will remain in Class {selectedGrade}.
              </p>
            </div>

            <div className="promotion-btn-box mt-3">
              <button
                type="submit"
                className="pay-btn full-width-btn"
                disabled={selectedIDs.length === 0}
              >
                <TrendingUpIcon className="btn-icon" />
                <span>Promote {selectedIDs.length} Student{selectedIDs.length === 1 ? "" : "s"} to Class {nextGrade}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="promotion-right-col">
            <div className="toolbar-dual-buttons mb-3">
              <button
                type="button"
                className="role-btn text-xs select-toggle-btn"
                onClick={handleSelectAll}
              >
                <CheckIcon className="btn-icon" />
                <span>Select All ({gradeStudents.length})</span>
              </button>
              <button
                type="button"
                className="role-btn text-xs select-toggle-btn"
                onClick={handleDeselectAll}
              >
                <XIcon className="btn-icon" />
                <span>Deselect All</span>
              </button>
            </div>

            <div className="input-group mb-3 search-input-group">
              <label htmlFor="student-search-input" className="box-label">
                SEARCH BY NAME:
              </label>
              <div className="search-box-wrapper">
                <SearchIcon className="search-svg-icon" />
                <input
                  id="student-search-input"
                  type="text"
                  className="text-input search-input"
                  placeholder="Type student name to filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="promotion-roster-container">
              {gradeStudents.length === 0 ? (
                <p className="empty-history text-center">
                  No students enrolled in Class {selectedGrade} to promote.
                </p>
              ) : filteredStudents.length === 0 ? (
                <p className="empty-history text-center">
                  No students found matching "{searchQuery}".
                </p>
              ) : (
                <div className="promotion-checklist scrollable-feed">
                  {filteredStudents.map((student) => {
                    const isChecked = selectedIDs.includes(student.id);

                    return (
                      <div
                        key={student.id}
                        className={`promotion-row ${isChecked ? "selected" : "unselected"}`}
                        onClick={() => handleToggle(student.id)}
                      >
                        <div className="promotion-student-info">
                          <strong className="student-name" style={{ fontSize: "0.92rem" }}>
                            <UserIcon className="item-icon-inline" />
                            <span>{student.name}</span>
                          </strong>
                          <span className="roster-student-id">ID: {student.id}</span>
                        </div>

                        <div className="promotion-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(student.id)}
                            aria-label={`Select ${student.name} for promotion`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div
          className="modal-overlay"
          onClick={handleCancelPromotion}
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-confirm-title"
        >
          <div
            className="modal-card confirmation-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="promo-confirm-title" className="modal-title">
                CONFIRM CLASS COHORT PROMOTION
              </h3>
            </div>

            <div className="confirmation-body">
              <p className="confirmation-subtext">
                Please verify this academic advancement action before proceeding:
              </p>

              <div className="confirmation-amount-box">
                <span className="confirmation-label">ACADEMIC PROMOTION PATH:</span>
                <strong className="confirmation-student" style={{ fontSize: "1.2rem" }}>
                  Class {selectedGrade} ➔ Class {nextGrade}
                </strong>
                <span className="confirmation-amount" style={{ fontSize: "1.35rem" }}>
                  {selectedIDs.length} of {gradeStudents.length} Students Selected
                </span>
              </div>

              <p className="security-notice">
                <ShieldIcon className="security-icon" />
                <span>Advances student grade levels across the entire school registry.</span>
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="role-btn cancel-btn"
                onClick={handleCancelPromotion}
              >
                <XIcon className="btn-icon" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                className="pay-btn confirm-proceed-btn"
                onClick={handleProceedPromotion}
              >
                <CheckIcon className="btn-icon" />
                <span>Proceed & Promote</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPromoteClass;
