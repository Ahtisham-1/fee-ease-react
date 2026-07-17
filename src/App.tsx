import Header from "./Components/Header";
import AdminDashboard from "./Components/AdminDashboard";
import ParentDashboard from "./Components/ParentDashboard";
import { initialStudents, initialParents } from "./data";

function App() {
  return (
    <main>
      <Header />
      <ParentDashboard students={initialStudents} parents={initialParents} />
      <AdminDashboard />
    </main>
  );
}

export default App;
