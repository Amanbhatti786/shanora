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

export default function MyProfileTab({ profile, setShowEditProfileModal, navigateToTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>👤 My Profile</span>
        <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
      </div>

      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.8rem',
              color: '#fff',
              border: '2px solid #38bdf8',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (profile.full_name || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{profile.full_name}</span>
                {profile.is_pro && <ProVerifiedBadge size={20} />}
                {profile.is_ambassador && <span title="Shanora Ambassador" style={{ color: '#facc15', fontSize: '1rem' }}>🌟</span>}
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: '600', marginTop: '0.15rem' }}>
                {profile.headline || 'Member on Shanora.pk'}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{profile.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEditProfileModal(true)}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ✏️ Edit Profile
          </button>
        </div>

        {profile.bio && (
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '10px', padding: '0.8rem', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '1rem' }}>
            {profile.bio}
          </div>
        )}

        {profile.skills && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Skills & Expertise
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {profile.skills.split(',').map((s, idx) => (
                <span key={idx} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
          <div>📞 <strong style={{ color: '#fff' }}>WhatsApp / Phone:</strong> {profile.phone || 'Not provided'}</div>
          <div>📍 <strong style={{ color: '#fff' }}>City / Location:</strong> {profile.city || 'Pakistan'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📄 <strong style={{ color: '#fff' }}>Linked CV / Resume:</strong>
            {profile.resume_url ? (
              <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold' }}>
                View Linked CV 🔗
              </a>
            ) : (
              <span style={{ color: '#64748b' }}>No CV attached yet</span>
            )}
          </div>
          <div>👑 <strong style={{ color: '#fff' }}>Account Status:</strong> {profile.is_pro ? <span style={{ color: '#facc15', fontWeight: '800' }}>Shanora PRO (Verified ✓)</span> : 'Standard Member'}</div>
        </div>
      </div>
    </div>
  );
}
