import { useState } from "react";
import type { Student, Parent, FeeObligation, Payment } from "../../types";
import { getStudentFinancialSummary } from "../../utils/feeCalculator";
import {
  EyeIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  UsersIcon,
  UserIcon,
  BusIcon,
  SearchIcon,
  CheckCircleIcon,
} from "../common/Icons";

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
  const [isStudentsListVisible, setIsStudentsListVisible] = useState(true);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("name-asc");
  const [searchQuery, setSearchQuery] = useState("");

  const classStudents = (students || []).filter(
    (student) => student.gradeName === selectedGrade
  );

  const classTotalPending = classStudents.reduce((sum, s) => {
    const { netBalance } = getStudentFinancialSummary(s.id, feeObligations, payments);
    return sum + netBalance;
  }, 0);

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

  const displayedStudents = sortedStudents.filter((student) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const guardian = (parents || []).find((p) => p.id === student.parentId);
    return (
      student.name.toLowerCase().includes(query) ||
      (guardian && (guardian.name.toLowerCase().includes(query) || guardian.phone.includes(query)))
    );
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

      {/* Class Cohort Quick Stats & Search Bar */}
      {isStudentsListVisible && classStudents.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.45rem 0.75rem",
            background: "var(--input-bg)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--card-border)",
            fontSize: "0.8rem",
          }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Cohort Total: <strong>{classStudents.length} Students</strong>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              Total Pending:{" "}
              <strong className={classTotalPending === 0 ? "text-emerald" : "text-amber"}>
                ₹{classTotalPending.toLocaleString("en-IN")}
              </strong>
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <SearchIcon style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              width: "15px",
              height: "15px",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }} />
            <input
              type="text"
              className="text-input"
              style={{
                paddingLeft: "2.1rem",
                paddingRight: searchQuery ? "2rem" : "0.75rem",
                height: "36px",
                fontSize: "0.82rem",
                borderRadius: "var(--radius-sm)",
              }}
              placeholder={`Search in Class ${selectedGrade} by student or parent name...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "0.6rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

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
      ) : displayedStudents.length === 0 ? (
        <div className="empty-history text-center mt-3">
          <p>No students match "{searchQuery}" in Class {selectedGrade}.</p>
          <button
            type="button"
            className="role-btn mini-btn mt-2"
            onClick={() => setSearchQuery("")}
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="history-list scrollable-feed mt-3">
          {displayedStudents.map((student) => {
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
                      {netBalance === 0 ? (
                        <span
                          className="status-badge paid"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "0.15rem 0.45rem",
                            fontSize: "0.72rem",
                          }}
                        >
                          <CheckCircleIcon style={{ width: "12px", height: "12px" }} />
                          <span>Cleared</span>
                        </span>
                      ) : (
                        <>
                          <span className="stat-label">PENDING:</span>
                          <strong className="pending-amount text-amber">
                            ₹{netBalance.toLocaleString("en-IN")}
                          </strong>
                        </>
                      )}
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
