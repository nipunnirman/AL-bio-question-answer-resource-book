import React, { useState } from 'react';
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
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = isLogin ? await login(username, password) : await register(username, email, password);
      if (!result.success) setError(result.error);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-scene">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-grid" />
      </div>
      <div className="auth-page">
        <Particles />
        <div className="auth-container">
          <div className="auth-logo">🧬</div>
          <h1 className="auth-title">A/L BioBot</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Welcome back — sign in to continue your biology journey.' : 'Create an account to start exploring biology with AI.'}
          </p>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter your username" />
            </div>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" className="auth-link-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
