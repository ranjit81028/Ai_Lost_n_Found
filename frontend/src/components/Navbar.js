import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../utils/api';
import Notification from './Notification';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      // Fetch unread count periodically
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Error fetching notifications');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🔍 Lost & Found
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/search" onClick={() => setMenuOpen(false)}>Search</Link>

          {user ? (
            <>
              <Link to="/report" onClick={() => setMenuOpen(false)}>Report Item</Link>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>My Items</Link>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
              )}
              
              <div className="notification-wrapper">
                <button 
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <Notification 
                    onClose={() => setShowNotifications(false)}
                    onRead={() => fetchUnreadCount()}
                  />
                )}
              </div>

              <div className="user-menu">
                <span className="user-name">{user.name}</span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="register-link" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
