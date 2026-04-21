import { Link, useLocation } from 'react-router-dom';

function Navbar({ onLogout, isAdmin }) {
  const location = useLocation();

  return (
    <nav className="navbar flex-between">
      <h2>SmartParking</h2>
      <ul className="nav-links">
        <li>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
        </li>
        {isAdmin ? (
          <>
            <li>
              <Link to="/admin-bookings" className={location.pathname === '/admin-bookings' ? 'active' : ''}>Bookings</Link>
            </li>
            <li>
              <Link to="/gate" className={location.pathname === '/gate' ? 'active' : ''}>Gate Simulator</Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/book" className={location.pathname === '/book' ? 'active' : ''}>Book Slot</Link>
            </li>
            <li>
              <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>My Bookings</Link>
            </li>
          </>
        )}
        <li>
          <button onClick={onLogout} style={{background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontWeight:'500', fontSize:'0.82rem', padding:'0.38rem 0.75rem'}}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;