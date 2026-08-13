export type Role = "parent" | "admin";

export interface HeaderProps {
  activeRole: Role;
  onSelectRole: (role: Role) => void;
}

function Header({ activeRole, onSelectRole }: HeaderProps) {
  return (
    <header className="header-bar">
      <div className="header-inner">
        <h1 className="header-title">Fee Ease Kashmir</h1>
        <div className="role-switcher">
          <button
            className={`role-btn ${activeRole === "parent" ? "active" : ""}`}
            onClick={() => onSelectRole("parent")}
          >
            Parent
          </button>
          <button
            className={`role-btn ${activeRole === "admin" ? "active" : ""}`}
            onClick={() => onSelectRole("admin")}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
