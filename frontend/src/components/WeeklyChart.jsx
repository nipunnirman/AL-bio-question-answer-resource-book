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

export default function WeeklyChart({ refreshTrigger }) {
  const { token } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/study/weekly', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json(); // [{date, subjects:{Biology:30,...}},...]

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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [token, refreshTrigger]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, font: { size: 10 }, color: '#3d5247' },
      },
      title: {
        display: true,
        text: 'Your Weekly Study Progress',
        color: '#2d5a3d',
        font: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: 600 },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#6b8074', font: { size: 10 } } },
      y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(74,124,89,0.1)' }, ticks: { color: '#6b8074', font: { size: 10 } } },
    },
  };

  if (loading) return <div className="chart-loading">Loading chart…</div>;
  if (!chartData) return null;

  return (
    <div className="weekly-chart-container">
      <Bar options={options} data={chartData} />
    </div>
  );
}
