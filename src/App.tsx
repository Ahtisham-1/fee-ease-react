import { useState } from "react";
import Header from "./components/Header";
import type { Role } from "./components/Header";
// import type { HeaderProps } from "./components/Header";

function App() {
  const [role, setRole] = useState<Role>("parent");
  return (
    <>
      <Header activeRole={role} onSelectRole={setRole} />
    </>
  );
}

export default App;
