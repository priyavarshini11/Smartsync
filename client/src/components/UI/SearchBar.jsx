import React, { useState, useEffect, useRef, useContext } from 'react';
import Fuse from 'fuse.js';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Fetch search index on mount
  useEffect(() => {
    const fetchIndex = async () => {
      try {
        const data = await api.get('/search');
        const items = [];
        if (data.resources) data.resources.forEach(r => items.push({ ...r, _type: 'Resource' }));
        if (data.branches) data.branches.forEach(b => items.push({ id: b.id, title: b.name, _type: 'Branch' }));
        setAllItems(items);
      } catch {}
    };
    if (user) fetchIndex();
  }, [user]);

  const fuse = new Fuse(allItems, { keys: ['title', '_type'], threshold: 0.35, includeMatches: true });

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const res = fuse.search(query).slice(0, 8);
    setResults(res.map(r => r.item));
  }, [query, allItems]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', maxWidth: '500px', marginBottom: '1.5rem' }}>
      <div style={{ position: 'relative' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="form-input"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search resources, subjects..."
          style={{ paddingLeft: '2.75rem' }}
        />
      </div>

      {isOpen && query.length > 0 && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, width: '100%',
          background: 'var(--bg-glass-strong)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)', zIndex: 50, maxHeight: '300px', overflowY: 'auto'
        }}>
          {results.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: '0.5rem' }}>
              {results.map(item => (
                <li key={item.id} style={{ padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                  <div className="text-xs text-muted">{item._type}{item.type ? ` • ${item.type}` : ''}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center' }} className="text-muted text-sm">
              No results for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
