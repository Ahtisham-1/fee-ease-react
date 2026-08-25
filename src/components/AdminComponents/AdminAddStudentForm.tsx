import { useState } from "react";

export interface NewStudentData {
  studentName: string;
  parentName: string;
  grade: string;
  phone: string;
  tuitionFee: number;
  hasTransport: boolean;
}

interface AdminAddStudentFormProps {
  classGrade: string[];
  onAddStudent: (data: NewStudentData) => void;
}
function AdminAddStudentForm({
  classGrade,
  onAddStudent,
}: AdminAddStudentFormProps) {
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [grade, setGrade] = useState("");
  const [phone, setPhone] = useState("");
  const [tuitionFee, setTuitionFee] = useState(1500);
  const [hasTransport, setHasTransport] = useState(false);
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      studentName === "" ||
      parentName === "" ||
      grade === "" ||
      phone === ""
    ) {
      return alert("Input fields are empty please fill each input filed");
    } else {
      onAddStudent({
        studentName,
        parentName,
        grade,
        phone,
        tuitionFee,
        hasTransport,
      });
    }

    setStudentName("");
    setParentName("");
    setPhone("");
    setGrade("");
    setTuitionFee(1500);
    setHasTransport(false);
  }
  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-title">ENROLL NEW STUDENT & PARENT</div>
      <div className="form-grid">
        <input
          type="text"
          placeholder="Student name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Parent / Father name"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Parent phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="text"
          placeholder="Class / Grade (e.g. 1st, 10th)"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <input
          type="number"
          placeholder="Monthly Tuition Fee (₹)"
          value={tuitionFee}
          onChange={(e) => setTuitionFee(Number(e.target.value))}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={hasTransport}
            onChange={(e) => setHasTransport(e.target.checked)}
          />
          Include Transport Service (+₹1,000)
        </label>
      </div>
      <button type="submit">Add Student Details</button>
    </form>
  );
}
export default AdminAddStudentForm;
