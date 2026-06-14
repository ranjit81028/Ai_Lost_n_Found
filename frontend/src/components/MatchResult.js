import React from 'react';
import { Link } from 'react-router-dom';
import './MatchResult.css';

function MatchResult({ match }) {
  const imageUrl = match.image_path
    ? `http://localhost:5000/uploads/${match.image_path}`
    : null;

  // Color code the score
  const getScoreColor = (score) => {
    if (score >= 0.8) return '#2ec486';
    if (score >= 0.6) return '#f0a500';
    return '#e94560';
  };

  const scorePercent = Math.round(match.combined_score * 100);

  return (
    <div className="match-result">
      <div className="match-image">
        {imageUrl ? (
          <img src={imageUrl} alt={match.title} />
        ) : (
          <div className="match-no-image">📷</div>
        )}
      </div>

      <div className="match-info">
        <h4 className="match-title">{match.title}</h4>
        <p className="match-desc">{match.description.substring(0, 100)}...</p>
        <div className="match-meta">
          <span>📁 {match.category}</span>
          <span>📍 {match.location}</span>
        </div>
      </div>

      <div className="match-score-section">
        <div 
          className="match-score"
          style={{ color: getScoreColor(match.combined_score) }}
        >
          {scorePercent}%
        </div>
        <span className="score-label">Match</span>
        
        <div className="score-breakdown">
          <small>Image: {Math.round(match.image_score * 100)}%</small>
          <small>Text: {Math.round(match.text_score * 100)}%</small>
        </div>

        <Link to={`/item/${match.item_id}`} className="match-view-btn">
          View Item
        </Link>
      </div>
    </div>
  );
}

export default MatchResult;
