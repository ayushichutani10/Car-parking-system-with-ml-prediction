import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

function History() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/cancel-booking`, { booking_id: bookingId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: '✓ Booking cancelled. If someone was on the waitlist, they have been auto-assigned.' });
      fetchBookings();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to cancel.' });
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'4rem', color:'var(--text-muted)'}}>Loading bookings…</div>;

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>All your active and past parking reservations</p>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
          {message.text}
        </div>
      )}

      <div className="glass-card">
        {bookings.length === 0 ? (
          <div style={{textAlign:'center', padding:'2rem'}}>
            <p style={{fontSize:'2rem', marginBottom:'0.5rem'}}>🅿️</p>
            <p>No bookings yet. Go book a slot!</p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(book => (
                  <tr key={book.booking_id}>
                    <td>
                      <strong>#{book.slot_id}</strong>{' '}
                      <span style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>({book.slot_type})</span>
                    </td>
                    <td>{book.booking_date}</td>
                    <td>{book.start_time} – {book.end_time}</td>
                    <td>
                      <span className={`status-badge ${book.booking_status === 'Cancelled' ? 'status-cancelled' : 'status-confirmed'}`}>
                        {book.booking_status || 'Confirmed'}
                      </span>
                    </td>
                    <td style={{textAlign:'right'}}>
                      {book.booking_status !== 'Cancelled' && (
                        <button className="btn btn-danger" onClick={() => handleCancel(book.booking_id)}>
                          Cancel
                        </button>
                      )}
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

export default History;
