import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getItems } from '../utils/api';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';
import './Home.css';

function Home() {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent items for the homepage
    getItems({ per_page: 6 })
      .then((res) => setRecentItems(res.data.items))
      .catch((err) => console.error('Error fetching items:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Lost Something? Found Something?</h1>
          <p>
            Our AI-powered platform helps you find your lost items by matching
            images and descriptions with items reported by others.
          </p>
          <div className="hero-buttons">
            <Link to="/report" className="btn btn-primary">Report an Item</Link>
            <Link to="/search" className="btn btn-secondary">Search Items</Link>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="home-search">
        <SearchBar />
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon">📝</div>
            <h3>1. Report</h3>
            <p>Upload a photo and description of your lost or found item</p>
          </div>
          <div className="step">
            <div className="step-icon">🤖</div>
            <h3>2. AI Matching</h3>
            <p>Our system uses ResNet and BERT to find similar items</p>
          </div>
          <div className="step">
            <div className="step-icon">🔔</div>
            <h3>3. Get Notified</h3>
            <p>Receive notifications when a potential match is found</p>
          </div>
          <div className="step">
            <div className="step-icon">🤝</div>
            <h3>4. Connect</h3>
            <p>View match details and connect with the other person</p>
          </div>
        </div>
      </section>

      {/* Recent Items */}
      <section className="recent-items">
        <div className="section-header">
          <h2>Recently Reported Items</h2>
          <Link to="/search" className="see-all">See All →</Link>
        </div>

        {loading ? (
          <p className="loading-text">Loading items...</p>
        ) : recentItems.length === 0 ? (
          <p className="empty-text">No items reported yet. Be the first!</p>
        ) : (
          <div className="items-grid">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
