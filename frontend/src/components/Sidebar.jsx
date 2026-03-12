import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StudyTimer, { loadTodaySessions } from './StudyTimer';
import WeeklyChart from './WeeklyChart';

const SUBJECT_COLORS = {
  'Biology': '#2d8653', 'Chemistry': '#d95858',
  'Physics': '#3a7bd5', 'Combined Maths': '#c8a300',
};

function formatClock(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const userId = user?.username || user?.id || 'guest';

  const loadSessions = useCallback(() => {
    setTodaySessions(loadTodaySessions(userId));
  }, [userId]);

  useEffect(() => { if (isOpen) loadSessions(); }, [isOpen, refreshTrigger, loadSessions]);

  const handleSessionSaved = useCallback(() => setRefreshTrigger(p => p + 1), []);
  const totalToday = todaySessions.reduce((s, x) => s + x.duration_minutes, 0);

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">
          <div className="sidebar-title-icon">📚</div>
          Study Tools
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="sidebar-body">
        <p className="sidebar-section-label">Pomodoro Timer</p>
        <StudyTimer onSessionSaved={handleSessionSaved} />

        <hr className="sidebar-divider" />

        <div className="sessions-header">
          <p className="sidebar-section-label" style={{marginBottom:0}}>Today's Sessions</p>
          {totalToday > 0 && <span className="sessions-total">{totalToday} min</span>}
        </div>
        <div style={{marginTop:10}}>
          {todaySessions.length === 0 ? (
            <p className="sessions-empty">No sessions yet today.</p>
          ) : (
            <ul className="sessions-list">
              {todaySessions.map((s, i) => (
                <li key={i} className="session-row">
                  <span className="session-dot" style={{ background: SUBJECT_COLORS[s.subject] || '#888' }} />
                  <div className="session-info">
                    <span className="session-subject" style={{ color: SUBJECT_COLORS[s.subject] }}>{s.subject}</span>
                    <span className="session-time">{formatClock(s.start_time)} → {formatClock(s.end_time)}</span>
                  </div>
                  <span className="session-dur">{s.duration_minutes}m</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <hr className="sidebar-divider" />
        <p className="sidebar-section-label">Weekly Progress</p>
        <WeeklyChart refreshTrigger={refreshTrigger} userId={userId} />
      </div>
    </div>
  );
}
