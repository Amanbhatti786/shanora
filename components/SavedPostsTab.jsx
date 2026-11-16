'use client';

import React from 'react';
import Link from 'next/link';

export default function SavedPostsTab({ savedPostsList, handleRemoveSavedPost, navigateToTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#c084fc' }}>🔖 Saved Posts & Bookmarks</span>
        <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
      </div>

      {savedPostsList.length === 0 ? (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>🔖</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No saved posts yet</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>Bookmark useful posts or job listings from your feed to review them here.</div>
          <Link href="/feed" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '700' }}>
            Explore Feed
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {savedPostsList.map(item => {
            const post = item.user_posts || {};
            return (
              <div key={item.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8' }}>
                      {post.user_email || 'Author'}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Saved on {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSavedPost(item.id)}
                    style={{ backgroundColor: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Remove ✕
                  </button>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.45' }}>
                  {post.content || 'Content not available or post has been removed.'}
                </div>

                {post.image_url && (
                  <img src={post.image_url} alt="Saved visual" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px' }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
