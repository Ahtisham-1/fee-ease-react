import type { Role } from "../../types";
import { SchoolIcon, UsersIcon, ShieldIcon } from "./Icons";

export interface HeaderProps {
  role: Role;
  onRoleChange: (newRole: Role) => void;
}

/**
 * Modern Emerald & Gold Navigation Header
 */
export function Header({ role, onRoleChange }: HeaderProps) {
  return (
    <header className="header-bar" role="banner">
      <div className="header-inner">
        {/* Left Corner: Brand Logo */}
        <div className="header-title">
          <div className="brand-icon-wrapper">
            <SchoolIcon className="brand-svg-icon" />
          </div>
          <span className="brand-name">
            Fee<span className="accent-brand">Ease</span>
          </span>
          <span className="status-badge paid brand-badge">
            Kashmir Academic
          </span>
        </div>

        {/* Right Corner: Segmented Role Switcher */}
        <nav className="role-switcher" aria-label="Portal Navigation">
          <button
            type="button"
            className={`role-btn ${role === "parent" ? "active" : ""}`}
            onClick={() => onRoleChange("parent")}
            aria-pressed={role === "parent"}
          >
            <UsersIcon className="nav-btn-icon" />
            <span>Parent Portal</span>
          </button>

          <button
            type="button"
            className={`role-btn ${role === "admin" ? "active" : ""}`}
            onClick={() => onRoleChange("admin")}
            aria-pressed={role === "admin"}
          >
            <ShieldIcon className="nav-btn-icon" />
            <span>Admin Office</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
