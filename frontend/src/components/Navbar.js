import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🍕</span>
          Pizza<span>Rush</span>
        </Link>

        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/menu" className={`nav-link ${isActive('/menu') ? 'active' : ''}`}>
                🍕 Menu
              </Link>
              <Link to="/build" className={`nav-link ${isActive('/build') ? 'active' : ''}`}>
                🛠️ Build Your Pizza
              </Link>
              <Link to="/my-orders" className={`nav-link ${isActive('/my-orders') ? 'active' : ''}`}>
                📦 My Orders
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                  ⚙️ Admin
                </Link>
              )}
              <div className="nav-user-badge">
                <div className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.name?.split(' ')[0]}</span>
              </div>
              <button className="nav-cta" onClick={handleLogout} style={{ marginLeft: '8px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/menu" className="nav-link">🍕 Menu</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-cta">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
