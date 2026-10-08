import { useState, useEffect } from "react";
import type { Student, Parent, FeeObligation, Payment } from "../../types";
import { getStudentFinancialSummary } from "../../utils/feeCalculator";
import { formatRupees } from "../../utils/format";
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
  XIcon,
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Whenever grade or search query changes, reset back to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade, searchQuery]);

  const classStudents = students.filter(
    (student) => student.gradeName === selectedGrade
  );
 
  // Precompute each student's pending balance ONCE per render instead of
  // recomputing it inside the sort comparator and again for every row.
  const netBalanceById = new Map<string, number>(
    classStudents.map((student) => [
      student.id,
      getStudentFinancialSummary(student.id, feeObligations, payments).netBalance,
    ])
  );

  const parentsById = new Map(parents.map((parent) => [parent.id, parent]));

  const classTotalPending = classStudents.reduce(
    (sum, student) => sum + (netBalanceById.get(student.id) ?? 0),
    0
  );

  const sortedStudents = [...classStudents].sort((studentA, studentB) => {
    if (sortCriteria === "name-asc") {
      return studentA.name.localeCompare(studentB.name);
    }
    if (sortCriteria === "name-desc") {
      return studentB.name.localeCompare(studentA.name);
    }

    const balanceA = netBalanceById.get(studentA.id) ?? 0;
    const balanceB = netBalanceById.get(studentB.id) ?? 0;

    if (sortCriteria === "fees-high") {
      return balanceB - balanceA;
    }
    return balanceA - balanceB;
  });

  const displayedStudents = sortedStudents.filter((student) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const guardian = parentsById.get(student.parentId);
    return (
      student.name.toLowerCase().includes(query) ||
      (guardian !== undefined &&
        (guardian.name.toLowerCase().includes(query) ||
          guardian.phone.includes(query)))
    );
  });

  const totalPages = Math.ceil(displayedStudents.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = displayedStudents.slice(startIndex, startIndex + pageSize);

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
        <div className="roster-toolbar">
          <div className="cohort-stats-bar">
            <span className="cohort-stat">
              Cohort Total: <strong>{classStudents.length} Students</strong>
            </span>
            <span className="cohort-stat">
              Total Pending:{" "}
              <strong className={classTotalPending === 0 ? "text-emerald" : "text-amber"}>
                {formatRupees(classTotalPending)}
              </strong>
            </span>
          </div>

          <div className="search-box-wrapper">
            <SearchIcon className="search-svg-icon" />
            <input
              type="text"
              className="text-input roster-search-input"
              placeholder={`Search in Class ${selectedGrade} by student or parent name...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="roster-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                title="Clear search"
              >
                <XIcon style={{ width: "13px", height: "13px" }} />
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
          {paginatedStudents.map((student) => {
            const guardian = parentsById.get(student.parentId);
            const netBalance = netBalanceById.get(student.id) ?? 0;

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
                  <div className="roster-tags-row">
                    <span className="grade-tag">Class {student.gradeName}</span>
                    {student.hasTransport && (
                      <span className="bus-badge">
                        <BusIcon style={{ width: "12px", height: "12px" }} />
                        <span>Bus (+{formatRupees(student.transportFee ?? 1000)})</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="roster-right-info">
                  <div className="roster-id-fee-box">
                    <span className="roster-student-id">ID: {student.id}</span>
                    <div className="pending-fee-badge-box">
                      {netBalance === 0 ? (
                        <span className="status-badge paid status-badge-sm">
                          <CheckCircleIcon style={{ width: "12px", height: "12px" }} />
                          <span>Cleared</span>
                        </span>
                      ) : (
                        <>
                          <span className="stat-label">PENDING:</span>
                          <strong className="pending-amount text-amber">
                            {formatRupees(netBalance)}
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

      {/* Pagination Controls */}
      {isStudentsListVisible && displayedStudents.length > pageSize && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--card-border)",
          }}
        >
          <button
            type="button"
            className="role-btn mini-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            ◀ Previous
          </button>

          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            Page {currentPage} of {totalPages} ({displayedStudents.length} Students)
          </span>

          <button
            type="button"
            className="role-btn mini-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminClassRoster;
