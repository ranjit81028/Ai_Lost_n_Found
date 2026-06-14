import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getItem, findMatches } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MatchResult from '../components/MatchResult';
import './ItemDetail.css';

function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await getItem(id);
      setItem(res.data);
    } catch (err) {
      setError('Item not found');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setMatchLoading(true);
    try {
      const res = await findMatches(id);
      setMatches(res.data.matches);
    } catch (err) {
      setError('Error finding matches. Please try again.');
    } finally {
      setMatchLoading(false);
    }
  };

  if (loading) return <div className="detail-page"><p className="loading-text">Loading...</p></div>;
  if (error) return <div className="detail-page"><p className="error-text">{error}</p></div>;
  if (!item) return null;

  const imageUrl = item.image_path
    ? `http://localhost:5000/uploads/${item.image_path}`
    : null;

  const isOwner = user && user.id === item.user_id;

  return (
    <div className="detail-page">
      <div className="detail-card">
        {/* Item Image */}
        <div className="detail-image-section">
          {imageUrl ? (
            <img src={imageUrl} alt={item.title} className="detail-image" />
          ) : (
            <div className="detail-no-image">📷 No Image Available</div>
          )}
        </div>

        {/* Item Info */}
        <div className="detail-info">
          <div className="detail-header">
            <span className={`detail-badge ${item.type}`}>
              {item.type === 'lost' ? '❌ Lost' : '✅ Found'}
            </span>
            <span className={`status-badge ${item.status}`}>{item.status}</span>
          </div>

          <h1 className="detail-title">{item.title}</h1>
          
          <p className="detail-description">{item.description}</p>

          <div className="detail-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Category</span>
              <span className="meta-value">📁 {item.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Location</span>
              <span className="meta-value">📍 {item.location}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Date Reported</span>
              <span className="meta-value">📅 {item.date_reported || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Posted By</span>
              <span className="meta-value">👤 {item.user_name}</span>
            </div>
          </div>

          <p className="detail-posted">
            Posted on {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
          </p>

          {/* Find Matches Button - only for item owner */}
          {isOwner && (
            <button 
              className="find-matches-btn" 
              onClick={handleFindMatches}
              disabled={matchLoading}
            >
              {matchLoading ? '🔄 Finding matches...' : '🤖 Find AI Matches'}
            </button>
          )}
        </div>
      </div>

      {/* Match Results */}
      {matches.length > 0 && (
        <div className="matches-section">
          <h2>🎯 Potential Matches ({matches.length})</h2>
          {matches.map((match, index) => (
            <MatchResult key={index} match={match} />
          ))}
        </div>
      )}

      {matches.length === 0 && matchLoading === false && isOwner && (
        <div className="matches-section">
          <p className="no-matches">Click "Find AI Matches" to search for potential matches using image and text similarity.</p>
        </div>
      )}
    </div>
  );
}

export default ItemDetail;
