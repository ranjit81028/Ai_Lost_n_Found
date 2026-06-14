import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getItems } from '../utils/api';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';
import './SearchResults.css';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get initial filters from URL params
  const initialFilters = {
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    category: searchParams.get('category') || ''
  };

  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    fetchItems();
  }, [filters, page]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, per_page: 12 };
      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const res = await getItems(params);
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Error fetching items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // reset to first page
  };

  return (
    <div className="search-page">
      <h1>Search Items</h1>
      
      <SearchBar onSearch={handleSearch} initialFilters={filters} />

      <div className="results-header">
        <p className="results-count">{total} item(s) found</p>
      </div>

      {loading ? (
        <p className="loading-text">Searching...</p>
      ) : items.length === 0 ? (
        <div className="no-results">
          <p>No items found matching your search.</p>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button 
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchResults;
