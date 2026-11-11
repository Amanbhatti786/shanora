'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    dob: '',
    country: 'Pakistan',
    accountType: 'Professional',
    agreeTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const countriesList = [
    'Pakistan', 'United States', 'United Kingdom', 'Canada', 'United Arab Emirates', 
    'Saudi Arabia', 'Australia', 'Germany', 'France', 'Other'
  ];

  const accountTypes = [
    'Job Seeker', 'Student', 'Employer / Recruiter', 'Company', 'Freelancer', 'Professional'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const cleanEmail = formData.email.trim().toLowerCase();

      if (isSignup) {
        if (!formData.agreeTerms) {
          setErrorMessage('You must agree to the Terms & Conditions and Privacy Policy.');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        // 1. Check unique username
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', formData.username.trim())
          .maybeSingle();

        if (existingUser) {
          setErrorMessage('Username is already taken. Please choose another.');
          setLoading(false);
          return;
        }

        // 2. Supabase Signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              full_name: `${formData.firstName} ${formData.lastName}`,
              username: formData.username.trim(),
              account_type: formData.accountType
            }
          }
        });

        if (authError) throw authError;

        // 3. Upsert into profiles table
        await supabase
          .from('profiles')
          .upsert({
            email: cleanEmail,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: `${formData.firstName} ${formData.lastName}`,
            username: formData.username.trim().toLowerCase(),
            country: formData.country,
            account_type: formData.accountType,
            date_of_birth: formData.dob || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });

        alert('Registration successful! Please check your email for verification link.');
        router.push('/profile?tab=profile');

      } else {
        // Sign In Flow
        const { error: signinError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: formData.password
        });

        if (signinError) throw signinError;

        router.push('/feed');
      }

    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile?tab=profile`
        }
      });
      if (error) throw error;
    } catch (err) {
      setErrorMessage('Google Authentication error: ' + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0b1322', border: '1px solid #1e293b', padding: '0.4rem 1rem', borderRadius: '12px', marginBottom: '0.8rem' }}>
            <span style={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem', background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '2px 8px', borderRadius: '6px' }}>S</span>
            <span style={{ fontWeight: '900', fontSize: '1.25rem', color: '#fff' }}>SHANORA<span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>.PK</span></span>
          </Link>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            {isSignup ? 'Join the Professional Network' : 'Welcome Back to SHANORA'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.3rem' }}>
            {isSignup ? 'Build your career, connect with employers, and grow.' : 'Sign in to access your professional feed and messages.'}
          </p>
        </div>

        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.7rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}
        >
          <span>🌐</span> Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748b', fontSize: '0.75rem', marginBottom: '1.2rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1e293b' }} />
          <span>OR WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1e293b' }} />
        </div>

        {/* Main Auth Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {isSignup && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>First Name *</label>
                  <input type="text" name="firstName" placeholder="Aman" value={formData.firstName} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Last Name *</label>
                  <input type="text" name="lastName" placeholder="Ullah" value={formData.lastName} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Username (@username) *</label>
                <input type="text" name="username" placeholder="amanullah_pk" value={formData.username} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Email Address *</label>
            <input type="email" name="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Password *</label>
              {!isSignup && (
                <Link href="/auth/forgot-password" style={{ fontSize: '0.72rem', color: '#38bdf8', textDecoration: 'none' }}>
                  Forgot Password?
                </Link>
              )}
            </div>
            <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {isSignup && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Country</label>
                  <select name="country" value={formData.country} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                    {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Account Type</label>
                <select name="accountType" value={formData.accountType} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                  {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.4rem' }}>
                <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} id="terms" style={{ marginTop: '2px', accentColor: '#0284c7', cursor: 'pointer' }} />
                <label htmlFor="terms" style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: '1.35', cursor: 'pointer' }}>
                  I agree to SHANORA's <Link href="/terms" style={{ color: '#38bdf8' }}>Terms & Conditions</Link> and <Link href="/privacy" style={{ color: '#38bdf8' }}>Privacy Policy</Link>.
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.6rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}
          >
            {loading ? (isSignup ? 'Creating Account...' : 'Signing In...') : (isSignup ? 'Create Account 🚀' : 'Sign In ➔')}
          </button>
        </form>

        {/* Toggle between Sign In and Sign Up */}
        <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          {isSignup ? (
            <>Already have an account? <button type="button" onClick={() => setIsSignup(false)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}>Sign In</button></>
          ) : (
            <>New to SHANORA? <button type="button" onClick={() => setIsSignup(true)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}>Join Free</button></>
          )}
        </div>

      </div>
    </div>
  );
}
