import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyItems, deleteItem, findMatches } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyItems();
  }, [user]);

  const fetchMyItems = async () => {
    try {
      const res = await getMyItems();
      setItems(res.data.items);
    } catch (err) {
      console.error('Error fetching items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        setItems(items.filter(item => item.id !== id));
      } catch (err) {
        alert('Failed to delete item');
      }
    }
  };

  if (loading) return <div className="dashboard"><p className="loading-text">Loading...</p></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user?.name}</p>
        </div>
        <Link to="/report" className="btn btn-primary">+ Report Item</Link>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-number">{items.length}</span>
          <span className="stat-label">Total Items</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{items.filter(i => i.type === 'lost').length}</span>
          <span className="stat-label">Lost Items</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{items.filter(i => i.type === 'found').length}</span>
          <span className="stat-label">Found Items</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{items.filter(i => i.status === 'resolved').length}</span>
          <span className="stat-label">Resolved</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="items-table-container">
        <h2>My Reported Items</h2>
        
        {items.length === 0 ? (
          <div className="empty-state">
            <p>You haven't reported any items yet.</p>
            <Link to="/report" className="btn btn-primary">Report Your First Item</Link>
          </div>
        ) : (
          <table className="items-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/item/${item.id}`} className="item-link">{item.title}</Link>
                  </td>
                  <td>
                    <span className={`type-tag ${item.type}`}>
                      {item.type}
                    </span>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`status-tag ${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/item/${item.id}`} className="action-btn view">View</Link>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
