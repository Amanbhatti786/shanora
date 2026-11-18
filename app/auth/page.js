'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? true : false;

  const [isSignup, setIsSignup] = useState(initialMode);

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
  const [successMessage, setSuccessMessage] = useState('');

  // ----- AUTOMATED SLIDESHOW PHOTOS WITH YOUR PROFESSIONAL PHOTO -----
  const slideshowPhotos = [
    { 
      url: 'https://izdtmpowrcimaittuffv.supabase.co/storage/v1/object/public/page-media/Gemini_Generated_Image_wfhwuowfhwuowfhw.jpg', 
      title: 'Amanullah Mahtam - Founder & Full-Stack Developer' 
    },
    { 
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', 
      title: 'Connect & Network with Global Professionals' 
    },
    { 
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', 
      title: 'Grow Your Career & Build ATS Resumes' 
    },
    { 
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', 
      title: 'Hire Top Talent & Verified Creators' 
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowPhotos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slideshowPhotos.length]);

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
    setSuccessMessage('');
    setLoading(true);

    try {
      const cleanEmail = formData.email ? formData.email.trim().toLowerCase() : '';

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
        if (!authData.user) throw new Error('Registration failed.');

        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: cleanEmail,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: `${formData.firstName} ${formData.lastName}`,
            username: formData.username.trim().toLowerCase(),
            country: formData.country,
            account_type: formData.accountType,
            date_of_birth: formData.dob || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        setSuccessMessage('Registration successful! Redirecting...');
        setTimeout(() => { router.push('/feed'); }, 1200);

      } else {
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
        options: { redirectTo: `${window.location.origin}/feed` }
      });
      if (error) throw error;
    } catch (err) {
      setErrorMessage('Google Auth error: ' + err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070b14',
      color: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        maxWidth: '1000px',
        width: '100%',
        gap: '40px',
        alignItems: 'center'
      }}>
        
        {/* Left Column: Brand & Automated Slideshow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '20px',
              color: '#fff'
            }}>
              S
            </div>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
              SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
            </span>
          </Link>

          <h1 style={{ fontSize: '30px', fontWeight: '800', lineHeight: '1.2', margin: 0, letterSpacing: '-0.5px' }}>
            Explore the professional connections you love.
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
            "Professional growth within your reach" — Connect with creators and global employers across Pakistan.
          </p>

          {/* Slideshow Photo Box */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '260px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
          }}>
            {slideshowPhotos.map((photo, idx) => (
              <div key={idx} style={{
                position: 'absolute',
                inset: 0,
                opacity: currentSlide === idx ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                backgroundImage: `url(${photo.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '16px'
              }}>
                <div style={{
                  background: 'rgba(7, 11, 20, 0.85)',
                  backdropFilter: 'blur(6px)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#38bdf8',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  ✨ {photo.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Auth Card Form */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px', color: '#fff' }}>
            {isSignup ? 'Create a new account' : 'Sign in to SHANORA'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
            {isSignup ? 'Quick and easy registration.' : 'Welcome back! Please enter your details.'}
          </p>

          {errorMessage && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              {successMessage}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '10px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <span>🌐</span> Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '11px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span>OR EMAIL</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isSignup && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>First Name *</label>
                    <input type="text" name="firstName" placeholder="Aman" value={formData.firstName} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Last Name *</label>
                    <input type="text" name="lastName" placeholder="Ullah" value={formData.lastName} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Username *</label>
                  <input type="text" name="username" placeholder="amanullah_pk" value={formData.username} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Email Address *</label>
              <input type="email" name="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Password *</label>
                {!isSignup && (
                  <Link href="/auth/forgot-password" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}>
                    Forgot?
                  </Link>
                )}
              </div>
              <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {isSignup && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Country</label>
                    <select name="country" value={formData.country} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}>
                      {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Account Type</label>
                  <select name="accountType" value={formData.accountType} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}>
                    {accountTypes.link ? accountTypes.map(t => <option key={t} value={t}>{t}</option>) : accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                  <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} id="terms" style={{ marginTop: '2px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                  <label htmlFor="terms" style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.3', cursor: 'pointer' }}>
                    I agree to SHANORA's <Link href="/terms" style={{ color: '#38bdf8' }}>Terms</Link> and <Link href="/privacy" style={{ color: '#38bdf8' }}>Privacy Policy</Link>.
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                padding: '11px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}
            >
              {loading ? 'Please wait...' : (isSignup ? 'Create Account 🚀' : 'Sign In ➔')}
            </button>
          </form>

          {/* Toggle between Sign In / Sign Up */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
            {isSignup ? (
              <>Already have an account? <button type="button" onClick={() => setIsSignup(false)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '12px' }}>Sign In</button></>
            ) : (
              <>New to SHANORA? <button type="button" onClick={() => setIsSignup(true)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '12px' }}>Join Free</button></>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
