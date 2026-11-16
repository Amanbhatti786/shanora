'use client';

import React from 'react';

export default function InviteModal({ showInviteModal, setShowInviteModal, referralLink, copiedLink, handleCopyInviteLink, handleShare, referralCount, referralMilestones, claimingMilestone, handleClaimMilestone }) {
  if (!showInviteModal) return null;

  return (
    <div 
      onClick={() => setShowInviteModal(false)}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '1.2rem 1.2rem 3.5rem 1.2rem', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
          <div style={{ fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <span>👥</span> Invite Friends & Earn Rewards
          </div>
          <button type="button" onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem' }}>✕</button>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '12px', marginTop: '0.9rem', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>Your Unique Referral Link:</div>
          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={referralLink}
              style={{ flex: 1, minWidth: 0, backgroundColor: '#0b1322', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.65rem', color: '#38bdf8', fontSize: '0.76rem', outline: 'none' }}
            />
            <button
              type="button"
              onClick={handleCopyInviteLink}
              style={{ backgroundColor: copiedLink ? '#22c55e' : '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}
            >
              {copiedLink ? 'Copied! ✓' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '0.9rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.5rem' }}>Share Directly Via:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.45rem' }}>
            <button type="button" onClick={() => handleShare('whatsapp')} style={{ backgroundColor: '#15803d', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}>🟢 WhatsApp</button>
            <button type="button" onClick={() => handleShare('facebook')} style={{ backgroundColor: '#1d4ed8', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}>🔵 Facebook</button>
            <button type="button" onClick={() => handleShare('messenger')} style={{ backgroundColor: '#0369a1', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}>💬 Messenger</button>
            <button type="button" onClick={() => handleShare('email')} style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}>✉️ Email</button>
            <button type="button" onClick={() => handleShare('sms')} style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}>📱 SMS</button>
            <button type="button" onClick={() => handleShare('native')} style={{ backgroundColor: '#0284c7', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}>📲 Share</button>
          </div>
        </div>

        <div style={{ backgroundColor: '#131e33', border: '1px solid #0284c7', borderRadius: '12px', padding: '0.85rem', marginTop: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>Total Genuine Invites:</span>
            <span style={{ fontSize: '0.92rem', fontWeight: '900', color: '#38bdf8' }}>{referralCount} Friends Joined 👥</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#070b14', borderRadius: '4px', overflow: 'hidden', margin: '0.55rem 0 0.35rem 0' }}>
            <div style={{
              width: `${Math.min(100, Math.round((referralCount / 100) * 100))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0284c7 0%, #22c55e 100%)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8', marginBottom: '0.65rem' }}>
            🏆 Referral Achievements & Rewards
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {referralMilestones.map((tier) => {
              const isCompleted = referralCount >= tier.minFriends;
              const isClaiming = claimingMilestone === tier.minFriends;

              return (
                <div 
                  key={tier.minFriends} 
                  style={{ 
                    backgroundColor: '#1e293b', 
                    padding: '0.7rem 0.85rem', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderLeft: `4px solid ${tier.color}`,
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>{tier.goal}</div>
                    <div style={{ fontSize: '0.72rem', color: tier.color, fontWeight: '700', marginTop: '0.1rem' }}>{tier.reward}</div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {isCompleted ? (
                      <button
                        type="button"
                        disabled={isClaiming}
                        onClick={() => handleClaimMilestone(tier)}
                        style={{
                          backgroundColor: '#22c55e',
                          color: '#000',
                          border: 'none',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        {isClaiming ? 'Applying...' : 'Claim Reward 🎁'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 'bold' }}>
                        {referralCount} / {tier.minFriends} 🎯
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
