export type Role = "parent" | "admin";

export interface HeaderProps {
  activeRole: Role;
  onSelectRole: (role: Role) => void;
}

function Header({ activeRole, onSelectRole }: HeaderProps) {
  return (
    <div>
      <h1>Fee Ease Kashmir</h1>
      <span>
        <button onClick={() => onSelectRole("parent")}>Parent</button>

        <button onClick={() => onSelectRole("admin")}>Admin</button>
      </span>
    </div>
  );
}

export default Header;
