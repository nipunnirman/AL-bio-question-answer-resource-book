import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const STUDY_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50]; // minutes
const BREAK_OPTIONS = [5, 10]; // minutes

export default function StudyTimer({ onSessionSaved }) {
    const { token } = useAuth();
    
    const [mode, setMode] = useState('study'); // 'study' | 'break' | 'idle'
    const [timeLeft, setTimeLeft] = useState(0); 
    const [isActive, setIsActive] = useState(false);
    
    const [studyDuration, setStudyDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    
    const [isSaving, setIsSaving] = useState(false);
    
    // Track how much we actually studied so far to save it if stopped early
    const totalStudyTimeRef = useRef(0);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            handleTimerComplete();
        }
        
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        setIsActive(false);
        audioRef.current.play().catch(e => console.log('Audio error:', e));
        
        if (mode === 'study') {
            // Auto-save the full session
            saveSession(studyDuration);
            // Switch to break
            setMode('break');
            setTimeLeft(breakDuration * 60);
        } else {
            // Break is over, go back to idle
            setMode('idle');
        }
    };

    const startTimer = () => {
        if (mode === 'idle') {
            setMode('study');
            setTimeLeft(studyDuration * 60);
            totalStudyTimeRef.current = 0;
        }
        setIsActive(true);
    };

    const pauseTimer = () => {
        setIsActive(false);
    };

    const stopTimer = () => {
        setIsActive(false);
        // If studying and we stop early, we can offer to save the partial time
        if (mode === 'study') {
            const minutesStudied = studyDuration - Math.ceil(timeLeft / 60);
            if (minutesStudied > 0) {
                if (window.confirm(`You studied for ${minutesStudied} minutes. Want to save it?`)) {
                    saveSession(minutesStudied);
                }
            }
        }
        setMode('idle');
        setTimeLeft(0);
    };
    
    const manualSave = () => {
        if (mode === 'study') {
            const minutesStudied = studyDuration - Math.ceil(timeLeft / 60);
            if (minutesStudied > 0) {
                saveSession(minutesStudied);
            } else {
                alert("You haven't studied a full minute yet!");
            }
        }
    };

    const saveSession = async (minutes) => {
        setIsSaving(true);
        try {
            const date = new Date().toISOString().split('T')[0];
            const res = await fetch('/api/study/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ duration_minutes: minutes, date })
            });
            
            if (res.ok) {
                if (onSessionSaved) onSessionSaved();
            }
        } catch (error) {
            console.error('Failed to save session:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="study-timer">
            <h3 className="timer-title">{mode === 'study' ? '📖 Study Focus' : mode === 'break' ? '☕ Break Time' : '⏱️ Study Timer'}</h3>
            
            <div className={`timer-display ${mode}`}>
                {mode === 'idle' ? formatTime(studyDuration * 60) : formatTime(timeLeft)}
            </div>
            
            {mode === 'idle' && (
                <div className="timer-settings">
                    <label>
                        Study (min):
                        <select value={studyDuration} onChange={e => setStudyDuration(Number(e.target.value))}>
                            {STUDY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                    <label>
                        Break (min):
                        <select value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))}>
                            {BREAK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                </div>
            )}
            
            <div className="timer-controls">
                {!isActive && <button className="btn-primary" onClick={startTimer}>{mode === 'idle' ? 'Start' : 'Resume'}</button>}
                {isActive && <button className="btn-secondary" onClick={pauseTimer}>Pause</button>}
                {mode !== 'idle' && <button className="btn-outline" onClick={stopTimer}>Stop</button>}
            </div>
            
            {mode === 'study' && !isActive && timeLeft > 0 && (
                <button className="btn-save-manual" onClick={manualSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Current Session'}
                </button>
            )}
        </div>
    );
}
