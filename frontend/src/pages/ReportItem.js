import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportItem, getCategories } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ReportItem.css';

function ReportItem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: '',
    location: '',
    date_reported: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories))
      .catch(() => {
        setCategories(['Electronics', 'Documents', 'Clothing', 'Accessories', 'Keys', 'Books', 'Bags', 'Other']);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Show image preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('type', formData.type);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('location', formData.location);
      data.append('date_reported', formData.date_reported);
      if (image) {
        data.append('image', image);
      }

      const res = await reportItem(data);
      setSuccess('Item reported successfully! AI matching is running...');
      
      // Redirect to item detail after a short delay
      setTimeout(() => {
        navigate(`/item/${res.data.item_id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to report item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="report-page">
      <div className="report-card">
        <h2>Report an Item</h2>
        <p className="report-subtitle">Fill in the details to report a lost or found item</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Type Selection */}
          <div className="type-selector">
            <button
              type="button"
              className={`type-btn ${formData.type === 'lost' ? 'active-lost' : ''}`}
              onClick={() => setFormData({ ...formData, type: 'lost' })}
            >
              ❌ I Lost Something
            </button>
            <button
              type="button"
              className={`type-btn ${formData.type === 'found' ? 'active-found' : ''}`}
              onClick={() => setFormData({ ...formData, type: 'found' })}
            >
              ✅ I Found Something
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="title">Item Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Blue iPhone 14 with cracked screen"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the item in detail — color, brand, distinguishing features..."
              rows="4"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Library, Cafeteria, Block A"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date_reported">Date (when lost/found)</label>
            <input
              id="date_reported"
              name="date_reported"
              type="date"
              value={formData.date_reported}
              onChange={handleChange}
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>Upload Image</label>
            <div className="image-upload-area">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button" 
                    className="remove-image"
                    onClick={() => { setImage(null); setImagePreview(null); }}
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <label className="upload-label" htmlFor="image-input">
                  <span className="upload-icon">📷</span>
                  <span>Click to upload an image</span>
                  <small>JPG, PNG (max 5MB)</small>
                </label>
              )}
              <input
                id="image-input"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Report Item'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportItem;
