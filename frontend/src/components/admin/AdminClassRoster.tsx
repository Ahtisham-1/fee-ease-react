import { useState } from "react";
import type { Student, Parent, FeeObligation, Payment } from "../../types";
import { getStudentFinancialSummary } from "../../utils/feeCalculator";
import { EyeIcon, EyeOffIcon, EditIcon, TrashIcon, UsersIcon, UserIcon, BusIcon } from "../common/Icons";

export type SortCriteria = "name-asc" | "name-desc" | "fees-high" | "fees-low";

export interface AdminClassRosterProps {
  students?: Student[];
  parents?: Parent[];
  feeObligations?: FeeObligation[];
  payments?: Payment[];
  selectedGrade?: string;
  classGrade?: string[];
  onSelectGrade?: (grade: string) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
}

export function AdminClassRoster({
  students = [],
  parents = [],
  feeObligations = [],
  payments = [],
  selectedGrade = "1st",
  classGrade = [],
  onSelectGrade,
  onEditStudent,
  onDeleteStudent,
}: AdminClassRosterProps) {
  const [isStudentsListVisible, setIsStudentsListVisible] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("name-asc");

  const classStudents = (students || []).filter(
    (student) => student.gradeName === selectedGrade
  );

  const sortedStudents = [...classStudents].sort((studentA, studentB) => {
    if (sortCriteria === "name-asc") {
      return studentA.name.localeCompare(studentB.name);
    }
    if (sortCriteria === "name-desc") {
      return studentB.name.localeCompare(studentA.name);
    }

    const financeA = getStudentFinancialSummary(studentA.id, feeObligations, payments);
    const financeB = getStudentFinancialSummary(studentB.id, feeObligations, payments);

    if (sortCriteria === "fees-high") {
      return financeB.netBalance - financeA.netBalance;
    }
    if (sortCriteria === "fees-low") {
      return financeA.netBalance - financeB.netBalance;
    }

    return 0;
  });

  return (
    <div className="card roster-card" role="region" aria-label="Classroom Student Roster">
      {/* Header Bar */}
      <div className="roster-header-controls">
        <div className="card-title mb-0">
          <UsersIcon className="title-icon" />
          <span>CLASS {selectedGrade} ROSTER ({classStudents.length} ENROLLED)</span>
        </div>

        <div className="roster-action-bar">
          <select
            className="class-selector mini-select"
            value={selectedGrade}
            onChange={(e) => onSelectGrade?.(e.target.value)}
            aria-label="Filter by Grade"
          >
            {classGrade.map((grade) => (
              <option value={grade} key={grade}>
                Class {grade}
              </option>
            ))}
          </select>

          <select
            className="class-selector mini-select"
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value as SortCriteria)}
            aria-label="Sort Students"
          >
            <option value="name-asc">Sort: A to Z</option>
            <option value="name-desc">Sort: Z to A</option>
            <option value="fees-high">Sort: Fees (High to Low)</option>
            <option value="fees-low">Sort: Fees (Low to High)</option>
          </select>

          <button
            type="button"
            className={`role-btn toggle-roster-btn ${isStudentsListVisible ? "active" : ""}`}
            onClick={() => setIsStudentsListVisible((prev) => !prev)}
          >
            {isStudentsListVisible ? (
              <>
                <EyeOffIcon className="btn-icon" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <EyeIcon className="btn-icon" />
                <span>Show</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!isStudentsListVisible ? (
        <div className="roster-collapsed-placeholder text-center">
          <p className="empty-subtext">
            Student list is collapsed. Click <strong>"Show"</strong> to view Class {selectedGrade} cohort.
          </p>
        </div>
      ) : classStudents.length === 0 ? (
        <div className="empty-history text-center mt-3">
          <p>No students enrolled in Class {selectedGrade} yet.</p>
          <p className="empty-subtext">Use the enrollment form on the left to register students.</p>
        </div>
      ) : (
        <div className="history-list scrollable-feed mt-3">
          {sortedStudents.map((student) => {
            const guardian = (parents || []).find((p) => p.id === student.parentId);
            const { netBalance } = getStudentFinancialSummary(
              student.id,
              feeObligations,
              payments
            );

            return (
              <div key={student.id} className="history-item roster-blueprint-card">
                <div className="roster-left-info">
                  <strong className="student-name">
                    <UserIcon className="item-icon-inline" />
                    <span>{student.name}</span>
                  </strong>
                  <span className="parent-subtext">
                    Parent: {guardian ? guardian.name : "N/A"} ({guardian ? guardian.phone : ""})
                  </span>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.2rem" }}>
                    <span className="grade-tag">Class {student.gradeName}</span>
                    {student.hasTransport && (
                      <span className="badge-pill" style={{ background: "var(--amber-light)", color: "var(--warning-text)", border: "1px solid var(--warning-border)", fontSize: "0.68rem", padding: "0.15rem 0.45rem", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <BusIcon style={{ width: "12px", height: "12px" }} />
                        <span>Bus (+₹{(student.transportFee ?? 1000).toLocaleString("en-IN")})</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="roster-right-info">
                  <div className="roster-id-fee-box">
                    <span className="roster-student-id">ID: {student.id}</span>
                    <div className="pending-fee-badge-box">
                      <span className="stat-label">PENDING:</span>
                      <strong
                        className={`pending-amount ${
                          netBalance === 0 ? "text-emerald" : "text-amber"
                        }`}
                      >
                        ₹{netBalance.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>

                  <div className="roster-btn-group">
                    <button
                      type="button"
                      className="role-btn edit-action-btn"
                      onClick={() => onEditStudent?.(student)}
                      title="Edit Student Record"
                    >
                      <EditIcon className="btn-icon" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="role-btn delete-action-btn"
                      onClick={() => onDeleteStudent?.(student.id)}
                      title="Delete Student"
                    >
                      <TrashIcon className="btn-icon" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminClassRoster;
