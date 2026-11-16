'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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

export default function NetworkTab({ followersList, followingList, followingMap, actionLoading, handleToggleFollow, setActiveChatUser, setActiveTab, navigateToTab }) {
  const [networkSubTab, setNetworkSubTab] = useState('followers');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '0.8rem' }}>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>👥 Network & Connections</span>
        <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', backgroundColor: '#0f172a', padding: '0.35rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <button
          type="button"
          onClick={() => setNetworkSubTab('followers')}
          style={{
            flex: 1,
            backgroundColor: networkSubTab === 'followers' ? '#0284c7' : 'transparent',
            color: networkSubTab === 'followers' ? '#fff' : '#94a3b8',
            border: 'none',
            padding: '0.55rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Followers ({followersList.length})
        </button>

        <button
          type="button"
          onClick={() => setNetworkSubTab('following')}
          style={{
            flex: 1,
            backgroundColor: networkSubTab === 'following' ? '#0284c7' : 'transparent',
            color: networkSubTab === 'following' ? '#fff' : '#94a3b8',
            border: 'none',
            padding: '0.55rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Following ({followingList.length})
        </button>
      </div>

      {networkSubTab === 'followers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {followersList.length === 0 ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No followers found on your profile yet.
            </div>
          ) : (
            followersList.map(item => {
              const cleanEmail = (item.user_email || item.follower_email || '').toLowerCase();
              const displayName = item.displayName || cleanEmail.split('@')[0];
              const isFollowingBack = !!followingMap[cleanEmail];

              return (
                <div key={item.id} style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '0.75rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.6rem'
                }}>
                  <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: '#fff',
                      fontSize: '1.1rem',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        <span>{displayName}</span>
                        {item.is_pro && <ProVerifiedBadge size={16} />}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        Follows you
                      </div>
                    </div>
                  </Link>

                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChatUser({
                          email: cleanEmail,
                          full_name: displayName,
                          avatar_url: item.avatarUrl,
                          last_seen: item.last_seen,
                          is_pro: item.is_pro
                        });
                        setActiveTab('messages');
                      }}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #0284c7',
                        color: '#38bdf8',
                        padding: '0.4rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span>💬</span>
                      <span>Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(cleanEmail)}
                      disabled={actionLoading[cleanEmail]}
                      style={{
                        backgroundColor: isFollowingBack ? '#1e293b' : '#0284c7',
                        color: isFollowingBack ? '#94a3b8' : '#fff',
                        border: isFollowingBack ? '1px solid #334155' : 'none',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {isFollowingBack ? 'Following' : 'Follow Back'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {networkSubTab === 'following' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {followingList.length === 0 ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              You are not following any users yet.
            </div>
          ) : (
            followingList.map(item => {
              const cleanEmail = (item.user_email || item.following_email || '').toLowerCase();
              const displayName = item.displayName || cleanEmail.split('@')[0];

              return (
                <div key={item.id} style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '0.75rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.6rem'
                }}>
                  <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: '#38bdf8',
                      fontSize: '1.1rem',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        <span>{displayName}</span>
                        {item.is_pro && <ProVerifiedBadge size={16} />}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        Following
                      </div>
                    </div>
                  </Link>

                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChatUser({
                          email: cleanEmail,
                          full_name: displayName,
                          avatar_url: item.avatarUrl,
                          last_seen: item.last_seen,
                          is_pro: item.is_pro
                        });
                        setActiveTab('messages');
                      }}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #0284c7',
                        color: '#38bdf8',
                        padding: '0.4rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span>💬</span>
                      <span>Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(cleanEmail)}
                      disabled={actionLoading[cleanEmail]}
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Unfollow
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
