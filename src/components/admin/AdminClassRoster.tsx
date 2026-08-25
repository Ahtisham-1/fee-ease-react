import { useState } from "react";
import type { Student, Parent, FeeObligation, Payment } from "../../types";
import { getStudentFinancialSummary } from "../../utils/feeCalculator";

export type SortCriteria = "name-asc" | "name-desc" | "fees-high" | "fees-low";

export interface AdminClassRosterProps {
  students: Student[];
  parents: Parent[];
  feeObligations: FeeObligation[];
  payments: Payment[];
  selectedGrade: string;
  classGrade: string[];
  onSelectGrade: (grade: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

/**
 * AdminClassRoster Component
 * 
 * Purpose:
 * Renders the classroom student roster table with:
 * 1. Default-Hidden Show/Hide Toggle Button
 * 2. Multi-Criteria Sort Dropdown (A-Z, Z-A, High-Low Fees, Low-High Fees)
 * 3. Individual Student Cards with Relational Parent Data, Pending Dues, and Delete Functionality
 */
export function AdminClassRoster({
  students,
  parents,
  feeObligations,
  payments,
  selectedGrade,
  classGrade,
  onSelectGrade,
  onEditStudent,
  onDeleteStudent,
}: AdminClassRosterProps) {
  // 1. Show/Hide Toggle State (Hidden by default per blueprint)
  const [isStudentsListVisible, setIsStudentsListVisible] = useState(false);

  // 2. Sort Criteria State
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("name-asc");

  // Filter students strictly in this class
  const classStudents = students.filter(
    (student) => student.gradeName === selectedGrade
  );

  // Apply Sorting Logic
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
      {/* Header Bar with Class Filter, Show/Hide Toggle, and Sort Dropdown */}
      <div className="roster-header-controls">
        <div className="roster-title-box">
          <div className="card-title" style={{ marginBottom: 0 }}>
            STUDENT LIST — CLASS {selectedGrade}
          </div>
          <span className="badge" style={{ marginTop: "0.2rem" }}>
            {classStudents.length} Enrolled
          </span>
        </div>

        <div className="roster-action-bar">
          {/* Classroom Selector */}
          <select
            className="class-selector mini-select"
            value={selectedGrade}
            onChange={(e) => onSelectGrade(e.target.value)}
            aria-label="Filter Classroom"
          >
            {classGrade.map((grade) => (
              <option key={grade} value={grade}>
                Class {grade}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
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

          {/* Show / Hide Toggle Button (Hidden by default per diagram) */}
          <button
            type="button"
            className={`role-btn toggle-roster-btn ${isStudentsListVisible ? "active" : ""}`}
            onClick={() => setIsStudentsListVisible((prev) => !prev)}
          >
            {isStudentsListVisible ? "🙈 Hide Students" : "👁️ Show Students"}
          </button>
        </div>
      </div>

      {/* Collapsible Student Roster List */}
      {!isStudentsListVisible ? (
        <div className="roster-collapsed-placeholder text-center">
          <p className="empty-subtext">
            📋 Student list is currently collapsed. Click <strong>"👁️ Show Students"</strong> above to view Class {selectedGrade} roster.
          </p>
        </div>
      ) : classStudents.length === 0 ? (
        <div className="empty-history text-center mt-3">
          <p>No students enrolled in Class {selectedGrade} yet.</p>
          <p className="empty-subtext">Use the enrollment form to register students.</p>
        </div>
      ) : (
        <div className="history-list scrollable-feed mt-3">
          {sortedStudents.map((student) => {
            const guardian = parents.find((p) => p.id === student.parentId);
            const { netBalance } = getStudentFinancialSummary(
              student.id,
              feeObligations,
              payments
            );

            return (
              <div key={student.id} className="history-item roster-blueprint-card">
                {/* Left Section: Name, Parent Name, Grade */}
                <div className="roster-left-info">
                  <strong className="student-name">{student.name}</strong>
                  <span className="parent-subtext">
                    👤 Parent: {guardian ? guardian.name : "N/A"} ({guardian ? guardian.phone : ""})
                  </span>
                  <span className="grade-tag">Class: {student.gradeName}</span>
                </div>

                {/* Right Section: ID, Pending Fees, Actions */}
                <div className="roster-right-info">
                  <div className="roster-id-fee-box">
                    <span className="roster-student-id">ID: {student.id}</span>
                    <div className="pending-fee-badge-box">
                      <span className="stat-label">PENDING:</span>
                      <strong
                        className={`pending-amount ${
                          netBalance === 0 ? "text-success" : "text-danger"
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
                      onClick={() => onEditStudent(student)}
                      title="Edit Student Record"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      className="role-btn delete-action-btn"
                      onClick={() => onDeleteStudent(student.id)}
                      title="Delete Student from Class"
                    >
                      🗑️ Delete
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
