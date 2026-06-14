import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getAdminUsers, getAdminItems, updateItemStatus, deleteUser } from '../utils/api';
import './AdminPanel.css';

function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, itemsRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminItems()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setItems(itemsRes.data.items);
    } catch (err) {
      console.error('Error fetching admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await updateItemStatus(itemId, newStatus);
      setItems(items.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  if (loading) return <div className="admin-panel"><p className="loading-text">Loading...</p></div>;

  return (
    <div className="admin-panel">
      <h1>Admin Dashboard</h1>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          📦 Items
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat">
            <span className="admin-stat-num">{stats.total_users}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-num">{stats.total_items}</span>
            <span className="admin-stat-label">Total Items</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-num">{stats.lost_items}</span>
            <span className="admin-stat-label">Lost Items</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-num">{stats.found_items}</span>
            <span className="admin-stat-label">Found Items</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-num">{stats.active_items}</span>
            <span className="admin-stat-label">Active</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-num">{stats.resolved_items}</span>
            <span className="admin-stat-label">Resolved</span>
          </div>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Posted By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>
                    <span className={`type-tag ${item.type}`}>{item.type}</span>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.user_name}</td>
                  <td>
                    <span className={`status-tag ${item.status}`}>{item.status}</span>
                  </td>
                  <td>
                    <select 
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                      <option value="removed">Removed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-tag ${u.role}`}>{u.role}</span>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {u.role !== 'admin' && (
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        Delete
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
  );
}

export default AdminPanel;
