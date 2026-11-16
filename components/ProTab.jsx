'use client';

import React from 'react';

export default function ProTab({ profile, latestProRequest, paymentMethod, setPaymentMethod, trxId, setTrxId, submittingPro, handleProActivation, navigateToTab }) {
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
          </div>
        ) : latestProRequest?.status === 'pending' ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #facc15', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>⏳</span>
              <strong style={{ color: '#facc15', fontSize: '0.95rem' }}>Verification in Progress</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
              Your payment request (TID: <strong style={{ color: '#fff' }}>{latestProRequest.transaction_id}</strong>) is currently being reviewed.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>Monthly Subscription:</span>
                <span style={{ color: '#facc15', fontWeight: '900', fontSize: '1.1rem' }}>Rs. 499 / mo</span>
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
                    <option value="Raast">Raast / Bank</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter Transaction ID (TID)"
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
                  {submittingPro ? 'Submitting Request...' : 'Upgrade Now & Submit TID 👑'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
                   }
            
