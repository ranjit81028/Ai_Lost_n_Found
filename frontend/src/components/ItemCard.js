import React from 'react';
import { Link } from 'react-router-dom';
import './ItemCard.css';

function ItemCard({ item }) {
  const imageUrl = item.image_path
    ? `http://localhost:5000/uploads/${item.image_path}`
    : null;

  return (
    <div className="item-card">
      <div className="item-card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} />
        ) : (
          <div className="no-image">📷 No Image</div>
        )}
        <span className={`item-type-badge ${item.type}`}>
          {item.type === 'lost' ? '❌ Lost' : '✅ Found'}
        </span>
      </div>

      <div className="item-card-body">
        <h3 className="item-card-title">{item.title}</h3>
        <p className="item-card-desc">{item.description.substring(0, 80)}...</p>
        
        <div className="item-card-meta">
          <span className="item-category">📁 {item.category}</span>
          <span className="item-location">📍 {item.location}</span>
        </div>

        <div className="item-card-footer">
          <span className="item-date">
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
          </span>
          <Link to={`/item/${item.id}`} className="view-btn">View Details →</Link>
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
