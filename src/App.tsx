import { useState } from "react";
import Header from "./components/Header";
import type { Role } from "./components/Header";
import ParentStudentSelector, {
  type Student,
} from "./components/ParentComponents/ParentStudentSelector";
import FeeDetail, {
  type FeeObligation,
} from "./components/ParentComponents/FeeDetail";
import type { Payment } from "./components/ParentComponents/PayFeesForm";
import PayFeesForm from "./components/ParentComponents/PayFeesForm";
import PaymentHistory from "./components/ParentComponents/PaymentHistory";
import AdminCollectionSummary from "./components/AdminComponents/AdminCollectionsSummary";
import AdminPaymentHistory from "./components/AdminComponents/AdminPaymentHistory";
import SelectClassComponent from "./components/AdminComponents/SelectClassComponent";
import AdminClassRoster from "./components/AdminComponents/AdminClassRoster";
import type { NewStudentData } from "./components/AdminComponents/AdminAddStudentForm";
import AdminAddStudentForm from "./components/AdminComponents/AdminAddStudentForm";
import AdminEditStudentModal from "./components/AdminComponents/AdminEditStudentModal";
import AdminAssignFeesForm from "./components/AdminComponents/AdminAssignFeesForm";
import AdminPromoteClass from "./components/AdminComponents/AdminPromoteClass";

