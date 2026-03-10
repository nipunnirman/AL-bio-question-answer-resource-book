import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="header">
      <div className="header-icon">🧬</div>
      <div className="header-text">
        <div className="header-title">BioBot AI</div>
        <div className="header-subtitle">A/L Biology Intelligence</div>
      </div>
      <div className="header-actions">
        <div className="header-status">
          <div className="status-dot" />
          Online
        </div>
        <button className="header-btn" title="New chat" aria-label="New chat">✦</button>
        <button className="header-btn" title="Share" aria-label="Share">⇧</button>
        <button className="header-btn" title="Upload PDF" aria-label="Upload PDF">📄</button>
        <button className="header-btn" title="Logout" aria-label="Logout" onClick={logout}>⏻</button>
      </div>
    </header>
  );
}
