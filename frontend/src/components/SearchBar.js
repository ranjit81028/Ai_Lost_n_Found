import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../utils/api';
import './SearchBar.css';

function SearchBar({ onSearch, initialFilters = {} }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState(initialFilters.search || '');
  const [type, setType] = useState(initialFilters.type || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories))
      .catch(() => {
        // Fallback categories if API fails
        setCategories(['Electronics', 'Documents', 'Clothing', 'Accessories', 'Keys', 'Books', 'Bags', 'Other']);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const filters = {};
    if (search) filters.search = search;
    if (type) filters.type = type;
    if (category) filters.category = category;

    if (onSearch) {
      onSearch(filters);
    } else {
      // Navigate to search page with query params
      const params = new URLSearchParams(filters).toString();
      navigate(`/search?${params}`);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search for items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <select value={type} onChange={(e) => setType(e.target.value)} className="search-select">
        <option value="">All Types</option>
        <option value="lost">Lost</option>
        <option value="found">Found</option>
      </select>

      <select value={category} onChange={(e) => setCategory(e.target.value)} className="search-select">
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <button type="submit" className="search-btn">Search</button>
    </form>
  );
}

export default SearchBar;
