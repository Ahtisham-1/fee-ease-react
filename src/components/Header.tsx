export type Role = "parent" | "admin";

export interface HeaderProps {
  activeRole: Role;
  onSelectRole: (role: Role) => void;
}
function Header({ activeRole, onSelectRole }: HeaderProps) {
  return (
    <>
      <h1>Fee Ease Kashmir</h1>
      <button onClick={() => onSelectRole("parent")}>PARENT</button>
      <button onClick={() => onSelectRole("admin")}>ADMIN</button>
    </>
  );
}

export default Header;
