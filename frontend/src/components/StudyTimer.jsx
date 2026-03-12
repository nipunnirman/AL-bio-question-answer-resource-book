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

// ─── Audio ──────────────────────────────────────────────
const WARN_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
const DONE_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
function playSound(url) { new Audio(url).play().catch(() => {}); }

// ─── Main component ──────────────────────────────────────
export default function StudyTimer({ onSessionSaved }) {
  const { token, user } = useAuth();

  const [subject, setSubject]         = useState(SUBJECTS[0]);
  const [studyMins, setStudyMins]     = useState(25);
  const [breakMins, setBreakMins]     = useState(5);
  // mode: 'idle' | 'study' | 'break' | 'break-done'
  const [mode, setMode]               = useState('idle');
  const [timeLeft, setTimeLeft]       = useState(0);
  const [isActive, setIsActive]       = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [saved, setSaved]             = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startTimeRef  = useRef(null);
  const remainingStudySecsRef = useRef(0);
  const warnedRef     = useRef({ five: false, two: false, one: false });

  // ─── Fullscreen helpers ─────────────────────────────
  const enterFS = useCallback(() => { if (isMobile()) setIsFullscreen(true); }, []);
  const exitFS  = useCallback(() => setIsFullscreen(false), []);

  useEffect(() => {
    const onResize = () => { if (!isMobile()) setIsFullscreen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Countdown ──────────────────────────────────────
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [isActive, timeLeft]);

  // ─── Break warning sounds ────────────────────────────
  useEffect(() => {
    if (mode !== 'break' || !isActive) return;
    if (timeLeft === 5 * 60 && !warnedRef.current.five) {
      warnedRef.current.five = true;
      playSound(WARN_URL);
    }
    if (timeLeft === 2 * 60 && !warnedRef.current.two) {
      warnedRef.current.two = true;
      playSound(WARN_URL);
    }
    if (timeLeft === 1 * 60 && !warnedRef.current.one) {
      warnedRef.current.one = true;
      playSound(WARN_URL);
    }
  }, [timeLeft, mode, isActive]);

  // ─── Timer finished ──────────────────────────────────
  useEffect(() => {
    if (isActive && timeLeft === 0) onTimerDone();
  }, [timeLeft, isActive]);

  const onTimerDone = () => {
    setIsActive(false);
    playSound(DONE_URL);
    if (mode === 'study') {
      doSave(studyMins);
      setMode('idle');
      exitFS();
    } else if (mode === 'break') {
      // break finished → show 'break-done' so user sees Continue button
      setMode('break-done');
    }
    setTimeLeft(0);
    startTimeRef.current = null;
    warnedRef.current = { five: false, two: false, one: false };
  };

  // ─── Actions ────────────────────────────────────────
  const startStudy = () => {
    startTimeRef.current = new Date().toISOString();
    remainingStudySecsRef.current = 0;
    setSaved(false);
    setMode('study');
    setTimeLeft(studyMins * 60);
    setIsActive(true);
    enterFS();
  };

  // Break: save remaining study time → start break countdown
  const startBreak = () => {
    remainingStudySecsRef.current = timeLeft;
    warnedRef.current = { five: false, two: false, one: false };
    setMode('break');
    setTimeLeft(breakMins * 60);
    setIsActive(true);
    enterFS();
  };

  // Continue: resume remaining study time after break ends
  const continueStudy = () => {
    setSaved(false);
    setMode('study');
    setTimeLeft(remainingStudySecsRef.current);
    setIsActive(true);
    enterFS();
  };

  const stopTimer = () => {
    setIsActive(false);
    if (mode === 'study') {
      // Stopping study → save & go idle
      const done = studyMins - Math.ceil(timeLeft / 60);
      if (done > 0) doSave(done);
      setMode('idle');
      setTimeLeft(0);
      startTimeRef.current = null;
      warnedRef.current = { five: false, two: false, one: false };
      exitFS();
    } else if (mode === 'break') {
      // Stopping break early → resume study countdown immediately
      warnedRef.current = { five: false, two: false, one: false };
      setSaved(false);
      setMode('study');
      setTimeLeft(remainingStudySecsRef.current);
      setIsActive(true);
      enterFS();
    } else {
      // break-done or any other → go idle, save partial if needed
      const done = studyMins - Math.ceil(remainingStudySecsRef.current / 60);
      if (done > 0) doSave(done);
      setMode('idle');
      setTimeLeft(0);
      startTimeRef.current = null;
      exitFS();
    }
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
    exitFS();
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sessionData),
      }).catch(err => console.warn('Backend sync failed:', err));
    }
  };

  // ─── Derived values ──────────────────────────────────
  const subjectColor = subject.color;
  const isBreak      = mode === 'break';
  const isBreakDone  = mode === 'break-done';
  const timerColor   = isBreak || isBreakDone ? '#e67e22' : subjectColor;

  // SVG progress ring
  const totalSecs = isBreak ? breakMins * 60 : studyMins * 60;
  // Calculate progress relative to the full setting
  // For study, compare against full studyMins. For break, compare against full breakMins.
  let progress = 0;
  if (totalSecs > 0) {
    if (isBreak) {
      progress = (breakMins * 60 - timeLeft) / (breakMins * 60);
    } else {
      progress = (studyMins * 60 - timeLeft) / (studyMins * 60);
    }
  }
  const radius = 90;
  const circ   = 2 * Math.PI * radius;
  const dash   = circ * (1 - progress);

  // ─── Render ──────────────────────────────────────────
  return (
    <div className={`study-timer${isFullscreen ? ' fullscreen' : ''}`}>

      {/* ── FULLSCREEN LAYOUT ── */}
      {isFullscreen && (
        <div className="fs-topbar">
          <span className="fs-subject-chip"
            style={{ background: isBreak || isBreakDone ? '#fff3e0' : subject.bg,
                     color: timerColor, borderColor: timerColor }}>
            <span className="subject-dot" style={{ background: timerColor }} />
            {isBreak ? '☕ Break' : isBreakDone ? '✅ Break Done' : `📖 ${subject.id}`}
          </span>
          <button className="fs-close-btn" onClick={stopTimer} title="Stop & exit">✕</button>
        </div>
      )}

      {isFullscreen ? (
        <>
          {/* Progress ring */}
          <div className="fs-ring-wrap">
            <svg className="fs-ring" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} className="fs-ring-bg" />
              <circle cx="100" cy="100" r={radius} className="fs-ring-fg"
                style={{ stroke: timerColor, strokeDasharray: circ, strokeDashoffset: dash }} />
            </svg>
            <div className="fs-time-overlay">
              {isBreakDone ? (
                <div className="fs-break-done-icon">☕</div>
              ) : (
                <>
                  <div className="fs-time" style={{ color: timerColor }}>{formatTime(timeLeft)}</div>
                  <div className="fs-label" style={{ color: timerColor }}>
                    {isBreak ? 'Break' : 'Focus'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Break finished — show Continue */}
          {isBreakDone && (
            <div className="fs-break-done-msg">
              <p>☀️ Break over! Ready to focus again?</p>
              <button className="btn-continue" style={{ background: subjectColor }} onClick={continueStudy}>
                ▶ Continue Study
              </button>
              <button className="btn-outline-sm" onClick={stopTimer}>End Session</button>
            </div>
          )}

          {/* Sound hints during break */}
          {isBreak && (
            <p className="fs-break-hint">🔔 Sound alert at 5 min, 2 min &amp; 1 min remaining</p>
          )}

          {/* Fullscreen controls */}
          {!isBreakDone && (
            <div className="timer-controls fs-controls">
              {/* ── Study mode ── */}
              {mode === 'study' && isActive && (
                <button className="btn-break" onClick={startBreak}>☕ Take Break</button>
              )}
              {mode === 'study' && !isActive && (
                <button className="btn-primary" style={{ background: subjectColor }} onClick={() => setIsActive(true)}>
                  ▶ Resume
                </button>
              )}
              {mode === 'study' && (
                <button className="btn-outline" onClick={stopTimer}>⏹ Stop Session</button>
              )}
              {mode === 'study' && (
                <button className="btn-save-manual"
                  style={{ borderColor: subjectColor, color: subjectColor }}
                  onClick={manualSave} disabled={isSaving}>
                  {isSaving ? 'Saving…' : '💾 Save & Close'}
                </button>
              )}

              {/* ── Break mode ── */}
              {isBreak && (
                <button className="btn-continue" style={{ background: subjectColor }} onClick={stopTimer}>
                  ▶ Stop Break &amp; Resume
                </button>
              )}
              {isBreak && (
                <button className="btn-outline" onClick={() => {
                  // End session entirely from break
                  setIsActive(false);
                  const done = studyMins - Math.ceil(remainingStudySecsRef.current / 60);
                  if (done > 0) doSave(done);
                  setMode('idle');
                  setTimeLeft(0);
                  startTimeRef.current = null;
                  exitFS();
                }}>⏹ End Session</button>
              )}
            </div>
          )}
        </>

      ) : (
        /* ── SIDEBAR LAYOUT ── */
        <>
          {/* Subject Selector */}
          <div className="subject-selector">
            {SUBJECTS.map(s => (
              <button key={s.id}
                className={`subject-pill ${subject.id === s.id ? 'active' : ''}`}
                style={subject.id === s.id ? { background: s.bg, borderColor: s.color, color: s.color } : {}}
                onClick={() => { if (mode === 'idle') setSubject(s); }}
                title={s.id}
                disabled={mode !== 'idle'}>
                <span className="subject-dot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="timer-display"
            style={{ color: mode === 'idle' ? '#9cb4a4' : timerColor }}>
            {mode === 'idle' ? formatTime(studyMins * 60)
             : isBreakDone  ? '00:00'
             : formatTime(timeLeft)}
          </div>

          <div className="timer-mode-label" style={{ color: timerColor }}>
            {mode === 'study'      ? `📖 ${subject.id}`
             : isBreak             ? '☕ Break'
             : isBreakDone         ? '✅ Break Over'
             : ''}
          </div>

          {/* Settings — only idle */}
          {mode === 'idle' && (
            <div className="timer-settings">
              <label>Study<br />
                <select value={studyMins} onChange={e => setStudyMins(+e.target.value)}>
                  {STUDY_OPTIONS.map(o => <option key={o} value={o}>{o} min</option>)}
                </select>
              </label>
              <label>Break<br />
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
            {/* After break ends */}
            {isBreakDone && (
              <>
                <button className="btn-continue" style={{ background: subjectColor }} onClick={continueStudy}>
                  ▶ Continue Study
                </button>
                <button className="btn-outline" onClick={stopTimer}>End</button>
              </>
            )}
          </div>

          {/* Save button during study */}
          {mode === 'study' && (
            <button className="btn-save-manual"
              style={{ borderColor: subjectColor, color: subjectColor }}
              onClick={manualSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : '💾 Save & Close Session'}
            </button>
          )}

          {/* Break warning hint */}
          {isBreak && (
            <p className="break-warning-hint">🔔 Sound alert at 5 min, 2 min &amp; 1 min remaining</p>
          )}

          {/* Save success flash */}
          {saved && mode === 'idle' && <p className="save-success">✅ Session saved!</p>}
        </>
      )}
    </div>
  );
}
