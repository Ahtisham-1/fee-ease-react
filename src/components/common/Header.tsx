import type { Role } from "../../types";

export interface HeaderProps {
  role: Role;
  onRoleChange: (newRole: Role) => void;
}

export function Header({ role, onRoleChange }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="logo-container">
        <h1 className="logo-text">
          Fee<span>Ease</span>
        </h1>
        <span className="badge">Kashmir Academic Portal</span>
      </div>

      <div className="role-switcher">
        <button
          type="button"
          className={`role-btn ${role === "parent" ? "active" : ""}`}
          onClick={() => onRoleChange("parent")}
        >
          👨‍👩‍👧 Parent Portal
        </button>
        <button
          type="button"
          className={`role-btn ${role === "admin" ? "active" : ""}`}
          onClick={() => onRoleChange("admin")}
        >
          🛡️ Admin Office
        </button>
      </div>
    </header>
  );
}

export default Header;
