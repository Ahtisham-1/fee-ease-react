import { useState } from "react";

export interface NewStudentData {
  studentName: string;
  parentName: string;
  phone: string;
  grade: string;
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
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [tuitionFee, setTuitionFee] = useState(1500);
  const [hasTransport, setHasTransport] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      studentName === "" ||
      parentName === "" ||
      phone === "" ||
      grade === ""
    ) {
      return alert("Input fields are empty");
    }
    onAddStudent({
      studentName,
      parentName,
      phone,
      grade: grade || classGrade[0],
      tuitionFee,
      hasTransport,
    });
    setStudentName("");
    setParentName("");
    setPhone("");
    setGrade("");
    setTuitionFee(1500);
    setHasTransport(false);
  }
  return (
    <form onSubmit={handleSubmit} className="card">
      <input
        type="text"
        placeholder="Add student name"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Add parent name"
        value={parentName}
        onChange={(e) => setParentName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Add phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="text"
        placeholder="Add grade"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
      />
      <input
        type="number"
        placeholder="Add tuition fee"
        value={tuitionFee}
        onChange={(e) => setTuitionFee(Number(e.target.value))}
      />
      <input
        type="checkbox"
        checked={hasTransport}
        onChange={(e) => setHasTransport(e.target.checked)}
      />
      <br />
      <button type="submit">Add Student Details</button>
    </form>
  );
}
export default AdminAddStudentForm;
