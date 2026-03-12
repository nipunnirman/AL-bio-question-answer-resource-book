import { useState, useCallback } from 'react';
import StudyTimer from './StudyTimer';
import WeeklyChart from './WeeklyChart';

export default function Sidebar({ isOpen, onClose }) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSessionSaved = useCallback(() => {
        // Trigger a re-render of the chart to show the new data
        setRefreshTrigger(prev => prev + 1);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="sidebar" aria-hidden={!isOpen}>
            <div className="sidebar-header">
                <h2>📚 Study Help</h2>
                <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
                    ✕
                </button>
            </div>
            
            <div className="sidebar-content">
                <StudyTimer onSessionSaved={handleSessionSaved} />
                
                <hr className="sidebar-divider" />
                
                <h3 className="section-title">📊 Your Progress</h3>
                <WeeklyChart refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
}
