'use client';

import React from 'react';

export default function DashboardTab({ profile, myPostsCount, navigateToTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>📊 Creator Dashboard</span>
        <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
      </div>

      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.3rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0.45rem 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>{profile.full_name}</span>
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Total Posts Created: <strong style={{ color: '#38bdf8' }}>{myPostsCount}</strong></p>
      </div>
    </div>
  );
}

