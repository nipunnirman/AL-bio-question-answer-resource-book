import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SUBJECTS = [
  { id: 'Biology',        color: 'rgba(45,134,83,0.75)',   border: '#2d8653' },
  { id: 'Chemistry',      color: 'rgba(217,88,88,0.75)',   border: '#d95858' },
  { id: 'Physics',        color: 'rgba(58,123,213,0.75)',  border: '#3a7bd5' },
  { id: 'Combined Maths', color: 'rgba(200,163,0,0.75)',   border: '#c8a300' },
];

// Build last-7-days chart data from localStorage sessions
function buildLocalChartData(userId) {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const labels = dates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  });

  // Aggregate per date per subject from localStorage
  const stats = {};
  dates.forEach(d => { stats[d] = {}; });

  dates.forEach(dateStr => {
    const key = `study_sessions_${userId}_${dateStr}`;
    try {
      const sessions = JSON.parse(localStorage.getItem(key) || '[]');
      sessions.forEach(s => {
        stats[dateStr][s.subject] = (stats[dateStr][s.subject] || 0) + s.duration_minutes;
      });
    } catch {}
  });

  const datasets = SUBJECTS.map(s => ({
    label: s.id,
    data: dates.map(d => stats[d][s.id] || 0),
    backgroundColor: s.color,
    borderColor: s.border,
    borderWidth: 1,
    borderRadius: 4,
  }));

  return { labels, datasets };
}

export default function WeeklyChart({ refreshTrigger, userId }) {
  const { token } = useAuth();
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Always build from localStorage immediately (guaranteed to work)
    setChartData(buildLocalChartData(userId));

    // Try to also fetch from backend (syncs server data if available)
    if (token) {
      fetch('/api/study/weekly', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const labels = data.map(d => {
            const dt = new Date(d.date + 'T00:00:00');
            return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          });
          const datasets = SUBJECTS.map(s => ({
            label: s.id,
            data: data.map(d => d.subjects[s.id] || 0),
            backgroundColor: s.color,
            borderColor: s.border,
            borderWidth: 1,
            borderRadius: 4,
          }));
          setChartData({ labels, datasets });
        })
        .catch(() => {}); // Silently ignore — localStorage data is already shown
    }
  }, [token, refreshTrigger, userId]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: '#3d5247' } },
      title: {
        display: true,
        text: 'Weekly Study Progress',
        color: '#2d5a3d',
        font: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: 600 },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#6b8074', font: { size: 10 } } },
      y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(74,124,89,0.1)' }, ticks: { color: '#6b8074', font: { size: 10 } } },
    },
  };

  if (!chartData) return <div className="chart-loading">Loading…</div>;

  return (
    <div className="weekly-chart-container">
      <Bar options={options} data={chartData} />
    </div>
  );
}
