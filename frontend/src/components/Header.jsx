import { useAuth } from '../context/AuthContext';

export default function Header() {
    const { logout } = useAuth();
    return (
        <header className="header">
            <div className="header-icon">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="BioBot Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }} />
            </div>
            <div className="header-text">
                <div className="header-title">AL Bio-QA</div>
                <div className="header-subtitle">Biology Question-Answering RAG System</div>
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
