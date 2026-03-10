import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { logout } = useAuth();
  return (
    <header className="header">
      <div className="header-icon">🌿</div>
      <div className="header-text">
        <div className="header-title">BioBot</div>
        <div className="header-subtitle">A/L Biology Assistant</div>
      </div>
      <div className="header-actions">
        <div className="header-status">
          <div className="status-dot" /> Active
        </div>
        <button className="header-btn" title="New chat">⊕</button>
        <button className="header-btn" title="Upload PDF">⊞</button>
        <button className="header-btn" title="Sign out" onClick={logout}>⎋</button>
      </div>
    </header>
  );
}
