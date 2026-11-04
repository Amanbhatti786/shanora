'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password update states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    async function getUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        setCurrentUser(session.user);
      } catch (err) {
        console.error('Session error:', err);
      } finally {
        setLoading(false);
      }
    }
    getUserSession();
  }, [router]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: 'Password updated successfully! 🔒' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading security settings...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      <header style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '640px', margin: '0 auto', borderBottom: '1px solid #1e293b' }}>
        <button
          onClick={() => router.back()}
          style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#cbd5e1', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ←
        </button>
        <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>Account Security</span>
        <div style={{ width: '36px' }}></div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Account Info */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>Registered Email</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{currentUser?.email}</div>
          </div>
          <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: '700' }}>
            ✓ Active
          </span>
        </div>

        {/* Change Password Form */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#fff', marginBottom: '0.9rem' }}>
            🔑 Change Password
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.55rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.55rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
            />

            {passwordMsg.text && (
              <div style={{ color: passwordMsg.type === 'success' ? '#22c55e' : '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>
                {passwordMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem', fontSize: '0.82rem', fontWeight: '700', cursor: passwordLoading ? 'wait' : 'pointer' }}
            >
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
