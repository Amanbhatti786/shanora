'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [isForgotMode, setIsForgotMode] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Sign In / Sign Up
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (activeTab === 'signup') {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { full_name: fullName.trim() }
          }
        });

        if (authError) throw authError;

        if (authData?.user) {
          const username = cleanEmail.split('@')[0];
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: cleanEmail,
            name: fullName.trim(),
            username: username
          });
        }

        router.push('/feed');
      } else {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (signInError) throw signInError;

        router.push('/feed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Forgot Password Reset Link
  async function handleForgotPassword(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your registered email address.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });

      if (error) throw error;

      setSuccessMsg('Password reset link has been sent to your email! 📩');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070b14',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1.5rem 1rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#f8fafc'
    }}>

      {/* Official Header with Logo & PK small on top-right */}
      <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 0 18px rgba(2, 132, 199, 0.4)'
          }}>
            🎓
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>
            SHANORA<span style={{
              fontSize: '0.65rem',
              fontWeight: '800',
              color: '#38bdf8',
              verticalAlign: 'super',
              marginLeft: '3px',
              letterSpacing: '0.5px'
            }}>.PK</span>
          </span>
        </Link>
      </div>

      {/* Main Form Card */}
      <div style={{
        width: '100%',
        maxWidth: '410px',
        backgroundColor: '#0b1322',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '1.8rem 1.6rem',
        boxSizing: 'border-box',
        boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.6)'
      }}>

        {!isForgotMode ? (
          <>
            {/* Top Switcher: Sign In vs Sign Up (Consistent Position) */}
            <div style={{
              display: 'flex',
              backgroundColor: '#111c30',
              padding: '0.25rem',
              borderRadius: '10px',
              border: '1px solid #1e293b',
              marginBottom: '1.4rem'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'signin' ? '#0284c7' : 'transparent',
                  color: activeTab === 'signin' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'signup' ? '#0284c7' : 'transparent',
                  color: activeTab === 'signup' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Title & Subtitle */}
            <div style={{ marginBottom: '1.3rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#f8fafc' }}>
                {activeTab === 'signin' ? 'Welcome Back 👋' : 'Join Shanora 🚀'}
              </h2>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                {activeTab === 'signin'
                  ? 'Enter your credentials to access your portal'
                  : 'Create your account to start networking'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {errorMsg && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.4rem',
                alignItems: 'center'
              }}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>

              {activeTab === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Muhammad Ali"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#e2e8f0',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.85rem',
                      color: '#0f172a',
                      fontWeight: '500',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#e2e8f0',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    fontWeight: '500',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1' }}>
                    Password
                  </label>
                  {activeTab === 'signin' && (
                    <span
                      onClick={() => { setIsForgotMode(true); setErrorMsg(''); setSuccessMsg(''); }}
                      style={{ fontSize: '0.72rem', color: '#38bdf8', cursor: 'pointer', fontWeight: '700' }}
                    >
                      Forgot Password?
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#e2e8f0',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.65rem 2.4rem 0.65rem 0.85rem',
                      fontSize: '0.85rem',
                      color: '#0f172a',
                      fontWeight: '500',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: '0.2rem'
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.3rem', display: 'block' }}>
                  Minimum 6 characters
                </span>
              </div>

              {/* Main Action Button (Identical Spot & Style) */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.7rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginTop: '0.5rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  transition: 'background 0.15s ease'
                }}
              >
                {loading ? 'Processing...' : (activeTab === 'signin' ? 'Sign In' : 'Sign Up')}
              </button>
            </form>
          </>
        ) : (
          /* Forgot Password View */
          <div>
            <div style={{ marginBottom: '1.3rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc' }}>
                Reset Password 🔑
              </h2>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Enter your registered email to receive a password reset link.
              </p>
            </div>

            {errorMsg && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '1rem'
              }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#86efac',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '1rem'
              }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#e2e8f0',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    fontWeight: '500',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.7rem',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => { setIsForgotMode(false); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  width: '100%',
                  background: 'none',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ← Back to Sign In
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
