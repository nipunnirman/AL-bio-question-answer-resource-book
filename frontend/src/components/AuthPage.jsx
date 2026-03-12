import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Particles from './Particles';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = isLogin ? await login(username, password) : await register(username, email, password);
      if (!result.success) setError(result.error);
    } catch { setError('An unexpected error occurred.'); }
    finally { setLoading(false); }
  };

  const switchMode = (mode) => { setIsLogin(mode); setError(''); };

  return (
    <>
      <div className="bg-scene">
        <div className="bg-blob bg-blob-1" /><div className="bg-blob bg-blob-2" /><div className="bg-blob bg-blob-3" />
      </div>
      <div className="auth-page">
        <Particles />
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.png" alt="BioBot" onError={e => { e.target.style.display='none'; e.target.parentNode.textContent='🌿'; }} />
          </div>
          <h1 className="auth-title">AL Bio-QA</h1>
          <p className="auth-subtitle">Your intelligent A/L biology study companion</p>

          <div className="auth-tabs">
            <button className={`auth-tab${isLogin ? ' active' : ''}`} onClick={() => switchMode(true)}>Sign In</button>
            <button className={`auth-tab${!isLogin ? ' active' : ''}`} onClick={() => switchMode(false)}>Register</button>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="un">Username</label>
              <input id="un" className="form-input" type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Your username" />
            </div>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label" htmlFor="em">Email</label>
                <input id="em" className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Your email" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="pw">Password</label>
              <input id="pw" className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password" />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button className="auth-link" type="button" onClick={() => switchMode(!isLogin)}>
              {isLogin ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
