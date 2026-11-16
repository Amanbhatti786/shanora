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

export default function ProTab({ profile, latestProRequest, paymentMethod, setPaymentMethod, trxId, setTrxId, submittingPro, handleProActivation, navigateToTab }) {
  
  // Lemon Squeezy Card Checkout URL provided by user
  const LEMON_SQUEEZY_PRO_URL = 'https://shanora-online.lemonsqueezy.com/checkout/buy/8244b035-c39a-41a1-8b05-5db9f457ba47';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#facc15' }}>👑 Shanora PRO</span>
        <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        borderRadius: '16px',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👑</div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#facc15', margin: '0 0 0.3rem 0' }}>Shanora PRO</h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>Unlock the prestigious verified badge and premium career features.</p>

        {profile.is_pro ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #22c55e', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <span style={{ backgroundColor: '#22c55e', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>✓</span>
              <strong style={{ color: '#4ade80', fontSize: '1rem' }}>Your Shanora PRO Membership is ACTIVE!</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
              <div>✓ <strong>Executive Verified Badge:</strong> Cyan-Blue starburst badge is active across your profile and posts.</div>
              <div>✓ <strong>ATS Resume Builder:</strong> Unlimited professional CV generation & PDF download unlocked.</div>
              <div>✓ <strong>Application Boost:</strong> Featured placement on employer applicant portals.</div>
              <div>✓ <strong>Feed Reach:</strong> 5x higher reach on your published articles and updates.</div>
            </div>
          </div>
        ) : latestProRequest?.status === 'pending' ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #facc15', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>⏳</span>
              <strong style={{ color: '#facc15', fontSize: '0.95rem' }}>Verification in Progress</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
              Your payment request (TID/Order ID: <strong style={{ color: '#fff' }}>{latestProRequest.transaction_id}</strong>) is currently being reviewed. The verified badge will be enabled immediately after review.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', marginBottom: '0.6rem' }}>Exclusive PRO Perks:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
              <div>✓ <strong>Official Verified Badge:</strong> Stand out with a glowing cyan-blue executive badge.</div>
              <div>✓ <strong>ATS Resume Builder:</strong> Build & Export ATS-Friendly CV in 1-Click.</div>
              <div>✓ <strong>Priority Job Application:</strong> Featured at the top for hiring managers.</div>
              <div>✓ <strong>Direct Messenger:</strong> Connect with verified creators and businesses.</div>
              <div>✓ <strong>Profile Boost:</strong> Enhanced organic reach on all publications.</div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>Monthly Subscription:</span>
                <span style={{ color: '#facc15', fontWeight: '900', fontSize: '1.1rem' }}>Rs. 250 / mo</span>
              </div>

              {/* CARD PAYMENT BUTTON VIA LEMON SQUEEZY */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '700' }}>Option 1: Pay Securely with Card (Visa / Mastercard)</div>
                <a
                  href={LEMON_SQUEEZY_PRO_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    textAlign: 'center',
                    textDecoration: 'none',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <span>Pay Rs. 199 with Card via Lemon Squeezy ↗</span>
                </a>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                <strong>Option 2: Local Payment Procedure (JazzCash / EasyPaisa):</strong><br />
                1. Transfer <strong>Rs. 199</strong> via EasyPaisa / JazzCash to: <code>03033639664</code><br />
                2. Account Title: <code>Amanullah</code><br />
                3. Enter Transaction ID (TID) or Card Order ID below and click submit.
              </div>

              <form onSubmit={handleProActivation} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  >
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="LemonSqueezy">Lemon Squeezy (Card)</option>
                    <option value="Raast">Raast / Bank</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter TID / Order ID"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingPro}
                  style={{ backgroundColor: '#eab308', color: '#000', border: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', cursor: submittingPro ? 'not-allowed' : 'pointer' }}
                >
                  {submittingPro ? 'Submitting Request...' : 'Upgrade Now & Submit Payment Proof 👑'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
                            }
