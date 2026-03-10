import { useAuth } from '../context/AuthContext';

export default function Header() {
    const { logout } = useAuth();

    return (
        <header className="header">
            <div className="header-icon">📚</div>
            <div className="header-text">
                <div className="header-title">Bio AI Assistant</div>
                <div className="header-subtitle">✨ Your smart biology companion</div>
            </div>
            <div className="header-actions">
                <button className="header-btn" title="New chat" aria-label="New chat">✦</button>
                <button className="header-btn" title="Share" aria-label="Share">🔗</button>
                <button className="header-btn" title="PDF upload" aria-label="Upload PDF">📄</button>
                <button className="header-btn" title="Logout" aria-label="Logout" onClick={logout}>🚪</button>
            </div>
        </header>
    );
}
