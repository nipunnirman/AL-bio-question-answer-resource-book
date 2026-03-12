import { useAuth } from '../context/AuthContext';

export default function Header({ sidebarOpen, toggleSidebar }) {
  const { logout } = useAuth();
  return (
    <header className="header">
      <div className="header-logo">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="BioBot" onError={e => { e.target.style.display='none'; e.target.parentNode.textContent='🌿'; }} />
      </div>
      <div className="header-text">
        <div className="header-title">AL Bio-QA</div>
        <div className="header-subtitle">Biology Question-Answering RAG System</div>
      </div>
      <div className="header-right">
        <div className="header-badge"><div className="badge-dot" /> Active</div>
        <button className={`hbtn${sidebarOpen ? ' active' : ''}`} title="Study Tools" onClick={toggleSidebar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
            <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
          </svg>
        </button>
        <button className="hbtn" title="New chat" onClick={() => window.location.reload()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button className="hbtn" title="Sign out" onClick={logout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </header>
  );
}
