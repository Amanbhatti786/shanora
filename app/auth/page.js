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

  // ----- 10 FIVERR-STYLE SLIDESHOW CARDS (Single -> Group -> Single -> Group) -----
  const slideshowItems = [
    // 1. Single
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Trending',
      tagTitle: 'UI/UX & Web Design',
      personName: 'Ayesha K.',
      personRole: 'Product designer',
      cardBg: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
      frameBg: '#10b981',
      messages: [
        { initial: 'A', text: 'Wireframes & design system ready', status: 'Sent' },
        { initial: 'S', text: 'Client review approved today', status: 'Live' },
        { initial: 'N', text: 'Next sprint brief shared', status: 'Sent' }
      ]
    },
    // 2. Group
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Team Hub',
      tagTitle: 'Product Squad',
      personName: 'Karachi & Lahore Team',
      personRole: 'Collaborative workspace',
      cardBg: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
      frameBg: '#3b82f6',
      messages: [
        { initial: 'M', text: 'Sprint roadmap synced with team', status: 'Sent' },
        { initial: 'Z', text: 'QA checklist completed', status: 'Done' },
        { initial: 'R', text: 'Release notes published', status: 'Live' }
      ]
    },
    // 3. Single
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Featured',
      tagTitle: 'Career & ATS CVs',
      personName: 'Hina R.',
      personRole: 'Career & resume advisor',
      cardBg: 'linear-gradient(135deg, #4c1d95 0%, #0f172a 100%)',
      frameBg: '#8b5cf6',
      messages: [
        { initial: 'H', text: 'ATS resume audit completed', status: 'Sent' },
        { initial: 'K', text: 'Interview prep notes shared', status: 'Live' },
        { initial: 'F', text: 'Portfolio feedback delivered', status: 'Sent' }
      ]
    },
    // 4. Group
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Hiring',
      tagTitle: 'Talent & Ops',
      personName: 'Hiring & Ops Group',
      personRole: 'Global recruitment team',
      cardBg: 'linear-gradient(135deg, #78350f 0%, #0f172a 100%)',
      frameBg: '#f59e0b',
      messages: [
        { initial: 'T', text: 'Shortlisted candidates messaged', status: 'Sent' },
        { initial: 'O', text: 'Remote roles open now', status: 'Live' },
        { initial: 'D', text: 'Offer letter draft ready', status: 'Sent' }
      ]
    },
    // 5. Single
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Specialist',
      tagTitle: 'Full-Stack Web',
      personName: 'Zainab M.',
      personRole: 'Next.js & cloud builder',
      cardBg: 'linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)',
      frameBg: '#0ea5e9',
      messages: [
        { initial: 'Z', text: 'API & auth flow deployed', status: 'Sent' },
        { initial: 'U', text: 'Database schema verified', status: 'Done' },
        { initial: 'P', text: 'Live preview link sent', status: 'Live' }
      ]
    },
    // 6. Group
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Strategy',
      tagTitle: 'Growth & Scale',
      personName: 'Growth & Strategy Team',
      personRole: 'Partnerships & outreach',
      cardBg: 'linear-gradient(135deg, #134e4a 0%, #0f172a 100%)',
      frameBg: '#14b8a6',
      messages: [
        { initial: 'G', text: 'Partner outreach deck shared', status: 'Sent' },
        { initial: 'B', text: 'Weekly KPIs reviewed', status: 'Live' },
        { initial: 'C', text: 'Campaign slots confirmed', status: 'Sent' }
      ]
    },
    // 7. Single
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Top Rated',
      tagTitle: 'Client Growth',
      personName: 'Bilal A.',
      personRole: 'Growth & outreach lead',
      cardBg: 'linear-gradient(135deg, #1e293b 0%, #090d16 100%)',
      frameBg: '#38bdf8',
      messages: [
        { initial: 'B', text: 'Lead pipeline updated', status: 'Sent' },
        { initial: 'M', text: 'Proposal sent to client', status: 'Live' },
        { initial: 'A', text: 'Discovery call booked', status: 'Sent' }
      ]
    },
    // 8. Group
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Enterprise',
      tagTitle: 'Client Onboarding',
      personName: 'Advisory & Success Team',
      personRole: 'Client delivery circle',
      cardBg: 'linear-gradient(135deg, #4a1d1f 0%, #0f172a 100%)',
      frameBg: '#f97316',
      messages: [
        { initial: 'E', text: 'Onboarding kit delivered', status: 'Sent' },
        { initial: 'S', text: 'Milestone 1 approved', status: 'Done' },
        { initial: 'W', text: 'Weekly sync scheduled', status: 'Live' }
      ]
    },
    // 9. Single
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Creative',
      tagTitle: 'Brand & Visuals',
      personName: 'Sana T.',
      personRole: 'Visual & brand creator',
      cardBg: 'linear-gradient(135deg, #500724 0%, #0f172a 100%)',
      frameBg: '#ec4899',
      messages: [
        { initial: 'S', text: 'Brand kit & assets ready', status: 'Sent' },
        { initial: 'L', text: 'Social campaign templates', status: 'Live' },
        { initial: 'V', text: 'High-res exports shared', status: 'Sent' }
      ]
    },
    // 10. Group
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80',
      tagLabel: 'Community',
      tagTitle: 'SHANORA Network',
      personName: 'SHANORA Professionals',
      personRole: 'Creators, teams & employers',
      cardBg: 'linear-gradient(135deg, #172554 0%, #0f172a 100%)',
      frameBg: '#60a5fa',
      messages: [
        { initial: 'P', text: 'New job & collab alerts', status: 'Sent' },
        { initial: 'C', text: 'Verified creators active', status: 'Live' },
        { initial: 'G', text: 'Grow across Pakistan & beyond', status: 'Sent' }
      ]
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Check if user is already logged in and redirect to feed
  useEffect(() => {
    async function checkExistingSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/feed');
      }
    }
    checkExistingSession();
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slideshowItems.length]);

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

  const activeItem = slideshowItems[currentSlide];

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
        maxWidth: '1060px',
        width: '100%',
        gap: '40px',
        alignItems: 'center'
      }}>

        {/* Left Column: Brand & Fiverr-Style Layered Showcase Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
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

          <h1 style={{ fontSize: '29px', fontWeight: '800', lineHeight: '1.2', margin: 0, letterSpacing: '-0.5px' }}>
            Explore the professional connections you love.
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
            "Professional growth within your reach" — Connect with creators and global employers across Pakistan.
          </p>

          {/* Fiverr-Inspired Rich Showcase Card */}
          <div style={{
            position: 'relative',
            width: '100%',
            minHeight: '305px',
            borderRadius: '20px',
            background: activeItem.cardBg,
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 22px 48px rgba(0,0,0,0.65)',
            padding: '18px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'background 0.6s ease'
          }}>
            {/* Top Row: Tag Box + Type Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', zIndex: 2 }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '12px',
                padding: '8px 12px',
                maxWidth: '150px'
              }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: '2px' }}>
                  {activeItem.tagLabel}
                </div>
                <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: '800', lineHeight: 1.2 }}>
                  {activeItem.tagTitle}
                </div>
              </div>

              <span style={{
                backgroundColor: 'rgba(7, 11, 20, 0.55)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#f8fafc',
                fontSize: '10px',
                fontWeight: '700',
                padding: '4px 9px',
                borderRadius: '999px'
              }}>
                {activeItem.type} • {currentSlide + 1}/10
              </span>
            </div>

            {/* Middle/Bottom Showcase Row: Portrait Card + Floating Message Stack */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '132px 1fr',
              gap: '12px',
              alignItems: 'end',
              marginTop: '14px',
              zIndex: 2
            }}>
              {/* Portrait Frame with Safe Face Framing */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{
                  width: '132px',
                  height: '152px',
                  borderRadius: '14px',
                  backgroundColor: activeItem.frameBg,
                  border: '2px solid rgba(255,255,255,0.22)',
                  overflow: 'hidden',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.45)',
                  position: 'relative'
                }}>
                  {slideshowItems.map((item, idx) => (
                    <img
                      key={idx}
                      src={item.url}
                      alt={item.personName}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: '50% 18%',
                        opacity: currentSlide === idx ? 1 : 0,
                        transition: 'opacity 0.6s ease-in-out'
                      }}
                    />
                  ))}
                </div>

                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                    {activeItem.personName} ★ 4.9
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>
                    {activeItem.personRole}
                  </div>
                </div>
              </div>

              {/* Fiverr-Style Floating Message Box Stack */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                color: '#0f172a',
                borderRadius: '14px',
                padding: '10px',
                boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
                display: 'flex',
                flexDirection: 'column',
                gap: '7px'
              }}>
                {activeItem.messages.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '6px 8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                      <span style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {msg.initial}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {msg.text}
                      </span>
                    </div>

                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '9px',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      flexShrink: 0
                    }}>
                      {msg.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Slide Dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingLeft: '2px' }}>
            {slideshowItems.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: currentSlide === idx ? '22px' : '7px',
                  height: '7px',
                  borderRadius: '999px',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  backgroundColor: currentSlide === idx ? '#38bdf8' : '#334155',
                  transition: 'all 0.25s ease'
                }}
              />
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

          {/* Google OAuth Button with Official SVG Icon */}
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
              gap: '10px',
              marginBottom: '16px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.23 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.4l4.09-3.16z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.68 1.18 6.6l4.09 3.16c.95-2.85 3.6-4.96 6.73-4.96z" />
            </svg>
            Continue with Google
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
                    {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
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
