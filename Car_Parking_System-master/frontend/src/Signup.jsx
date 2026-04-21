import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Signup({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/api/signup', {
        username, password, email, contact_no: contactNo
      });
      localStorage.setItem('user_id', res.data.user_id);
      onLogin(res.data.token, res.data.role);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }} className="glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>🚗</div>
          <h2 style={{ marginBottom: '0.3rem' }}>Create Account</h2>
          <p>Join the SmartParking System</p>
        </div>

        {error && <div className="alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Number</label>
            <input
              type="text"
              className="form-input"
              value={contactNo}
              onChange={e => setContactNo(e.target.value)}
              placeholder="e.g. 9876543210"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
