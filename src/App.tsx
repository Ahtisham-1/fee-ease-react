import { useState } from "react";
import Header from "./Components/Header";

export default function App() {
  let [activeView, setActiveView] = useState("parent");
  return (
    <>
      <div>
        <Header setActiveView = {setActiveView} />
        {activeView === "parent" ? "ParentDashboard" : "AdminDashboard"}
      </div>
    </>
  );
}
