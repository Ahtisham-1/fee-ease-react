import type { Role } from "../../types";

export interface HeaderProps {
  role: Role;
  onRoleChange: (newRole: Role) => void;
}

export function Header({ role, onRoleChange }: HeaderProps) {
  return (
    <header className="header-bar" role="banner">
      <div className="header-inner">
        <div className="header-title">
          <span>
            Fee<span style={{ color: "var(--accent-color)" }}>Ease</span>
          </span>
          <span
            className="status-badge paid"
            style={{
              fontSize: "0.68rem",
              padding: "0.2rem 0.6rem",
              marginLeft: "0.5rem",
            }}
          >
            Kashmir Academic
          </span>
        </div>

        <nav className="role-switcher" aria-label="Portal Navigation">
          <button
            type="button"
            className={`role-btn ${role === "parent" ? "active" : ""}`}
            onClick={() => onRoleChange("parent")}
            aria-pressed={role === "parent"}
          >
            👨‍👩‍👧 Parent Portal
          </button>

          <button
            type="button"
            className={`role-btn ${role === "admin" ? "active" : ""}`}
            onClick={() => onRoleChange("admin")}
            aria-pressed={role === "admin"}
          >
            🛡️ Admin Office
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
