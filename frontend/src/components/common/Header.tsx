import type { Role } from "../../types";
import { SchoolIcon, UsersIcon, ShieldIcon } from "./Icons";

export interface HeaderProps {
  role: Role;
}

/**
 * Modern Emerald & Gold Navigation Header
 * Updated to lock the UI to the actual role logged in, rather than allowing a fake manual toggle!
 */
export function Header({ role }: HeaderProps) {
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

        {/* Right Corner: Shows the locked role instead of buttons */}
        <nav className="role-switcher" aria-label="Portal Navigation" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          {role === "parent" ? (
            <>
              <UsersIcon className="nav-btn-icon" style={{ color: 'var(--emerald-primary)' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Parent Portal</span>
            </>
          ) : (
            <>
              <ShieldIcon className="nav-btn-icon" style={{ color: 'var(--emerald-primary)' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Admin Office</span>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
