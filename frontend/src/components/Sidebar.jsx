import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StudyTimer, { loadTodaySessions } from './StudyTimer';
import WeeklyChart from './WeeklyChart';

const SUBJECT_COLORS = {
  'Biology':        '#2d8653',
  'Chemistry':      '#d95858',
  'Physics':        '#3a7bd5',
  'Combined Maths': '#c8a300',
};

function formatClock(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function Sidebar({ isOpen, onClose }) {
  const { token, user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [todaySessions, setTodaySessions]   = useState([]);

  const userId = user?.username || user?.id || 'guest';

  // Load sessions from localStorage (always works, instant)
  const loadSessions = useCallback(() => {
    const local = loadTodaySessions(userId);
    setTodaySessions(local);
  }, [userId]);

  useEffect(() => {
    if (isOpen) loadSessions();
  }, [isOpen, refreshTrigger, loadSessions]);

  const handleSessionSaved = useCallback(() => {
    setRefreshTrigger(p => p + 1);   // triggers loadSessions above
  }, []);

  if (!isOpen) return null;

  const totalToday = todaySessions.reduce((s, x) => s + x.duration_minutes, 0);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>📚 Study Help</h2>
        <button className="sidebar-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-content">
        {/* Timer */}
        <StudyTimer onSessionSaved={handleSessionSaved} />

        {/* Today's sessions */}
        <hr className="sidebar-divider" />
        <div className="sessions-header">
          <h3 className="section-title">Today's Sessions</h3>
          {totalToday > 0 && (
            <span className="sessions-total">{totalToday} min total</span>
          )}
        </div>

        {todaySessions.length === 0 ? (
          <p className="sessions-empty">No sessions saved yet today.</p>
        ) : (
          <ul className="sessions-list">
            {todaySessions.map((s, i) => (
              <li key={i} className="session-row">
                <span className="session-dot" style={{ background: SUBJECT_COLORS[s.subject] || '#888' }} />
                <div className="session-info">
                  <span className="session-subject" style={{ color: SUBJECT_COLORS[s.subject] }}>
                    {s.subject}
                  </span>
                  <span className="session-time">
                    {formatClock(s.start_time)} → {formatClock(s.end_time)}
                  </span>
                </div>
                <span className="session-dur">{s.duration_minutes} min</span>
              </li>
            ))}
          </ul>
        )}

        {/* Weekly chart */}
        <hr className="sidebar-divider" />
        <h3 className="section-title">My Progress</h3>
        <WeeklyChart refreshTrigger={refreshTrigger} localSessions={todaySessions} userId={userId} />
      </div>
    </div>
  );
}
