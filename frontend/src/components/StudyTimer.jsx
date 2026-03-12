import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const STUDY_OPTIONS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const BREAK_OPTIONS = [5, 10];

export const SUBJECTS = [
  { id: 'Biology',        label: 'Bio',          color: '#2d8653', bg: '#e8f5ec' },
  { id: 'Chemistry',      label: 'Chemistry',    color: '#d95858', bg: '#fdf0f0' },
  { id: 'Physics',        label: 'Physics',      color: '#3a7bd5', bg: '#eef3fd' },
  { id: 'Combined Maths', label: 'Comb. Maths', color: '#c8a300', bg: '#fdf8e1' },
];

// ─── localStorage helpers ────────────────────────────────
const todayKey = (userId) => `study_sessions_${userId}_${new Date().toISOString().split('T')[0]}`;

export function loadTodaySessions(userId) {
  try {
    return JSON.parse(localStorage.getItem(todayKey(userId)) || '[]');
  } catch { return []; }
}

function saveTodaySession(userId, session) {
  const existing = loadTodaySessions(userId);
  existing.push(session);
  localStorage.setItem(todayKey(userId), JSON.stringify(existing));
}

// ─── Format helpers ─────────────────────────────────────
function formatTime(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function isMobile() {
  return window.innerWidth <= 640;
}

// ─── Audio helpers ───────────────────────────────────────
// Short chime for mid-break warnings
const WARNING_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
// End-of-session sound
const DONE_SOUND_URL    = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

function playSound(url) {
  const audio = new Audio(url);
  audio.play().catch(() => {});
}

export default function StudyTimer({ onSessionSaved }) {
  const { token, user } = useAuth();

  const [subject, setSubject]         = useState(SUBJECTS[0]);
  const [studyMins, setStudyMins]     = useState(25);
  const [breakMins, setBreakMins]     = useState(5);
  const [mode, setMode]               = useState('idle');   // 'idle' | 'study' | 'break'
  const [timeLeft, setTimeLeft]       = useState(0);
  const [isActive, setIsActive]       = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [saved, setSaved]             = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // track which warning sounds have fired for the current break
  const warnedRef    = useRef({ two: false, one: false });
  const startTimeRef = useRef(null);

  // ─── Fullscreen helpers ───────────────────────────────
  const enterFullscreen = useCallback(() => {
    if (isMobile()) setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // keep fullscreen in sync with window resize
  useEffect(() => {
    const onResize = () => {
      if (!isMobile()) setIsFullscreen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Countdown ────────────────────────────────────────
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [isActive, timeLeft]);

  // ─── Break warning sounds ─────────────────────────────
  useEffect(() => {
    if (mode !== 'break' || !isActive) return;
    if (timeLeft === 2 * 60 && !warnedRef.current.two) {
      warnedRef.current.two = true;
      playSound(WARNING_SOUND_URL); // 2-minute warning
    }
    if (timeLeft === 1 * 60 && !warnedRef.current.one) {
      warnedRef.current.one = true;
      playSound(WARNING_SOUND_URL); // 1-minute warning
    }
  }, [timeLeft, mode, isActive]);

  // ─── Timer finished ───────────────────────────────────
  useEffect(() => {
    if (isActive && timeLeft === 0) onTimerDone();
  }, [timeLeft, isActive]);

  const onTimerDone = () => {
    setIsActive(false);
    playSound(DONE_SOUND_URL);
    if (mode === 'study') {
      doSave(studyMins);
    }
    setMode('idle');
    setTimeLeft(0);
    startTimeRef.current = null;
    warnedRef.current = { two: false, one: false };
    exitFullscreen();
  };

  // ─── Actions ──────────────────────────────────────────
  const startStudy = () => {
    startTimeRef.current = new Date().toISOString();
    setSaved(false);
    setMode('study');
    setTimeLeft(studyMins * 60);
    setIsActive(true);
    enterFullscreen();
  };

  // "Break" replaces "Pause": saves partial study time and starts break countdown
  const startBreak = () => {
    // Save what's been studied so far
    const done = studyMins - Math.ceil(timeLeft / 60);
    if (done > 0) doSave(done);
    startTimeRef.current = null;

    // Reset warning flags for new break
    warnedRef.current = { two: false, one: false };

    setMode('break');
    setTimeLeft(breakMins * 60);
    setIsActive(true);
    enterFullscreen();
  };

  const stopTimer = () => {
    setIsActive(false);
    if (mode === 'study') {
      const done = studyMins - Math.ceil(timeLeft / 60);
      if (done > 0) doSave(done);
    }
    setMode('idle');
    setTimeLeft(0);
    startTimeRef.current = null;
    warnedRef.current = { two: false, one: false };
    exitFullscreen();
  };

  const manualSave = () => {
    if (mode !== 'study') return;
    const done = studyMins - Math.ceil(timeLeft / 60);
    if (done < 1) { alert('No full minute yet!'); return; }
    doSave(done);
    setIsActive(false);
    setMode('idle');
    setTimeLeft(0);
    startTimeRef.current = null;
    exitFullscreen();
  };

  const doSave = (minutes) => {
    const now  = new Date().toISOString();
    const date = now.split('T')[0];
    const sessionData = {
      subject:          subject.id,
      start_time:       startTimeRef.current || now,
      end_time:         now,
      duration_minutes: minutes,
      date,
    };

    const userId = user?.username || user?.id || 'guest';
    saveTodaySession(userId, sessionData);
    setSaved(true);
    if (onSessionSaved) onSessionSaved();

    if (token) {
      fetch('/api/study/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      }).catch(err => console.warn('Backend sync failed (offline?):', err));
    }
  };

  const subjectColor = subject.color;
  const isBreak      = mode === 'break';

  // Progress ring for fullscreen
  const totalSecs = isBreak ? breakMins * 60 : studyMins * 60;
  const progress  = totalSecs > 0 ? (totalSecs - timeLeft) / totalSecs : 0;
  const radius    = 90;
  const circ      = 2 * Math.PI * radius;
  const dash      = circ * (1 - progress);

  return (
    <div className={`study-timer${isFullscreen ? ' fullscreen' : ''}`}>

      {/* Fullscreen top bar */}
      {isFullscreen && (
        <div className="fs-topbar">
          <span className="fs-subject-chip" style={{ background: subject.bg, color: subjectColor, borderColor: subjectColor }}>
            <span className="subject-dot" style={{ background: subjectColor }} />
            {isBreak ? '☕ Break Time' : `📖 ${subject.id}`}
          </span>
          <button className="fs-close-btn" onClick={stopTimer} title="Stop & exit">✕</button>
        </div>
      )}

      {/* ─── Fullscreen layout ─── */}
      {isFullscreen ? (
        <>
          {/* Progress ring + time */}
          <div className="fs-ring-wrap">
            <svg className="fs-ring" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} className="fs-ring-bg" />
              <circle
                cx="100" cy="100" r={radius}
                className="fs-ring-fg"
                style={{ stroke: isBreak ? '#c8a300' : subjectColor, strokeDasharray: circ, strokeDashoffset: dash }}
              />
            </svg>
            <div className="fs-time-overlay">
              <div className="fs-time" style={{ color: isBreak ? '#c8a300' : subjectColor }}>
                {formatTime(timeLeft)}
              </div>
              <div className="fs-label" style={{ color: isBreak ? '#c8a300' : subjectColor }}>
                {isBreak ? 'Break' : 'Focus'}
              </div>
            </div>
          </div>

          {/* Warning hint during break */}
          {isBreak && (
            <p className="fs-break-hint">🔔 You'll be notified 2 min &amp; 1 min before break ends</p>
          )}

          {/* Fullscreen controls */}
          <div className="timer-controls fs-controls">
            {mode === 'study' && isActive && (
              <button className="btn-break" onClick={startBreak}>☕ Break</button>
            )}
            {mode === 'study' && !isActive && (
              <button className="btn-primary" style={{ background: subjectColor }} onClick={() => setIsActive(true)}>
                Resume
              </button>
            )}
            {mode === 'study' && (
              <button
                className="btn-save-manual"
                style={{ borderColor: subjectColor, color: subjectColor }}
                onClick={manualSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : '💾 Save & Close'}
              </button>
            )}
            {isBreak && (
              <button className="btn-outline" onClick={stopTimer}>Stop Break</button>
            )}
          </div>
        </>
      ) : (
        /* ─── Sidebar (non-fullscreen) layout ─── */
        <>
          {/* Subject Selector */}
          <div className="subject-selector">
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                className={`subject-pill ${subject.id === s.id ? 'active' : ''}`}
                style={subject.id === s.id ? { background: s.bg, borderColor: s.color, color: s.color } : {}}
                onClick={() => { if (mode === 'idle') setSubject(s); }}
                title={s.id}
                disabled={mode !== 'idle'}
              >
                <span className="subject-dot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="timer-display" style={{ color: mode === 'idle' ? '#9cb4a4' : isBreak ? '#c8a300' : subjectColor }}>
            {mode === 'idle' ? formatTime(studyMins * 60) : formatTime(timeLeft)}
          </div>

          <div className="timer-mode-label" style={{ color: isBreak ? '#c8a300' : subjectColor }}>
            {mode === 'study' ? `📖 ${subject.id}` : isBreak ? '☕ Break' : ''}
          </div>

          {/* Settings */}
          {mode === 'idle' && (
            <div className="timer-settings">
              <label>
                Study<br />
                <select value={studyMins} onChange={e => setStudyMins(+e.target.value)}>
                  {STUDY_OPTIONS.map(o => <option key={o} value={o}>{o} min</option>)}
                </select>
              </label>
              <label>
                Break<br />
                <select value={breakMins} onChange={e => setBreakMins(+e.target.value)}>
                  {BREAK_OPTIONS.map(o => <option key={o} value={o}>{o} min</option>)}
                </select>
              </label>
            </div>
          )}

          {/* Controls */}
          <div className="timer-controls">
            {mode === 'idle' && (
              <button className="btn-primary" style={{ background: subjectColor }} onClick={startStudy}>
                Start
              </button>
            )}
            {mode === 'study' && !isActive && (
              <button className="btn-primary" style={{ background: subjectColor }} onClick={() => setIsActive(true)}>
                Resume
              </button>
            )}
            {mode === 'study' && isActive && (
              <button className="btn-break" onClick={startBreak}>☕ Break</button>
            )}
            {(mode === 'study' || isBreak) && (
              <button className="btn-outline" onClick={stopTimer}>Stop</button>
            )}
          </div>

          {/* Manual Save and Close */}
          {mode === 'study' && (
            <button
              className="btn-save-manual"
              style={{ borderColor: subjectColor, color: subjectColor }}
              onClick={manualSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : '💾 Save & Close Session'}
            </button>
          )}

          {/* Break warning hint in sidebar */}
          {isBreak && (
            <p className="break-warning-hint">🔔 Sound at 2 min &amp; 1 min remaining</p>
          )}

          {/* Save success flash */}
          {saved && mode === 'idle' && (
            <p className="save-success">✅ Session saved!</p>
          )}
        </>
      )}
    </div>
  );
}