const parents = [
  { id: "p1", name: "Quyoom", phone: "123456" },
  { id: "p2", name: "Mukhtar", phone: "123456" },
  { id: "p3", name: "Farooq Ahmad", phone: "123456" },
  { id: "p4", name: "Altaf Hussain", phone: "123456" },
  { id: "p5", name: "Bashir Ahmad", phone: "123456" },
  { id: "p6", name: "Ghulam Hassan", phone: "123456" },
  { id: "p7", name: "Tariq Ahmad", phone: "123456" },
  { id: "p8", name: "Manzoor Ahmad", phone: "123456" },
  { id: "p9", name: "Mushtaq Ahmad", phone: "123456" },
  { id: "p10", name: "Shabir Ahmad", phone: "123456" },
  { id: "p11", name: "Mohammad Ashraf", phone: "123456" },
  { id: "p12", name: "Reyaz Ahmad", phone: "123456" },
];
const students = [
  // Class 1st
  { id: "s101", name: "Zaid Farooq", parentId: "p3", gradeName: "1st" },
  { id: "s102", name: "Ayat Altaf", parentId: "p4", gradeName: "1st" },
  // Class 2nd
  { id: "s201", name: "Burhan Bashir", parentId: "p5", gradeName: "2nd" },
  { id: "s202", name: "Hadiya Hassan", parentId: "p6", gradeName: "2nd" },
  // Class 3rd
  { id: "s301", name: "Daniyal Tariq", parentId: "p7", gradeName: "3rd" },
  { id: "s302", name: "Bareen Manzoor", parentId: "p8", gradeName: "3rd" },
  // Class 4th
  { id: "s401", name: "Mohammad Hammad", parentId: "p9", gradeName: "4th" },
  { id: "s402", name: "Zoya Shabir", parentId: "p10", gradeName: "4th" },
  // Class 5th
  { id: "s501", name: "Ayaan Ashraf", parentId: "p11", gradeName: "5th" },
  { id: "s502", name: "Insha Reyaz", parentId: "p12", gradeName: "5th" },
  // Class 6th
  { id: "s601", name: "Mohsin Farooq", parentId: "p3", gradeName: "6th" },
  { id: "s602", name: "Misbah Altaf", parentId: "p4", gradeName: "6th" },
  // Class 7th
  { id: "s701", name: "Basit Bashir", parentId: "p5", gradeName: "7th" },
  { id: "s702", name: "Tabeen Hassan", parentId: "p6", gradeName: "7th" },
  // Class 8th
  { id: "s801", name: "Faizan Mushtaq", parentId: "p9", gradeName: "8th" },
  { id: "s802", name: "Soliha Shabir", parentId: "p10", gradeName: "8th" },
  // Class 9th
  { id: "s901", name: "Huzaif Ashraf", parentId: "p11", gradeName: "9th" },
  { id: "s902", name: "Mehak Reyaz", parentId: "p12", gradeName: "9th" },
  // Class 10th
  { id: "s1", name: "Ahtisham", parentId: "p1", gradeName: "10th" },
  { id: "s1002", name: "Sahil Farooq", parentId: "p3", gradeName: "10th" },
  { id: "s1003", name: "Uzair Altaf", parentId: "p4", gradeName: "10th" },
  // Class 11th
  { id: "s3", name: "Mehnan", parentId: "p2", gradeName: "11th" },
  { id: "s1102", name: "Shahid Bashir", parentId: "p5", gradeName: "11th" },
  { id: "s1103", name: "Anees Hassan", parentId: "p6", gradeName: "11th" },
  // Class 12th
  { id: "s2", name: "Arooj", parentId: "p1", gradeName: "12th" },
  { id: "s1202", name: "Momin Tariq", parentId: "p7", gradeName: "12th" },
  { id: "s1203", name: "Seerat Manzoor", parentId: "p8", gradeName: "12th" },
];
const feeObligations: FeeObligation[] = [
  // Class 10th
  {
    id: "f1",
    studentId: "s1",
    feeAmount: 33000,
    month: "June",
    feeType: "tuition",
    feeStatus: "paid",
  },
  {
    id: "f2",
    studentId: "s1",
    feeAmount: 33000,
    month: "July",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f1002",
    studentId: "s1002",
    feeAmount: 2500,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f1003",
    studentId: "s1003",
    feeAmount: 3500,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
  // Class 11th
  {
    id: "f4",
    studentId: "s3",
    feeAmount: 4000,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "paid",
  },
  {
    id: "f1102",
    studentId: "s1102",
    feeAmount: 3000,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f1103",
    studentId: "s1103",
    feeAmount: 3000,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  // Class 12th
  {
    id: "f3",
    studentId: "s2",
    feeAmount: 3000,
    month: "June",
    feeType: "tuition",
    feeStatus: "paid",
  },
  {
    id: "f1202",
    studentId: "s1202",
    feeAmount: 4500,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
  {
    id: "f1203",
    studentId: "s1203",
    feeAmount: 3000,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  // Primary & Middle Classes (1st to 9th)
  {
    id: "f101",
    studentId: "s101",
    feeAmount: 1500,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f102",
    studentId: "s102",
    feeAmount: 2200,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
  {
    id: "f201",
    studentId: "s201",
    feeAmount: 1600,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f202",
    studentId: "s202",
    feeAmount: 1600,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f301",
    studentId: "s301",
    feeAmount: 1800,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f302",
    studentId: "s302",
    feeAmount: 2500,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
  {
    id: "f401",
    studentId: "s401",
    feeAmount: 1900,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f402",
    studentId: "s402",
    feeAmount: 1900,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f501",
    studentId: "s501",
    feeAmount: 2000,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f502",
    studentId: "s502",
    feeAmount: 2800,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
  {
    id: "f601",
    studentId: "s601",
    feeAmount: 2200,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f602",
    studentId: "s602",
    feeAmount: 2200,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f701",
    studentId: "s701",
    feeAmount: 2400,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f702",
    studentId: "s702",
    feeAmount: 3200,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
  {
    id: "f801",
    studentId: "s801",
    feeAmount: 2600,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f802",
    studentId: "s802",
    feeAmount: 2600,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f901",
    studentId: "s901",
    feeAmount: 2800,
    month: "June",
    feeType: "tuition",
    feeStatus: "pending",
  },
  {
    id: "f902",
    studentId: "s902",
    feeAmount: 3600,
    month: "June",
    feeType: "tuition+transport",
    feeStatus: "pending",
  },
];
function App() {
  const [role, setRole] = useState<Role>("parent");
  const [selectedParent, setSelectedParent] = useState("p1");
  const [selectedStudent, setSelectedStudent] = useState("s1");
  const [payments, setPayments] = useState<Payment[]>([]);

  const [subTab, setSubTab] = useState("dashboard");
  const [pickGrade, setPickGrade] = useState("1st");

  const [studentList, setStudentList] = useState(students);
  const [parentList, setParentList] = useState(parents);
  const [feeObligationList, setfeeObligationList] = useState(feeObligations);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [inputAssignFees, setInputAssignFees] = useState(1500);
  const [gradeClasses, setGradeClasses] = useState("1st");

  const filteredStudent = studentList.filter(
    (student) => student.gradeName === gradeClasses,
  );
  function promoteStudents(selectedStudentIds: string[]) {
    const currentIndex = gradeArray.indexOf(gradeClasses);
    const nextGrade =
      currentIndex < gradeArray.length - 1
        ? gradeArray[currentIndex + 1]
        : "Graduated";

    const updatedStudents = studentList.map((student) => {
      if (selectedStudentIds.includes(student.id)) {
        return { ...student, gradeName: nextGrade };
      }
      return student;
    });

    setStudentList(updatedStudents);
  }

  function handleFeesForm(
    targetClass: string,
    targetMonth: string,
    assignFees: number,
  ) {
    const filterTargetClassStudents = studentList.filter(
      (student) => student.gradeName === targetClass,
    );
    const mappedStudents: FeeObligation[] = filterTargetClassStudents.map((s) => ({
      id: `f${s.id}-${Date.now()}`,
      studentId: s.id,
      feeAmount: assignFees,
      month: targetMonth,
      feeType: "tuition",
      feeStatus: "pending",
    }));
    setfeeObligationList([...feeObligationList, ...mappedStudents]);
  }

  const months = [
    "Jan",
    "feb",
    "march",
    "april",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  function openHandler(student: Student) {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  }
  function handleSaveStudent(
    studentId: string,
    newStudentName: string,
    newParentName: string,
    newPhone: string,
  ) {
    const updatedStudentArray = studentList.map((editStudent) =>
      editStudent.id === studentId
        ? { ...editStudent, name: newStudentName }
        : editStudent,
    );
    setStudentList(updatedStudentArray);

    const updatedParentArray = parentList.map((editParent) =>
      editParent.id === editingStudent?.parentId
        ? {
            ...editParent,
            name: newParentName,
            phone: newPhone,
          }
        : editParent,
    );
    setParentList(updatedParentArray);
  }

  function handleAddStudent({
    studentName,
    parentName,
    phone,
    grade,
    tuitionFee,
    hasTransport,
  }: NewStudentData) {
    const existingParnet = parentList.find((p) => p.phone === phone);
    const parentID = existingParnet ? existingParnet.id : `p-${Date.now()}`;
    if (!existingParnet) {
      const newParentObject = {
        id: parentID,
        name: parentName,
        phone: phone,
      };
      setParentList([...parentList, newParentObject]);
    }
    const newStudentObject = {
      id: `s1-${Date.now()}`,
      name: studentName,
      gradeName: grade,
      parentId: parentID,
    };
    const newObligationObject: FeeObligation = {
      id: `f1-${Date.now()}`,
      feeAmount: tuitionFee + (hasTransport ? 1000 : 0),
      month: "June",
      feeType: hasTransport ? "tuition+transport" : "tuition",
      feeStatus: "pending",
      studentId: newStudentObject.id,
    };
    setStudentList([...studentList, newStudentObject]);
    setfeeObligationList([...feeObligationList, newObligationObject]);
  }

  const gradeArray = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
  ];

  function handlePaymentSubmit(amount: number) {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const result = formatter
      .format(date)
      .replace(" am", " AM")
      .replace(" pm", " PM");

    const paymentObject = {
      id: `pay-${Date.now()}`,
      belongsTo: selectedStudent,
      amount: amount,
      dateTime: result.toString(),
    };
    setPayments([...payments, paymentObject]);
  }

  const filteredPayments = payments.filter(
    (filteredList) => filteredList.belongsTo === selectedStudent,
  );

  const filteredStudents = studentList.filter(
    (student) => student.parentId === selectedParent,
  );

  const filteredFeeObligations = feeObligationList.filter(
    (feeObligationStudents) =>
      feeObligationStudents.studentId === selectedStudent,
  );

  function handleParentChange(parentId: string) {
    setSelectedParent(parentId);
    const filteredStudent = studentList.filter(
      (student) => parentId === student.parentId,
    );
    setSelectedStudent(filteredStudent[0].id);
  }

  const totalFees = filteredFeeObligations.reduce(
    (acc, curr) => acc + curr.feeAmount,
    0,
  );

  const totalPaid = filteredPayments.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  const currentNetBalance = totalFees - totalPaid;

  return (
    <div className="app-container">
      <Header activeRole={role} onSelectRole={setRole} />

      <main className="main-content">
        {role === "parent" ? (
          <div className="parent-grid">
            <div className="column-left">
              <ParentStudentSelector
                parents={parentList}
                students={filteredStudents}
                selectedParentId={selectedParent}
                selectedStudentId={selectedStudent}
                onSelectParent={handleParentChange}
                onSelectStudent={setSelectedStudent}
              />
              <FeeDetail
                feeObligation={filteredFeeObligations}
                payments={filteredPayments}
              />
              <PayFeesForm
                onSubmitPayment={handlePaymentSubmit}
                netbalance={currentNetBalance}
              />
            </div>

            <div className="column-right">
              <PaymentHistory payments={filteredPayments} />
            </div>
          </div>
        ) : (
          <div className="card">
            <nav className="navigation-bar">
              <button
                className={subTab === "dashboard" ? "active" : ""}
                onClick={() => setSubTab("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={subTab === "classes" ? "active" : ""}
                onClick={() => setSubTab("classes")}
              >
                Classes
              </button>

              <button
                className={subTab === "assignFees" ? "active" : ""}
                onClick={() => setSubTab("assignFees")}
              >
                Assign Fees
              </button>

              <button
                className={subTab === "promoteClass" ? "active" : ""}
                onClick={() => setSubTab("promoteClass")}
              >
                Promote Classes
              </button>
            </nav>

            {subTab === "dashboard" ? (
              <div>
                <div className="card-title">ADMIN DASHBOARD</div>
                <AdminCollectionSummary payments={payments} />
                <AdminPaymentHistory payments={payments} students={students} />
              </div>
            ) : subTab === "classes" ? (
              <div>
                <div>
                  <SelectClassComponent
                    classGrade={gradeArray}
                    selectedGrade={pickGrade}
                    onSelectGrade={setPickGrade}
                  />
                  <AdminClassRoster
                    students={studentList}
                    parents={parentList}
                    feeObligations={feeObligationList}
                    payments={payments}
                    selectedGrade={pickGrade}
                    onEditStudent={openHandler}
                  />
                  <AdminAddStudentForm
                    classGrade={gradeArray}
                    onAddStudent={handleAddStudent}
                  />
                  <AdminEditStudentModal
                    student={editingStudent}
                    parent={parentList.find(
                      (p) => p.id === editingStudent?.parentId,
                    )}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveStudent}
                    key={editingStudent?.id}
                  />
                </div>
              </div>
            ) : subTab === "assignFees" ? (
              <AdminAssignFeesForm
                assignFees={inputAssignFees}
                onInputChange={setInputAssignFees}
                pickMonth={months}
                pickClass={gradeArray}
                onSubmitFeesForm={handleFeesForm}
              />
            ) : (
              <AdminPromoteClass
                gradeClass={gradeArray}
                gradeStudents={filteredStudent}
                onDropdownChange={setGradeClasses}
                selectedGrade={gradeClasses}
                onPromoteSubmit={promoteStudents}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
