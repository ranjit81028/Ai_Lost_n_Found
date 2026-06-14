import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../utils/api';
import './Notification.css';

function Notification({ onClose, onRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      if (onRead) onRead();
    } catch (err) {
      console.error('Error marking notification as read');
    }
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h4>Notifications</h4>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="notification-list">
        {loading ? (
          <p className="notification-empty">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="notification-empty">No notifications yet</p>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`notification-item ${notif.read ? 'read' : 'unread'}`}
              onClick={() => !notif.read && handleMarkRead(notif.id)}
            >
              <p className="notification-message">{notif.message}</p>
              <div className="notification-meta">
                <span className="notification-time">
                  {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                </span>
                {notif.item_id && (
                  <Link 
                    to={`/item/${notif.item_id}`} 
                    className="notification-link"
                    onClick={onClose}
                  >
                    View →
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notification;
