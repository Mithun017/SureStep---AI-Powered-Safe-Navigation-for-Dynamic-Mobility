import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import axios from 'axios';

const SearchPanel = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-panel-container" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <form onSubmit={handleSearch} className="glass" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        gap: '10px',
        border: '1px solid var(--color-primary)'
      }}>
        <Search size={20} color="var(--color-primary)" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search destination..."
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            flex: 1,
            outline: 'none',
            fontSize: '14px'
          }}
        />
        {query && <X size={18} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => { setQuery(''); setResults([]); }} />}
      </form>

      {results.length > 0 && (
        <div className="glass results-list" style={{
          position: 'absolute',
          top: '110%',
          left: 0,
          right: 0,
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
          padding: '10px'
        }}>
          {results.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                onLocationSelect({
                  lat: parseFloat(item.lat),
                  lon: parseFloat(item.lon),
                  name: item.display_name
                });
                setResults([]);
                setQuery(item.display_name);
              }}
              style={{
                padding: '10px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <MapPin size={14} style={{ marginTop: '2px', color: 'var(--color-primary)' }} />
              <span>{item.display_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
