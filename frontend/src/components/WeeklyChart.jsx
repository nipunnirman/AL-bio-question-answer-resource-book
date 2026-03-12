import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function WeeklyChart({ refreshTrigger }) {
    const { token } = useAuth();
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/study/weekly', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    
                    // Format dates for labels
                    const labels = data.map(d => {
                        const date = new Date(d.date);
                        return date.toLocaleDateString('en-US', { weekday: 'short' });
                    });
                    
                    const minutes = data.map(d => d.total_minutes);

                    setChartData({
                        labels,
                        datasets: [
                            {
                                label: 'Study Minutes',
                                data: minutes,
                                backgroundColor: 'rgba(74, 124, 89, 0.7)', // var(--sage)
                                borderRadius: 4,
                            }
                        ]
                    });
                }
            } catch (error) {
                console.error("Failed to load study stats", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchStats();
        }
    }, [token, refreshTrigger]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Study Time (Last 7 Days)',
                color: '#2d5a3d',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: 600 }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(74, 124, 89, 0.1)' },
                ticks: { color: '#6b8074', font: { size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6b8074', font: { size: 10 } }
            }
        }
    };

    if (loading) return <div className="chart-loading">Loading chart...</div>;
    if (!chartData) return null;

    return (
        <div className="weekly-chart-container">
            <Bar options={options} data={chartData} />
        </div>
    );
}
