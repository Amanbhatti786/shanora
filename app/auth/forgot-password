'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      setMessage('Password reset link sent successfully! Please check your email inbox.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', margin: 0 }}>Reset Your Password</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.3rem' }}>Enter your email address and we'll send you a recovery link.</p>
        </div>

        {message && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Email Address *</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', marginTop: '0.3rem' }} 
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}
          >
            {loading ? 'Sending Link...' : 'Send Reset Link ➔'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          Remembered your password? <Link href="/auth" style={{ color: '#38bdf8', fontWeight: 'bold', textDecoration: 'none' }}>Sign In</Link>
        </div>

      </div>
    </div>
  );
}
