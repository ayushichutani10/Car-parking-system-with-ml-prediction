import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE = 'http://localhost:5001/api';

function Dashboard() {
  const [availability, setAvailability] = useState({ total_slots: 0, occupied_slots: 0, available_slots: 0 });
  const [slotTypes, setSlotTypes] = useState({ Compact: 0, Standard: 0, Oversized: 0 });
  const [prediction, setPrediction] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [availRes, typesRes, predRes, wlRes] = await Promise.all([
          axios.get(`${API_BASE}/current-availability`),
          axios.get(`${API_BASE}/slot-types`),
          axios.get(`${API_BASE}/predict-demand`),
          axios.get(`${API_BASE}/my-waitlist`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        setAvailability(availRes.data);
        setSlotTypes(typesRes.data);
        setPrediction(predRes.data);
        setWaitlist(wlRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const occupancyPct = availability.total_slots
    ? Math.round((availability.occupied_slots / availability.total_slots) * 100)
    : 0;

  const chartData = {
    labels: prediction.map(p => `${p.hour}:00`),
    datasets: [{
      label: 'Predicted Vehicles',
      data: prediction.map(p => p.predicted_vehicles),
      backgroundColor: 'rgba(79, 142, 247, 0.5)',
      borderColor: 'rgba(79, 142, 247, 0.9)',
      borderWidth: 1,
      borderRadius: 4,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#7d8590', font: { size: 12 } } },
      title: { display: false },
    },
    scales: {
      y: { ticks: { color: '#7d8590' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#7d8590' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
      Loading dashboard…
    </div>
  );

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="page-header">
        <h1>Parking Dashboard</h1>
        <p>Live overview of the campus parking system</p>
      </div>

      {/* Stats Row */}
      <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
        <div className="glass-card" style={{ borderTop: '3px solid var(--primary)' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Total Slots</p>
          <p style={{ fontSize: '2.4rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1 }}>
            {availability.total_slots}
          </p>
        </div>
        <div className="glass-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Occupied</p>
          <p style={{ fontSize: '2.4rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1 }}>
            {availability.occupied_slots}
            <span style={{ fontSize: '0.9rem', color: 'var(--danger)', marginLeft: '0.5rem' }}>{occupancyPct}%</span>
          </p>
        </div>
        <div className="glass-card" style={{ borderTop: '3px solid var(--success)' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Available</p>
          <p style={{ fontSize: '2.4rem', fontWeight: '700', color: 'var(--success)', lineHeight: 1 }}>
            {availability.available_slots}
          </p>
        </div>
      </div>

      {/* Chart + Slot Types */}
      <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '1rem' }}>AI Demand Prediction</h3>
          {prediction.length > 0 ? (
            <div style={{ height: '240px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p>⚠️ AI model not trained yet. Run <code>python3 backend/train_model.py</code></p>
            </div>
          )}
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem' }}>Slot Types</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: '🔵 Compact', value: slotTypes.Compact || 0, color: 'var(--primary)' },
              { label: '🟢 Standard', value: slotTypes.Standard || 0, color: 'var(--success)' },
              { label: '🟠 Oversized', value: slotTypes.Oversized || 0, color: 'var(--warning)' },
            ].map(item => (
              <div key={item.label} className="flex-between"
                style={{ padding: '0.6rem 0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
                <span style={{ fontWeight: '700', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waitlist Section */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem' }}>My Waitlist</h3>
        {waitlist.length === 0 ? (
          <p style={{ padding: '0.5rem 0' }}>You are not on any waitlists right now.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Requested</th>
                  <th>Joined At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map(w => (
                  <tr key={w.waitlist_id}>
                    <td>{w.booking_date}</td>
                    <td>{w.start_time} – {w.end_time}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{w.join_time.substring(0, 16)}</td>
                    <td>
                      <span className={`status-badge ${w.status === 'Fulfilled' ? 'status-confirmed' : 'status-pending'}`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
