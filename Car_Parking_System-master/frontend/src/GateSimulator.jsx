import { useState } from 'react';

function GateSimulator() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkTime, setCheckTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [gateStatus, setGateStatus] = useState(null); // null | 'open' | 'closed'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setGateStatus(null);
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:5001/api/simulate-gate-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_number: vehicleNumber,
          check_date: checkDate,
          check_time: checkTime
        })
      });
      const data = await resp.json();
      if (data.action === 'OPEN_GATE') {
        setGateStatus('open');
        setMessage(data.message);
      } else {
        setGateStatus('closed');
        setMessage(data.reason || data.error || 'Unknown error');
      }
    } catch (err) {
      setGateStatus('closed');
      setMessage('Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  const gateColor   = gateStatus === 'open' ? 'var(--success)' : gateStatus === 'closed' ? 'var(--danger)' : 'var(--text-muted)';
  const gateBgColor = gateStatus === 'open' ? 'rgba(63,185,80,0.08)' : gateStatus === 'closed' ? 'rgba(248,81,73,0.08)' : 'rgba(255,255,255,0.03)';

  return (
    <div style={{ maxWidth: '560px', margin: '2.5rem auto' }}>
      <div className="page-header">
        <h1>🚧 Gate Simulator</h1>
        <p>Admin tool — simulates ANPR / Fastag scanner at the parking entrance</p>
      </div>

      {/* Gate Status Display */}
      <div className="glass-card" style={{
        textAlign: 'center',
        padding: '2.5rem',
        marginBottom: '1.5rem',
        border: `2px solid ${gateColor}`,
        background: gateBgColor,
        transition: 'all 0.3s ease'
      }}>
        {gateStatus === null && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔒</div>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Awaiting vehicle scan…</p>
          </>
        )}
        {gateStatus === 'open' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
            <h2 style={{ color: 'var(--success)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>ACCESS GRANTED</h2>
            <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{message}</p>
          </>
        )}
        {gateStatus === 'closed' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚫</div>
            <h2 style={{ color: 'var(--danger)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>ACCESS DENIED</h2>
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{message}</p>
          </>
        )}
      </div>

      {/* Scan Form */}
      <div className="glass-panel">
        <form onSubmit={handleSimulate}>
          <div className="form-group">
            <label className="form-label">Vehicle License Plate / Fastag ID</label>
            <input
              type="text"
              className="form-input"
              value={vehicleNumber}
              onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. DL01AB1234"
              required
              style={{ fontSize: '1rem', letterSpacing: '0.08em', textAlign: 'center' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Simulate Date</label>
              <input
                type="date"
                className="form-input"
                value={checkDate}
                onChange={e => setCheckDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Simulate Time</label>
              <input
                type="time"
                className="form-input"
                value={checkTime}
                onChange={e => setCheckTime(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block"
            disabled={loading} style={{ padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {loading ? 'Scanning…' : '📡 Scan Vehicle'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '0.9rem 1rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: '1.7'
        }}>
          <strong style={{ color: 'var(--text-main)' }}>How to test:</strong><br />
          1. Book a slot as a regular user using a vehicle plate (e.g. <code>TESTCAR01</code>)<br />
          2. Come here, enter <code>TESTCAR01</code> with the same date and a time within the booking window<br />
          3. Hit Scan — the gate should open and the entry will be logged ✓
        </div>
      </div>
    </div>
  );
}

export default GateSimulator;
