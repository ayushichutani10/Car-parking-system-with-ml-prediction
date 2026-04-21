import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5001/api';

function Booking() {
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [canWaitlist, setCanWaitlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE}/slots`)
      .then(res => setSlots(res.data))
      .catch(err => console.error(err));
    setDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCanWaitlist(false);

    const sTime = startTime.length === 5 ? startTime + ':00' : startTime;
    const eTime = endTime.length === 5 ? endTime + ':00' : endTime;

    if (sTime >= eTime) {
      setError('End time must be after start time.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');

      await axios.post(`${API_BASE}/book-slot`, {
        user_id: userId,
        slot_id: selectedSlot,
        booking_date: date,
        start_time: sTime,
        end_time: eTime,
        vehicle_number: vehicleNumber
      }, { headers: { Authorization: `Bearer ${token}` } });

      setSuccess('Booking confirmed! Redirecting to your bookings…');
      setTimeout(() => navigate('/history'), 1500);
    } catch (err) {
      if (err.response?.data?.can_waitlist) setCanWaitlist(true);
      setError(err.response?.data?.error || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    setError(null);
    try {
      const sTime = startTime.length === 5 ? startTime + ':00' : startTime;
      const eTime = endTime.length === 5 ? endTime + ':00' : endTime;
      await axios.post(`${API_BASE}/join-waitlist`, {
        booking_date: date, start_time: sTime, end_time: eTime
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSuccess("You've been added to the waitlist. We'll auto-assign you if a slot opens up.");
      setCanWaitlist(false);
    } catch (err) {
      setError('Failed to join waitlist.');
    }
  };

  return (
    <div style={{ maxWidth: '560px', margin: '2.5rem auto' }} className="glass-panel">
      <div className="page-header" style={{ borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
        <h2>Book a Parking Slot</h2>
        <p>Reserve your spot in advance</p>
      </div>

      {error && (
        <div className="alert-error">
          <span>⚠️ {error}</span>
          {canWaitlist && (
            <button onClick={handleWaitlist}
              style={{ marginLeft: 'auto', padding: '0.3rem 0.75rem', background: 'rgba(248,81,73,0.15)',
                color: 'var(--danger)', border: '1px solid rgba(248,81,73,0.4)', borderRadius: '6px',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
              Join Waitlist
            </button>
          )}
        </div>
      )}
      {success && <div className="alert-success">✓ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date}
            onChange={e => setDate(e.target.value)} required
            min={new Date().toISOString().split('T')[0]} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input type="time" className="form-input" value={startTime}
              onChange={e => setStartTime(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input type="time" className="form-input" value={endTime}
              onChange={e => setEndTime(e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Vehicle Number Plate</label>
          <input type="text" className="form-input" value={vehicleNumber}
            onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
            placeholder="e.g. DL01AB1234" required />
        </div>

        <div className="form-group">
          <label className="form-label">Select Slot</label>
          <select className="form-select" value={selectedSlot}
            onChange={e => setSelectedSlot(e.target.value)} required
            style={{ background: 'rgba(13,17,23,0.8)' }}>
            <option value="">-- Choose a parking slot --</option>
            {slots.map(s => (
              <option key={s.slot_id} value={s.slot_id}>
                Slot #{s.slot_id} — {s.slot_type}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary btn-block"
          disabled={loading} style={{ marginTop: '0.75rem', padding: '0.75rem', fontSize: '0.9rem' }}>
          {loading ? 'Confirming…' : '✓ Confirm Booking'}
        </button>
      </form>
    </div>
  );
}

export default Booking;
