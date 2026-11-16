'use client';

import React from 'react';

// Executive High-End Verified PRO Badge Component
function ProVerifiedBadge({ size = 18 }) {
  return (
    <span 
      title="Verified PRO Member" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        verticalAlign: 'middle',
        marginLeft: '4px',
        flexShrink: 0
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10.5" fill="url(#proBadgeGrad)" stroke="#38bdf8" strokeWidth="1.2" />
        <path d="M7.5 12.2L10.3 15L16.5 9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="proBadgeGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export default function DashboardTab({ profile, myPostsCount, followersList, followingList, profileCompletionPercent, navigateToTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>📊 Creator Dashboard</span>
        <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
      </div>

      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 'bold' }}>
              Creator Analytics
            </span>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0.45rem 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{profile.full_name}</span>
              {profile.is_pro && <ProVerifiedBadge size={19} />}
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
              Track your audience engagement, profile performance, and network growth.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '800',
              padding: '0.25rem 0.6rem',
              borderRadius: '8px',
              backgroundColor: profile.is_pro ? 'rgba(250, 204, 21, 0.15)' : 'rgba(148, 163, 184, 0.15)',
              color: profile.is_pro ? '#facc15' : '#94a3b8',
              border: profile.is_pro ? '1px solid rgba(250, 204, 21, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)'
            }}>
              {profile.is_pro ? 'PRO MEMBER 👑' : 'STANDARD'}
            </span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.9rem', marginTop: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Profile Strength</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: profileCompletionPercent === 100 ? '#4ade80' : '#38bdf8' }}>
              {profileCompletionPercent}%
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${profileCompletionPercent}%`, height: '100%', backgroundColor: profileCompletionPercent === 100 ? '#22c55e' : '#0284c7', transition: 'width 0.4s' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Followers 👥</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8', marginTop: '0.2rem' }}>{followersList.length}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Following 🤝</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#22c55e', marginTop: '0.2rem' }}>{followingList.length}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Feed Posts 📝</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#facc15', marginTop: '0.2rem' }}>{myPostsCount}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Reach Boost 🚀</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: profile.is_pro ? '#a855f7' : '#94a3b8', marginTop: '0.2rem' }}>
            {profile.is_pro ? '5x' : '1x'}
          </div>
        </div>
      </div>
    </div>
  );
}
