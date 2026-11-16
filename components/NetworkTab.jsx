'use client';

import React, { useState } from 'react';

export default function NetworkTab({ followersList, followingList, discoverUsers, followingMap, actionLoading, handleToggleFollow, navigateToTab }) {
  const [networkSubTab, setNetworkSubTab] = useState('followers');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>👥 Network & Connections</span>
        <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#0f172a', padding: '0.35rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <button
          type="button"
          onClick={() => setNetworkSubTab('followers')}
          style={{ flex: 1, backgroundColor: networkSubTab === 'followers' ? '#0284c7' : 'transparent', color: networkSubTab === 'followers' ? '#fff' : '#94a3b8', border: 'none', padding: '0.5rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Followers ({followersList.length})
        </button>
        <button
          type="button"
          onClick={() => setNetworkSubTab('following')}
          style={{ flex: 1, backgroundColor: networkSubTab === 'following' ? '#0284c7' : 'transparent', color: networkSubTab === 'following' ? '#fff' : '#94a3b8', border: 'none', padding: '0.5rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Following ({followingList.length})
        </button>
        <button
          type="button"
          onClick={() => setNetworkSubTab('discover')}
          style={{ flex: 1, backgroundColor: networkSubTab === 'discover' ? '#0284c7' : 'transparent', color: networkSubTab === 'discover' ? '#fff' : '#94a3b8', border: 'none', padding: '0.5rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Discover 🔍
        </button>
      </div>

      {networkSubTab === 'followers' && (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#fff', fontWeight: '800' }}>Your Followers</h3>
          {followersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>No followers yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {followersList.map(person => {
                const targetEmail = person.email || person.user_email;
                const isFollowingBack = !!followingMap[targetEmail?.toLowerCase()];
                const isLoading = actionLoading[targetEmail?.toLowerCase()];

                return (
                  <div key={person.id || targetEmail} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1rem', overflow: 'hidden', flexShrink: 0 }}>
                        {person.avatarUrl ? <img src={person.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (person.displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.displayName}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{person.username || targetEmail?.split('@')[0]}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleFollow(targetEmail)}
                      style={{
                        backgroundColor: isFollowingBack ? 'transparent' : '#0284c7',
                        border: isFollowingBack ? '1px solid #334155' : 'none',
                        color: isFollowingBack ? '#94a3b8' : '#fff',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isLoading ? '...' : isFollowingBack ? 'Following' : 'Follow Back'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {networkSubTab === 'following' && (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#fff', fontWeight: '800' }}>People You Follow</h3>
          {followingList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>You are not following anyone yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {followingList.map(person => {
                const targetEmail = person.email || person.user_email;
                const isLoading = actionLoading[targetEmail?.toLowerCase()];

                return (
                  <div key={person.id || targetEmail} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1rem', overflow: 'hidden', flexShrink: 0 }}>
                        {person.avatarUrl ? <img src={person.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (person.displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.displayName}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{person.username || targetEmail?.split('@')[0]}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleFollow(targetEmail)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #334155',
                        color: '#ef4444',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isLoading ? '...' : 'Unfollow'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {networkSubTab === 'discover' && (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#fff', fontWeight: '800' }}>Discover Professionals</h3>
          {discoverUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>No new users to discover right now.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {discoverUsers.map(userObj => {
                const targetEmail = userObj.email;
                const isLoading = actionLoading[targetEmail?.toLowerCase()];

                return (
                  <div key={userObj.id || targetEmail} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1rem', overflow: 'hidden', flexShrink: 0 }}>
                        {userObj.avatar_url ? <img src={userObj.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userObj.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userObj.full_name || userObj.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userObj.headline || 'Professional Member'}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleFollow(targetEmail)}
                      style={{
                        backgroundColor: '#0284c7',
                        border: 'none',
                        color: '#fff',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isLoading ? '...' : '+ Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
                         }
