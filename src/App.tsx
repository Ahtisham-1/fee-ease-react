import { useState } from "react";
import Header from "./Components/Header";
import { initialStudents, initialParents } from "./data";
import ParentDashboard from "./Components/ParentDashboard";
import AdminDashboard from "./Components/AdminDashboard";

export default function App() {
  let [activeView, setActiveView] = useState("parent");
  return (
    <>
      <div>
        <Header setActiveView={setActiveView} />
        {activeView === "parent" ? (
          <ParentDashboard
            students={initialStudents}
            parents={initialParents}
          />
        ) : (
          <AdminDashboard  />
        )}
      </div>
    </>
  );
}
