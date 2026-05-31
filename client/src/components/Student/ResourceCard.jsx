import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const ResourceCard = ({ resource, color, variant = 'default', bgColor, borderColor, pinColor, rotation }) => {
  const [isUnread, setIsUnread] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Check backend progress array or fallback
    const opened = user?.profile?.openedResources || [];
    if (opened.includes(resource.id)) setIsUnread(false);
    
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_resources') || '[]');
    if (bookmarks.includes(resource.id)) setIsBookmarked(true);
  }, [resource.id, user]);

  const markAsRead = async () => {
    if (!isUnread) return;
    setIsUnread(false);
    
    try {
      await api.post(`/resources/${resource.id}/read`);
      // Optionally update user context here if needed, but UI state is already updated
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const toggleBookmark = (e) => {
    e.stopPropagation();
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_resources') || '[]');
    const updated = isBookmarked ? bookmarks.filter(id => id !== resource.id) : [...bookmarks, resource.id];
    localStorage.setItem('bookmarked_resources', JSON.stringify(updated));
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = (e) => {
    if (e) e.stopPropagation();
    const url = getFileUrl();
    const absoluteUrl = url ? (url.startsWith('http') ? url : `${window.location.origin}${url}`) : '';
    
    const shareText = url 
      ? `Check out this resource: ${resource.title} - ${absoluteUrl}`
      : `Check out this announcement: ${resource.title}\n\n${resource.textContent}`;
      
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleReport = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Report this resource as broken/inappropriate?')) return;
    try {
      await api.post(`/resources/${resource.id}/report`);
      alert('Flagged for admin review. Thank you!');
    } catch { alert('Could not report. Try again.'); }
  };

  const handleDownload = (e) => {
    if (e) e.stopPropagation();
    const url = getFileUrl();
    
    if (!url && resource.textContent) {
      const blob = new Blob([resource.textContent], { type: 'text/plain' });
      const tempUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = tempUrl;
      a.download = `${resource.title || 'resource'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(tempUrl);
      return;
    }
    
    if (!url) return;
    // For external links, open in new tab
    if (url.startsWith('http')) {
      window.open(url, '_blank');
      return;
    }
    // Create a temporary anchor element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = resource.title || 'download';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ---- View / Preview ----
  const getFileUrl = () => {
    return resource.fileUrl || '';
  };

  const getFileExtension = () => {
    const url = resource.fileUrl || '';
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
    return ext;
  };

  const getPreviewType = () => {
    if (resource.textContent) return 'text';
    const ext = getFileExtension();
    const type = (resource.type || '').toLowerCase();

    // Prioritize actual file extensions to ensure correct responsive rendering
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || type === 'image') return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext) || type === 'video') return 'video';
    if (['mp3', 'wav', 'ogg', 'aac'].includes(ext) || type === 'audio') return 'audio';
    
    // Fallback to pdf if extension is pdf or type is pdf
    if (ext === 'pdf' || type === 'pdf') return 'pdf';
    
    if (type === 'link' || resource.fileUrl?.startsWith('http')) return 'link';
    
    // Only use iframe for web-safe formats
    if (['txt', 'csv', 'json', 'html', 'htm', 'md'].includes(ext)) return 'iframe';
    
    return 'unsupported';
  };

  const handleView = (e) => {
    e.stopPropagation();
    markAsRead();
    setShowPreview(true);
    // Prevent body scroll when preview is open
    document.body.style.overflow = 'hidden';
  };

  const closePreview = () => {
    setShowPreview(false);
    document.body.style.overflow = '';
  };

  // Close preview on Escape key
  useEffect(() => {
    if (!showPreview) return;
    const handleEsc = (e) => { if (e.key === 'Escape') closePreview(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showPreview]);

  const renderPreviewContent = () => {
    const url = getFileUrl();
    const previewType = getPreviewType();

    switch (previewType) {
      case 'text':
        return (
          <div style={{ padding: '2rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.1rem', color: 'var(--text-primary)', overflowY: 'auto', height: '100%' }}>
            {resource.textContent}
          </div>
        );

      case 'pdf':
        return (
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            title={resource.title}
            className="preview-frame"
          />
        );

      case 'image':
        return (
          <div className="preview-image-container">
            <img src={url} alt={resource.title} className="preview-image" />
          </div>
        );

      case 'video':
        return (
          <div className="preview-media-container">
            <video controls autoPlay className="preview-video">
              <source src={url} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="preview-media-container" style={{ padding: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎵</div>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{resource.title}</p>
            </div>
            <audio controls autoPlay style={{ width: '100%' }}>
              <source src={url} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );

      case 'link':
        return (
          <iframe
            src={url}
            title={resource.title}
            className="preview-frame"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        );

      case 'iframe':
        return (
          <iframe
            src={url}
            title={resource.title}
            className="preview-frame"
          />
        );

      default:
        return (
          <div className="preview-unsupported">
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📄</div>
            <p style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              Preview not available
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '320px' }}>
              This file type cannot be previewed in the browser. You can download it instead.
            </p>
            <button className="btn btn-primary" onClick={handleDownload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download File
            </button>
          </div>
        );
    }
  };

  // Deadline urgency
  let urgencyClass = '';
  if (resource.endDate) {
    const daysLeft = Math.ceil((new Date(resource.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) urgencyClass = 'urgency-high';
    else if (daysLeft <= 5) urgencyClass = 'urgency-medium';
    else urgencyClass = 'urgency-low';
  }

  return (
    <>
      {variant === 'sticky' ? (
        <div 
          className="card-sticky-motion"
          onClick={handleView}
          style={{
            position: 'relative',
            background: bgColor || '#fef08a',
            border: `1px solid ${borderColor || '#fde047'}`,
            padding: '1.5rem',
            borderRadius: '6px',
            width: '280px',
            flexShrink: 0,
            transform: `rotate(${rotation || '0deg'})`,
            boxShadow: '6px 6px 0px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Thumbtack / Pin Badge */}
          <div style={{
            position: 'absolute', top: '-15px', left: '-15px',
            fontSize: '2.5rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.25))', zIndex: 10
          }}>
            {(!resource.pinShape || !['book_open', 'lightbulb', 'paperclip', 'pin', 'books', 'link', 'star', 'hourglass', 'target', 'megaphone', 'calendar', 'file_box', 'envelope', 'laptop', 'bookmark_tabs', 'bookmark_tag', 'journal'].includes(resource.pinShape)) && '⭐'}
            {resource.pinShape === 'book_open' && '📖'}
            {resource.pinShape === 'lightbulb' && '💡'}
            {resource.pinShape === 'paperclip' && '📎'}
            {resource.pinShape === 'pin' && '📌'}
            {resource.pinShape === 'books' && '📚'}
            {resource.pinShape === 'link' && '🔗'}
            {resource.pinShape === 'star' && '⭐'}
            {resource.pinShape === 'hourglass' && '⏳'}
            {resource.pinShape === 'target' && '🎯'}
            {resource.pinShape === 'megaphone' && '📢'}
            {resource.pinShape === 'calendar' && '📅'}
            {resource.pinShape === 'file_box' && '🗃️'}
            {resource.pinShape === 'envelope' && '✉️'}
            {resource.pinShape === 'laptop' && '💻'}
            {resource.pinShape === 'bookmark_tabs' && '📑'}
            {resource.pinShape === 'bookmark_tag' && '🔖'}
            {resource.pinShape === 'journal' && '📒'}
          </div>

          {/* Unread Badge */}
          {isUnread && <span className="badge badge-new" style={{ position: 'absolute', top: -6, right: -6 }}>NEW</span>}

          <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', color: '#1a1a1a', lineHeight: 1.3, letterSpacing: '-0.02em' }}>{resource.title}</h4>
          
          <p style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '1rem', whiteSpace: 'pre-wrap', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', lineHeight: 1.4, letterSpacing: '0.01em' }}>
            {resource.textContent || resource.categoryHeading || "Click to view details..."}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.5rem', fontSize: '0.7rem', color: '#1a1a1a', opacity: 0.8, fontWeight: 400, marginTop: 'auto' }}>
            <span style={{ whiteSpace: 'nowrap' }}>{new Date(resource.createdAt).toLocaleDateString()}</span>
            <span style={{ textAlign: 'right', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>By {resource.uploaderName || 'Faculty'}</span>
          </div>
        </div>
      ) : (
        <div className={`card ${urgencyClass}`} onClick={markAsRead}
          style={{ display: 'flex', flexDirection: 'column', position: 'relative', borderLeft: `4px solid ${color || 'var(--accent)'}`, cursor: 'pointer', padding: '1rem', gap: '0.75rem' }}>

        {/* Unread Badge */}
        {isUnread && <span className="badge badge-new" style={{ position: 'absolute', top: -6, right: -6 }}>NEW</span>}

        {/* Top section: Icon and Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <span style={{ fontSize: '1.75rem', flexShrink: 0, marginTop: '-0.25rem' }}>
            {getPreviewType() === 'pdf' ? '📄' : getPreviewType() === 'image' ? '🖼️' : getPreviewType() === 'video' ? '🎬' : getPreviewType() === 'audio' ? '🎵' : '📁'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="truncate" style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: '1.3', marginBottom: '0.375rem' }}>{resource.title}</p>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              <span className="badge badge-type">{resource.type}</span>
              {resource.subjectType && (
                <span className={`badge ${resource.subjectType === 'lab' ? 'badge-lab' : 'badge-theory'}`}>
                  {resource.subjectType}
                </span>
              )}
              {resource.endDate && (
                <span className="badge" style={{ background: urgencyClass === 'urgency-high' ? 'var(--danger-bg)' : 'var(--warning-bg)', color: urgencyClass === 'urgency-high' ? 'var(--danger)' : 'var(--warning)' }}>
                  ⏰ {new Date(resource.endDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle section: Uploader and Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
          <span className="text-muted" style={{ whiteSpace: 'nowrap' }}>{new Date(resource.createdAt).toLocaleDateString()}</span>
          <span className="text-muted" style={{ textAlign: 'right', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>By {resource.uploaderName || 'Faculty'}</span>
        </div>

        {/* Bottom section: Action Buttons */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', minWidth: 0, paddingBottom: '0.25rem', maxWidth: '100%' }}>
          <button className="btn btn-sm btn-outline" onClick={handleView} title="View" style={{ flexShrink: 0, padding: '0.375rem 0.75rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>View</span>
          </button>
          <button className="btn btn-sm btn-outline" onClick={handleDownload} title="Download" style={{ flexShrink: 0, padding: '0.375rem 0.75rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>Save</span>
          </button>
          <button className="btn btn-sm" onClick={handleShare} style={{ background: '#25D366', color: '#fff', padding: '0.375rem 0.5rem', flexShrink: 0 }} title="WhatsApp">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </button>
          <button className="btn btn-sm" onClick={handleReport} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.375rem 0.5rem', flexShrink: 0 }} title="Report">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          </button>
          <button className="btn-ghost" onClick={toggleBookmark} title="Bookmark" style={{ padding: '0.375rem', marginLeft: '0.25rem', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? '#eab308' : 'none'} stroke={isBookmarked ? '#eab308' : 'var(--text-muted)'} strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        </div>
      </div>
      )}

      {/* ---- Full-Screen Preview Modal ---- */}
      {showPreview && createPortal(
        <div className="preview-overlay" onClick={closePreview}>
          <div className="preview-container" onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: color || 'var(--accent-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                }}>
                  {getPreviewType() === 'pdf' ? '📄' :
                   getPreviewType() === 'image' ? '🖼️' :
                   getPreviewType() === 'video' ? '🎬' :
                   getPreviewType() === 'audio' ? '🎵' : '📁'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 className="truncate" style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>{resource.title}</h3>
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                    <span className="badge badge-type" style={{ fontSize: '0.65rem' }}>{resource.type}</span>
                    <span className="text-xs text-muted">by {resource.uploaderName}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {/* Download from preview */}
                <button className="btn btn-sm btn-primary" onClick={handleDownload} title="Download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                {/* Close */}
                <button className="btn btn-sm" onClick={closePreview}
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.375rem 0.5rem' }}
                  title="Close preview">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="preview-body">
              {renderPreviewContent()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ResourceCard;
