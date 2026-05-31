import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ResourceCard from '../components/Student/ResourceCard';

const FavoritesPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarked_resources') || '[]');
        if (bookmarks.length === 0) { setLoading(false); return; }
        const all = await api.get('/resources');
        setResources(all.filter(r => bookmarks.includes(r.id)));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchFavorites();
  }, []);

  return (
    <div>
      <div className="app-header">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>⭐ My Favorites</h1>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : resources.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <p style={{ fontWeight: 600 }}>No favorites yet</p>
          <p className="text-sm">Star resources from your dashboard to save them here.</p>
        </div>
      ) : (
        <div className="grid grid-2 anim-stagger">
          {resources.map(res => <ResourceCard key={res.id} resource={res} />)}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
