import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import Booking from './Booking';
import History from './History';
import AdminBookings from './AdminBookings';
import GateSimulator from './GateSimulator';
import { useState, useEffect } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    setIsAuthenticated(!!token);
    setIsAdmin(role === 'admin');
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role || 'user');
    setIsAuthenticated(true);
    setIsAdmin(role === 'admin');
  };

  const handleLogout = async () => {
    try {
      const resp = await fetch('http://localhost:5001/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      console.log(await resp.json());
    } catch(err) {
      console.error(err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <Router>
      {isAuthenticated && <Navbar onLogout={handleLogout} isAdmin={isAdmin} />}
      <div className="container">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!isAuthenticated ? <Signup onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/book" element={isAuthenticated ? <Booking /> : <Navigate to="/login" />} />
          <Route path="/history" element={isAuthenticated ? <History /> : <Navigate to="/login" />} />
          <Route path="/admin-bookings" element={isAdmin ? <AdminBookings /> : <Navigate to="/dashboard" />} />
          <Route path="/gate" element={isAdmin ? <GateSimulator /> : <Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
