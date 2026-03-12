import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const STUDY_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const BREAK_OPTIONS = [5, 10];

const SUBJECTS = [
  { id: 'Biology',        label: 'Bio',           color: '#2d8653', bg: '#e8f5ec' },
  { id: 'Chemistry',      label: 'Chemistry',      color: '#d95858', bg: '#fdf0f0' },
  { id: 'Physics',        label: 'Physics',        color: '#3a7bd5', bg: '#eef3fd' },
  { id: 'Combined Maths', label: 'Comb. Maths',   color: '#c8a300', bg: '#fdf8e1' },
];

function formatTime(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function formatClock(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function StudyTimer({ onSessionSaved }) {
  const { token } = useAuth();

  const [subject, setSubject]           = useState(SUBJECTS[0]);
  const [studyMins, setStudyMins]       = useState(25);
  const [breakMins, setBreakMins]       = useState(5);
  const [mode, setMode]                 = useState('idle');    // idle | study | break
  const [timeLeft, setTimeLeft]         = useState(0);
  const [isActive, setIsActive]         = useState(false);
  const [isSaving, setIsSaving]         = useState(false);

  const startTimeRef = useRef(null);   // ISO string of when the study clock started
  const audioRef     = useRef(null);

  // Lazy-init audio
  const getAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(
        'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
      );
    }
    return audioRef.current;
  };

  // Countdown tick
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [isActive, timeLeft]);

  // Timer hit 0
  useEffect(() => {
    if (isActive && timeLeft === 0) onTimerDone();
  }, [timeLeft, isActive]);

  const onTimerDone = () => {
    setIsActive(false);
    getAudio().play().catch(() => {});
    if (mode === 'study') {
      saveSession(studyMins);           // auto-save full session
      setMode('break');
      setTimeLeft(breakMins * 60);
    } else {
      setMode('idle');
    }
  };

  const startStudy = () => {
    startTimeRef.current = new Date().toISOString();
    setMode('study');
    setTimeLeft(studyMins * 60);
    setIsActive(true);
  };

  const pauseTimer  = () => setIsActive(false);
  const resumeTimer = () => setIsActive(true);

  const stopTimer = () => {
    setIsActive(false);
    if (mode === 'study') {
      const done = studyMins - Math.ceil(timeLeft / 60);
      if (done > 0 && window.confirm(`Save ${done} min of ${subject.label} study?`)) {
        saveSession(done);
      }
    }
    setMode('idle');
    setTimeLeft(0);
    startTimeRef.current = null;
  };

  const manualSave = () => {
    if (mode !== 'study') return;
    const done = studyMins - Math.ceil(timeLeft / 60);
    if (done < 1) { alert("No full minute yet!"); return; }
    saveSession(done);
  };

  const saveSession = async (minutes) => {
    setIsSaving(true);
    const now  = new Date().toISOString();
    const date = now.split('T')[0];
    try {
      await fetch('/api/study/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.id,
          start_time: startTimeRef.current || now,
          end_time: now,
          duration_minutes: minutes,
          date,
        }),
      });
      if (onSessionSaved) onSessionSaved();
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setIsSaving(false);
    }
  };

  const subjectColor = subject.color;

  return (
    <div className="study-timer">
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

      {/* Timer display */}
      <div className="timer-display" style={{ color: mode === 'idle' ? '#9cb4a4' : subjectColor }}>
        {mode === 'idle' ? formatTime(studyMins * 60) : formatTime(timeLeft)}
      </div>

      {/* Mode label */}
      <div className="timer-mode-label" style={{ color: subjectColor }}>
        {mode === 'study' ? `📖 ${subject.id}` : mode === 'break' ? '☕ Break' : ''}
      </div>

      {/* Settings (only in idle) */}
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
        {mode !== 'idle' && !isActive && (
          <button className="btn-primary" style={{ background: subjectColor }} onClick={resumeTimer}>
            Resume
          </button>
        )}
        {mode !== 'idle' && isActive && (
          <button className="btn-secondary" onClick={pauseTimer}>Pause</button>
        )}
        {mode === 'study' && (
          <button className="btn-outline" onClick={stopTimer}>Stop</button>
        )}
      </div>

      {/* Manual Save */}
      {mode === 'study' && (
        <button
          className="btn-save-manual"
          style={{ borderColor: subjectColor, color: subjectColor }}
          onClick={manualSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : '💾 Save Session'}
        </button>
      )}
    </div>
  );
}
