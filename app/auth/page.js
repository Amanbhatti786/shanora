'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

// Pure helper: sanitize username input (lowercase, letters/numbers/underscore only)
function sanitizeUsernameInput(rawValue) {
  if (typeof rawValue !== 'string') return '';
  return rawValue.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
}

// Pure helper: validate standard email format
function isValidEmailFormat(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Pure helper: validate username format (letters, numbers, underscore, 3-24 chars)
function isValidUsernameFormat(username) {
  if (!username || typeof username !== 'string') return false;
  return /^[a-z0-9_]{3,24}$/.test(username.trim());
}

// Pure helper: evaluate password strength for signup UX
function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: '', color: '#334155', width: '0%' };
  }
  let points = 0;
  if (password.length >= 8) points += 1;
  if (/[A-Z]/.test(password)) points += 1;
  if (/[0-9]/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (points <= 1) {
    return { score: points, label: 'Weak', color: '#ef4444', width: '33%' };
  }
  if (points <= 3) {
    return { score: points, label: 'Medium', color: '#f59e0b', width: '66%' };
  }
  return { score: points, label: 'Strong', color: '#22c55e', width: '100%' };
}

// Pure helper: map raw Supabase/auth errors into clear human-readable messages
function getFriendlyAuthError(err) {
  const rawMsg = (err?.message || '').toLowerCase();
  if (!rawMsg) return 'Authentication failed. Please check your details and try again.';
  if (rawMsg.includes('invalid login credentials') || rawMsg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please verify your credentials and try again.';
  }
  if (rawMsg.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  if (rawMsg.includes('user already registered') || rawMsg.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (rawMsg.includes('rate limit') || rawMsg.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (rawMsg.includes('network') || rawMsg.includes('fetch')) {
    return 'Network connection issue. Please check your internet and try again.';
  }
  return err.message;
}

// Direct release asset URLs for SHANORA v1.0.0
const DOWNLOAD_URLS = {
  android: 'https://github.com/Amanbhatti786/shanora/releases/download/v1.0.0/Shanora.apk',
  windows: 'https://github.com/Amanbhatti786/shanora/releases/download/v1.0.0/Shanora.sideload.msix',
  apple: 'https://github.com/Amanbhatti786/shanora/releases/download/v1.0.0/Shanora.zip'
};

// Official-style platform SVG icons
function AndroidIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.2 7.4L5.6 4.7M16.8 7.4L18.4 4.7" stroke="#4ade80" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M6.5 10.5C6.5 7.7 8.9 5.8 12 5.8C15.1 5.8 17.5 7.7 17.5 10.5H6.5Z" fill="#4ade80" />
      <circle cx="9.8" cy="8.6" r="0.95" fill="#070b14" />
      <circle cx="14.2" cy="8.6" r="0.95" fill="#070b14" />
      <rect x="6.5" y="11.5" width="11" height="7.5" rx="2" fill="#4ade80" />
      <path d="M4.2 12.2V16.8M19.8 12.2V16.8M9.5 19.2V21.5M14.5 19.2V21.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WindowsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#38bdf8" d="M3 5.4L10.5 4.3V11.3H3V5.4ZM11.5 4.2L21 2.8V11.3H11.5V4.2ZM3 12.3H10.5V19.3L3 18.2V12.3ZM11.5 12.3H21V20.8L11.5 19.4V12.3Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#e2e8f0"
        d="M16.65 12.7c-.03-2.25 1.84-3.34 1.92-3.39-1.05-1.53-2.68-1.74-3.25-1.76-1.38-.14-2.71.82-3.41.82-.71 0-1.8-.8-2.96-.78-1.52.02-2.93.89-3.71 2.25-1.59 2.75-.41 6.82 1.13 9.05.76 1.09 1.66 2.31 2.84 2.27 1.14-.05 1.57-.73 2.95-.73 1.37 0 1.77.73 2.96.71 1.22-.02 1.99-1.1 2.74-2.2.87-1.27 1.22-2.5 1.24-2.57-.03-.01-2.38-.91-2.4-3.67ZM14.42 5.95c.62-.76 1.04-1.81.93-2.86-.9.04-2 .6-2.64 1.35-.57.66-1.08 1.74-.94 2.77 1 .08 2.03-.5 2.65-1.26Z"
      />
    </svg>
  );
}

// Each step has its own distinct glass tint, border, and accent color
const HOW_IT_WORKS_STEPS = [
  {
    step: '1',
    icon: '✨',
    title: 'Join SHANORA',
    description: 'Create your free account.',
    accent: '#38bdf8',
    glassBg: 'linear-gradient(145deg, rgba(14, 165, 233, 0.16) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(56, 189, 248, 0.34)'
  },
  {
    step: '2',
    icon: '🪪',
    title: 'Build Your Profile',
    description: 'Create your professional identity.',
    accent: '#a78bfa',
    glassBg: 'linear-gradient(145deg, rgba(139, 92, 246, 0.16) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(167, 139, 250, 0.34)'
  },
  {
    step: '3',
    icon: '🌐',
    title: 'Connect Globally',
    description: 'Connect with professionals and companies.',
    accent: '#34d399',
    glassBg: 'linear-gradient(145deg, rgba(16, 185, 129, 0.16) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(52, 211, 153, 0.34)'
  },
  {
    step: '4',
    icon: '💼',
    title: 'Discover Opportunities',
    description: 'Explore jobs and career opportunities.',
    accent: '#fbbf24',
    glassBg: 'linear-gradient(145deg, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(251, 191, 36, 0.34)'
  },
  {
    step: '5',
    icon: '📄',
    title: 'CV Studio',
    description: 'Build and export job-ready resumes.',
    accent: '#22d3ee',
    glassBg: 'linear-gradient(145deg, rgba(6, 182, 212, 0.17) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(34, 211, 238, 0.36)'
  },
  {
    step: '6',
    icon: '👑',
    title: 'SHANORA PRO',
    description: 'Unlock verified badge, AI tools & PRO templates.',
    accent: '#eab308',
    glassBg: 'linear-gradient(145deg, rgba(234, 179, 8, 0.17) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(234, 179, 8, 0.38)'
  },
  {
    step: '7',
    icon: '📢',
    title: 'Ad Campaigns',
    description: 'Promote your brand, jobs, and services across feeds.',
    accent: '#f472b6',
    glassBg: 'linear-gradient(145deg, rgba(236, 72, 153, 0.16) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(244, 114, 182, 0.36)'
  },
  {
    step: '8',
    icon: '💰',
    title: 'Monetization',
    description: 'Earn rewards from reach, content, and referrals.',
    accent: '#10b981',
    glassBg: 'linear-gradient(145deg, rgba(5, 150, 105, 0.18) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.38)'
  },
  {
    step: '9',
    icon: '📈',
    title: 'Grow Together',
    description: 'Build your network and professional career.',
    accent: '#60a5fa',
    glassBg: 'linear-gradient(145deg, rgba(59, 130, 246, 0.16) 0%, rgba(15, 23, 42, 0.72) 100%)',
    borderColor: 'rgba(96, 165, 250, 0.35)'
  }
];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? true : false;
  const isAddingAccount = searchParams.get('addAccount') === '1';

  const [isSignup, setIsSignup] = useState(initialMode);
  const [appNotice, setAppNotice] = useState('');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    country: 'Pakistan',
    accountType: 'Professional',
    agreeTerms: false,
    rememberMe: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ----- 10 CLEAN SLIDESHOW ITEMS (Single -> Group -> Single -> Group) -----
  const slideshowItems = useMemo(() => [
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
      name: 'Ayesha K.',
      role: 'UI/UX Designer',
      category: 'Design',
      message: 'Ready for modern interface & brand design work.',
      status: 'Available',
      accent: '#38bdf8',
      surface: 'linear-gradient(145deg, #0b2239 0%, #0d1526 100%)',
      pos: '50% 22%'
    },
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
      name: 'Product Squad',
      role: 'Engineering & Design Team',
      category: 'Team Hub',
      message: 'Collaborating on sprints, launches, and hiring.',
      status: 'Active',
      accent: '#34d399',
      surface: 'linear-gradient(145deg, #092a27 0%, #0d1526 100%)',
      pos: '50% 25%'
    },
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80',
      name: 'Hina R.',
      role: 'Career Mentor',
      category: 'Career',
      message: 'Helping professionals refine CVs & interview prep.',
      status: 'Online',
      accent: '#a78bfa',
      surface: 'linear-gradient(145deg, #21153b 0%, #0d1526 100%)',
      pos: '50% 28%'
    },
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80',
      name: 'Hiring Desk',
      role: 'Talent & Recruitment Group',
      category: 'Opportunities',
      message: 'Connecting skilled applicants with verified roles.',
      status: 'Hiring',
      accent: '#fbbf24',
      surface: 'linear-gradient(145deg, #2e200b 0%, #0d1526 100%)',
      pos: '50% 25%'
    },
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&q=80',
      name: 'Zainab M.',
      role: 'Full-Stack Developer',
      category: 'Development',
      message: 'Building fast Next.js & cloud-backed web apps.',
      status: 'Available',
      accent: '#38bdf8',
      surface: 'linear-gradient(145deg, #0b2239 0%, #0d1526 100%)',
      pos: '50% 35%'
    },
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
      name: 'Growth Circle',
      role: 'Strategy & Partnerships',
      category: 'Growth',
      message: 'Planning campaigns & scaling client outreach.',
      status: 'Active',
      accent: '#34d399',
      surface: 'linear-gradient(145deg, #092a27 0%, #0d1526 100%)',
      pos: '50% 25%'
    },
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
      name: 'Bilal A.',
      role: 'Growth Strategist',
      category: 'Advisory',
      message: 'Focused on measurable client & market growth.',
      status: 'Online',
      accent: '#38bdf8',
      surface: 'linear-gradient(145deg, #122138 0%, #0d1526 100%)',
      pos: '50% 28%'
    },
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
      name: 'Client Success',
      role: 'Onboarding & Delivery Team',
      category: 'Enterprise',
      message: 'Smooth project kickoffs and clear milestones.',
      status: 'Active',
      accent: '#fbbf24',
      surface: 'linear-gradient(145deg, #2e200b 0%, #0d1526 100%)',
      pos: '50% 25%'
    },
    {
      type: 'Single',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
      name: 'Sana T.',
      role: 'Visual Creator',
      category: 'Creative',
      message: 'Crafting clean visuals & standout brand stories.',
      status: 'Available',
      accent: '#f472b6',
      surface: 'linear-gradient(145deg, #331126 0%, #0d1526 100%)',
      pos: '50% 25%'
    },
    {
      type: 'Group',
      url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80',
      name: 'SHANORA Network',
      role: 'Creators & Employers Hub',
      category: 'Community',
      message: 'Where ambitious talent and teams connect.',
      status: 'Live',
      accent: '#38bdf8',
      surface: 'linear-gradient(145deg, #0b2239 0%, #0d1526 100%)',
      pos: '50% 25%'
    }
  ], []);

  const [currentSlide, setCurrentSlide] = useState(0);

  // Capture browser PWA install prompt when supported
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  // Restore remembered login email on mount (non-sensitive identifier only)
  useEffect(() => {
    try {
      const savedEmail = window.localStorage.getItem('shanora_remembered_email');
      if (savedEmail && isValidEmailFormat(savedEmail)) {
        setFormData((prev) => ({ ...prev, email: savedEmail, rememberMe: true }));
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  // Check if user is already logged in and redirect to feed (unless adding another account)
  useEffect(() => {
    if (isAddingAccount) return;

    let active = true;
    async function checkExistingSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (active && session) {
          router.push('/feed');
        }
      } catch {
        // Ignore session check errors on mount
      }
    }
    checkExistingSession();
    return () => {
      active = false;
    };
  }, [router, isAddingAccount]);

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

  const passwordStrength = useMemo(
    () => evaluatePasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const nextVal =
      type === 'checkbox'
        ? checked
        : name === 'username'
        ? sanitizeUsernameInput(value)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextVal
    }));

    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
    if (errorMessage) setErrorMessage('');
  }, [errorMessage]);

  const switchAuthMode = useCallback((nextSignupMode) => {
    setIsSignup(nextSignupMode);
    setFieldErrors({});
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  const handlePlatformClick = useCallback(async (platformKey, labelName) => {
    const directUrl = (DOWNLOAD_URLS[platformKey] || '').trim();
    if (directUrl && typeof window !== 'undefined') {
      const link = document.createElement('a');
      link.href = directUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setAppNotice(`Downloading SHANORA for ${labelName}...`);
      return;
    }

    if (deferredInstallPrompt && (platformKey === 'android' || platformKey === 'windows')) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setAppNotice(`SHANORA app installed on ${labelName}.`);
          setDeferredInstallPrompt(null);
          return;
        }
      } catch {
        // Fallback to Coming Soon message
      }
    }
    setAppNotice(`SHANORA for ${labelName} — Coming Soon.`);
  }, [deferredInstallPrompt]);

  const validateFormInputs = useCallback(() => {
    const errs = {};
    const trimmedEmail = (formData.email || '').trim().toLowerCase();
    const trimmedPassword = (formData.password || '').trim();

    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!isValidEmailFormat(trimmedEmail)) {
      errs.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    if (!trimmedPassword) {
      errs.password = 'Password is required.';
    } else if (isSignup) {
      if (trimmedPassword.length < 8) {
        errs.password = 'Password must be at least 8 characters long.';
      } else if (!/[A-Z]/.test(trimmedPassword)) {
        errs.password = 'Password must include at least 1 uppercase letter.';
      } else if (!/[0-9]/.test(trimmedPassword)) {
        errs.password = 'Password must include at least 1 number.';
      }
    }

    if (isSignup) {
      const trimmedFirst = (formData.firstName || '').trim();
      const trimmedLast = (formData.lastName || '').trim();
      const cleanUser = sanitizeUsernameInput(formData.username || '');

      if (!trimmedFirst) {
        errs.firstName = 'First name is required.';
      }
      if (!trimmedLast) {
        errs.lastName = 'Last name is required.';
      }
      if (!cleanUser) {
        errs.username = 'Username is required.';
      } else if (!isValidUsernameFormat(cleanUser)) {
        errs.username = 'Use 3–24 characters: letters, numbers, or underscore only.';
      }

      const trimmedConfirm = (formData.confirmPassword || '').trim();
      if (!trimmedConfirm) {
        errs.confirmPassword = 'Please confirm your password.';
      } else if (trimmedPassword !== trimmedConfirm) {
        errs.confirmPassword = 'Passwords do not match.';
      }

      if (!formData.agreeTerms) {
        errs.agreeTerms = 'You must agree to the Terms & Conditions and Privacy Policy.';
      }
    }

    return errs;
  }, [formData, isSignup]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMessage('');
    setSuccessMessage('');

    const validationErrors = validateFormInputs();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setErrorMessage('Please fix the highlighted fields below.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanPassword = formData.password.trim();

      if (isSignup) {
        const cleanFirstName = formData.firstName.trim();
        const cleanLastName = formData.lastName.trim();
        const cleanUsername = sanitizeUsernameInput(formData.username);
        const fullName = `${cleanFirstName} ${cleanLastName}`.trim();

        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          setFieldErrors({ username: 'Username is already taken. Please choose another.' });
          setErrorMessage('Username is already taken. Please choose another.');
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: fullName,
              username: cleanUsername,
              account_type: formData.accountType
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Registration failed. Please try again.');

        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: cleanEmail,
            first_name: cleanFirstName,
            last_name: cleanLastName,
            full_name: fullName,
            username: cleanUsername,
            country: formData.country,
            account_type: formData.accountType,
            date_of_birth: formData.dob || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        setSuccessMessage('Registration successful! Redirecting...');
        setTimeout(() => {
          router.push('/feed');
        }, 1200);
      } else {
        const { error: signinError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (signinError) throw signinError;

        try {
          if (formData.rememberMe) {
            window.localStorage.setItem('shanora_remembered_email', cleanEmail);
          } else {
            window.localStorage.removeItem('shanora_remembered_email');
          }
        } catch {
          // Ignore storage errors
        }

        router.push('/feed');
      }
    } catch (err) {
      setErrorMessage(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/feed` }
      });
      if (error) throw error;
    } catch (err) {
      setErrorMessage(getFriendlyAuthError(err));
    }
  };

  const getFieldInputStyle = (fieldName, hasError = false) => {
    const isFocused = focusedField === fieldName;
    return {
      width: '100%',
      backgroundColor: isFocused ? '#17253b' : '#111b2e',
      border: hasError
        ? '1px solid rgba(239, 68, 68, 0.85)'
        : isFocused
        ? '1.5px solid #38bdf8'
        : '1px solid rgba(148, 163, 184, 0.22)',
      borderRadius: '11px',
      padding: '10.5px 12px',
      color: '#f8fafc',
      fontSize: '13.5px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
      boxShadow: isFocused && !hasError ? '0 0 0 3px rgba(56, 189, 248, 0.18)' : 'none'
    };
  };

  const toggleBtnStyle = {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#1e293b',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    borderRadius: '8px',
    color: '#38bdf8',
    cursor: 'pointer',
    padding: '4px 9px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  };

  const activeItem = slideshowItems[currentSlide];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#070b14',
        backgroundImage:
          'radial-gradient(circle at 12% 14%, rgba(56, 189, 248, 0.1), transparent 44%), radial-gradient(circle at 88% 82%, rgba(59, 130, 246, 0.11), transparent 46%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        scrollBehavior: 'smooth'
      }}
    >
      <style>{`
        @keyframes shanoraSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ maxWidth: '1080px', width: '100%', margin: '0 auto', padding: '18px 14px 24px', boxSizing: 'border-box' }}>
        {/* 1. Single Unified Top Header (Official Logo + Welcome + Domain Pill) */}
        <header
          aria-label="SHANORA Top Header"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.84)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: '18px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxWidth: '760px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
              <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '17px',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
                  }}
                >
                  S
                </div>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.4px' }}>
                  SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
                </span>
              </Link>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase' }}>
                • WELCOME TO SHANORA
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: 'clamp(18px, 3vw, 23px)', fontWeight: '800', margin: 0, color: '#fff', lineHeight: 1.22 }}>
                Your Global Professional Network
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '12.5px', lineHeight: '1.48', margin: '4px 0 0' }}>
                Connect with professionals, discover career opportunities, build your network, and grow your professional future with SHANORA.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: '11.5px',
              color: '#cbd5e1',
              backgroundColor: '#111b2e',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: '999px',
              padding: '6px 12px',
              fontWeight: '700'
            }}
          >
            <span aria-hidden="true">🌐</span>
            <span>shanora.online</span>
          </div>
        </header>

        {/* Main Auth Grid (Slideshow + Form) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(295px, 1fr))',
            width: '100%',
            gap: '24px',
            alignItems: 'stretch'
          }}
        >
          {/* Left Column: Compact Hero & Clean Showcase Card */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', textAlign: 'left', minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h1 style={{ fontSize: 'clamp(20px, 3.2vw, 24px)', fontWeight: '800', lineHeight: '1.2', margin: 0, letterSpacing: '-0.4px' }}>
                Explore the professional connections you love.
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.48', margin: 0 }}>
                &ldquo;Professional growth within your reach&rdquo; — Connect with creators and global employers across Pakistan.
              </p>
            </div>

            {/* Clean Compact Showcase Card */}
            <div
              style={{
                width: '100%',
                borderRadius: '18px',
                background: activeItem.surface,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 18px 38px rgba(0,0,0,0.52)',
                padding: '14px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'background 0.5s ease'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '195px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.16)',
                  backgroundColor: '#0b1322',
                  position: 'relative'
                }}
              >
                {slideshowItems.map((item, idx) => (
                  <img
                    key={idx}
                    src={item.url}
                    alt={item.name}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: item.pos || '50% 25%',
                      opacity: currentSlide === idx ? 1 : 0,
                      transition: 'opacity 0.55s ease-in-out'
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: activeItem.accent,
                      letterSpacing: '0.3px'
                    }}
                  >
                    {activeItem.category} • {activeItem.type}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#cbd5e1',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}
                  >
                    {activeItem.status}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#ffffff', lineHeight: 1.22 }}>
                    {activeItem.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>
                    {activeItem.role}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.88)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderLeft: `3px solid ${activeItem.accent}`,
                    borderRadius: '11px',
                    padding: '9px 11px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    lineHeight: '1.42'
                  }}
                >
                  &ldquo;{activeItem.message}&rdquo;
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingLeft: '2px', flexWrap: 'wrap' }}>
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
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderTop: '3px solid #38bdf8',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.65), 0 0 24px rgba(56, 189, 248, 0.08)',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {/* Mode Switcher Pills */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  backgroundColor: '#070b14',
                  padding: '4px',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  marginBottom: '16px'
                }}
              >
                <button
                  type="button"
                  onClick={() => switchAuthMode(false)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: !isSignup ? '#1e293b' : 'transparent',
                    color: !isSignup ? '#38bdf8' : '#94a3b8',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode(true)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: isSignup ? '#1e293b' : 'transparent',
                    color: isSignup ? '#38bdf8' : '#94a3b8',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Create Account
                </button>
              </div>

              <h2 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '4px', marginTop: 0, color: '#fff' }}>
                {isAddingAccount
                  ? (isSignup ? 'Add another account (Sign Up)' : 'Add another account (Sign In)')
                  : (isSignup ? 'Create a new account' : 'Sign in to SHANORA')}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '12.5px', marginBottom: '16px', marginTop: 0 }}>
                {isSignup ? 'Quick and easy registration.' : 'Welcome back! Please enter your details.'}
              </p>

              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span aria-hidden="true">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                    color: '#6ee7b7',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span aria-hidden="true">✅</span>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Google OAuth Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleAuth}
                onMouseEnter={() => setHoveredBtn('google')}
                onMouseLeave={() => setHoveredBtn('')}
                style={{
                  width: '100%',
                  backgroundColor: hoveredBtn === 'google' ? '#1f2e45' : '#152033',
                  border: '1px solid rgba(148, 163, 184, 0.24)',
                  color: '#fff',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                  transition: 'background-color 0.2s ease, transform 0.15s ease',
                  transform: hoveredBtn === 'google' && !loading ? 'translateY(-1px)' : 'none'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.23 24 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.4l4.09-3.16z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.68 1.18 6.6l4.09 3.16c.95-2.85 3.6-4.96 6.73-4.96z" />
                </svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '11px', marginBottom: '14px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(148, 163, 184, 0.16)' }} />
                <span>OR EMAIL</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(148, 163, 184, 0.16)' }} />
              </div>

              <form onSubmit={handleAuth} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {isSignup && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '10px' }}>
                      <div>
                        <label htmlFor="auth-firstName" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          First Name *
                        </label>
                        <input
                          id="auth-firstName"
                          type="text"
                          name="firstName"
                          autoComplete="given-name"
                          placeholder="Aman"
                          value={formData.firstName}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('firstName')}
                          onBlur={() => setFocusedField('')}
                          required
                          style={getFieldInputStyle('firstName', Boolean(fieldErrors.firstName))}
                        />
                        {fieldErrors.firstName && (
                          <div style={{ color: '#f87171', fontSize: '11px', marginTop: '3px' }}>{fieldErrors.firstName}</div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="auth-lastName" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          Last Name *
                        </label>
                        <input
                          id="auth-lastName"
                          type="text"
                          name="lastName"
                          autoComplete="family-name"
                          placeholder="Ullah"
                          value={formData.lastName}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('lastName')}
                          onBlur={() => setFocusedField('')}
                          required
                          style={getFieldInputStyle('lastName', Boolean(fieldErrors.lastName))}
                        />
                        {fieldErrors.lastName && (
                          <div style={{ color: '#f87171', fontSize: '11px', marginTop: '3px' }}>{fieldErrors.lastName}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="auth-username" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Username *
                      </label>
                      <input
                        id="auth-username"
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="amanullah_pk"
                        value={formData.username}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField('')}
                        required
                        style={getFieldInputStyle('username', Boolean(fieldErrors.username))}
                      />
                      {fieldErrors.username && (
                        <div style={{ color: '#f87171', fontSize: '11px', marginTop: '3px' }}>{fieldErrors.username}</div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="auth-email" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    required
                    style={getFieldInputStyle('email', Boolean(fieldErrors.email))}
                  />
                  {fieldErrors.email && (
                    <div style={{ color: '#f87171', fontSize: '11px', marginTop: '3px' }}>{fieldErrors.email}</div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label htmlFor="auth-password" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600' }}>
                      Password *
                    </label>
                    {!isSignup && (
                      <Link href="/auth/forgot-password" style={{ fontSize: '11.5px', color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                        Forgot?
                      </Link>
                    )}
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      required
                      style={{
                        ...getFieldInputStyle('password', Boolean(fieldErrors.password)),
                        paddingRight: '74px'
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      style={toggleBtnStyle}
                    >
                      <span>{showPassword ? '🙈' : '👁️'}</span>
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>

                  {fieldErrors.password && (
                    <div style={{ color: '#f87171', fontSize: '11px', marginTop: '3px' }}>{fieldErrors.password}</div>
                  )}

                  {isSignup && formData.password && (
                    <div style={{ marginTop: '6px' }}>
                      <div
                        style={{
                          height: '4px',
                          width: '100%',
                          backgroundColor: '#1e293b',
                          borderRadius: '999px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: passwordStrength.width,
                            backgroundColor: passwordStrength.color,
                            transition: 'width 0.25s ease, background-color 0.25s ease'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginTop: '3px' }}>
                        <span>Strength: <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong></span>
                        <span>8+ chars, A-Z, 0-9</span>
                      </div>
                    </div>
                  )}
                </div>

                {isSignup && (
                  <div>
                    <label htmlFor="auth-confirmPassword" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Confirm Password *
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        id="auth-confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField('')}
                        required
                        style={{
                          ...getFieldInputStyle('confirmPassword', Boolean(fieldErrors.confirmPassword)),
                          paddingRight: '74px'
                        }}
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        style={toggleBtnStyle}
                      >
                        <span>{showConfirmPassword ? '🙈' : '👁️'}</span>
                        <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <div style={{ color: '#f87171', fontSize: '11px', marginTop: '3px' }}>{fieldErrors.confirmPassword}</div>
                    )}
                  </div>
                )}

                {!isSignup && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      id="auth-rememberMe"
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                    <label htmlFor="auth-rememberMe" style={{ fontSize: '11.5px', color: '#cbd5e1', cursor: 'pointer' }}>
                      Remember my email on this device
                    </label>
                  </div>
                )}

                {isSignup && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '10px' }}>
                      <div>
                        <label htmlFor="auth-dob" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          Date of Birth
                        </label>
                        <input
                          id="auth-dob"
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('dob')}
                          onBlur={() => setFocusedField('')}
                          style={getFieldInputStyle('dob', false)}
                        />
                      </div>
                      <div>
                        <label htmlFor="auth-country" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          Country
                        </label>
                        <select
                          id="auth-country"
                          name="country"
                          autoComplete="country-name"
                          value={formData.country}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('country')}
                          onBlur={() => setFocusedField('')}
                          style={getFieldInputStyle('country', false)}
                        >
                          {countriesList.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="auth-accountType" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Account Type
                      </label>
                      <select
                        id="auth-accountType"
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('accountType')}
                        onBlur={() => setFocusedField('')}
                        style={getFieldInputStyle('accountType', false)}
                      >
                        {accountTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div style={{ marginTop: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                        <input
                          type="checkbox"
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleChange}
                          id="terms"
                          style={{ marginTop: '2px', accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                        <div>
                          <label htmlFor="terms" style={{ cursor: 'pointer' }}>
                            I agree to SHANORA&apos;s{' '}
                          </label>
                          <Link
                            href="/terms"
                            style={{ color: '#38bdf8', textDecoration: 'underline', fontSize: '11px', fontWeight: '700' }}
                          >
                            Terms
                          </Link>
                          {' '}and{' '}
                          <Link
                            href="/privacy"
                            style={{ color: '#38bdf8', textDecoration: 'underline', fontSize: '11px', fontWeight: '700' }}
                          >
                            Privacy Policy
                          </Link>
                          .
                        </div>
                      </div>
                      {fieldErrors.agreeTerms && (
                        <div style={{ color: '#f87171', fontSize: '11px', marginTop: '3px' }}>{fieldErrors.agreeTerms}</div>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setHoveredBtn('submit')}
                  onMouseLeave={() => setHoveredBtn('')}
                  style={{
                    width: '100%',
                    background:
                      hoveredBtn === 'submit' && !loading
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '6px',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: loading ? 0.85 : 1,
                    transition: 'background 0.2s ease, transform 0.15s ease',
                    transform: hoveredBtn === 'submit' && !loading ? 'translateY(-1px)' : 'none'
                  }}
                >
                  {loading && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: '15px',
                        height: '15px',
                        border: '2px solid rgba(255,255,255,0.35)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'shanoraSpin 0.75s linear infinite'
                      }}
                    />
                  )}
                  <span>
                    {loading
                      ? (isSignup ? 'Creating account...' : 'Signing in...')
                      : (isSignup ? 'Create Account 🚀' : 'Sign In ➔')}
                  </span>
                </button>
              </form>
            </div>

            {/* Toggle between Sign In / Sign Up */}
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: '#94a3b8' }}>
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchAuthMode(false)}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '12px' }}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  New to SHANORA?{' '}
                  <button
                    type="button"
                    onClick={() => switchAuthMode(true)}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '12px' }}
                  >
                    Join Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 5. Download SHANORA App Section: ANDROID -> WINDOWS -> APPLE (Placed ABOVE How SHANORA Works) */}
        <section
          aria-labelledby="download-shanora-heading"
          style={{
            marginTop: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            borderRadius: '20px',
            padding: '18px 20px'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <h2 id="download-shanora-heading" style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#fff' }}>
              DOWNLOAD SHANORA
            </h2>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '3px 0 0' }}>
              Access SHANORA across your favourite devices.
            </p>
          </div>

          {appNotice && (
            <div
              role="status"
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#7dd3fc',
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <span>{appNotice}</span>
              <button
                type="button"
                onClick={() => setAppNotice('')}
                style={{ background: 'none', border: 'none', color: '#bae6fd', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}
              >
                ✕
              </button>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}
          >
            {/* 1. ANDROID */}
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(34, 197, 94, 0.12) 0%, rgba(17, 27, 46, 0.85) 100%)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '11px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AndroidIcon />
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>ANDROID</span>
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#4ade80', backgroundColor: 'rgba(34, 197, 94, 0.14)', padding: '2px 8px', borderRadius: '999px' }}>
                  {DOWNLOAD_URLS.android ? 'Available' : 'Coming Soon'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handlePlatformClick('android', 'Android')}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#f8fafc',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Download for Android
              </button>
            </div>

            {/* 2. WINDOWS */}
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(56, 189, 248, 0.12) 0%, rgba(17, 27, 46, 0.85) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '11px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WindowsIcon />
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>WINDOWS</span>
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#7dd3fc', backgroundColor: 'rgba(56, 189, 248, 0.14)', padding: '2px 8px', borderRadius: '999px' }}>
                  {DOWNLOAD_URLS.windows ? 'Available' : 'Coming Soon'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handlePlatformClick('windows', 'Windows')}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#f8fafc',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Download for Windows
              </button>
            </div>

            {/* 3. APPLE */}
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(167, 139, 250, 0.12) 0%, rgba(17, 27, 46, 0.85) 100%)',
                border: '1px solid rgba(167, 139, 250, 0.25)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '11px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AppleIcon />
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>APPLE</span>
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#c4b5fd', backgroundColor: 'rgba(167, 139, 250, 0.14)', padding: '2px 8px', borderRadius: '999px' }}>
                  {DOWNLOAD_URLS.apple ? 'Available' : 'Coming Soon'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handlePlatformClick('apple', 'iOS')}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#f8fafc',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Download for iOS
              </button>
            </div>
          </div>
        </section>

        {/* 4. How SHANORA Works Section (Placed BELOW Download SHANORA) */}
        <section
          aria-labelledby="how-shanora-works-heading"
          style={{
            marginTop: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            borderRadius: '20px',
            padding: '18px 20px'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <h2 id="how-shanora-works-heading" style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#fff' }}>
              How SHANORA Works
            </h2>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '3px 0 0' }}>
              Explore every part of SHANORA—from profile and CV building to PRO, Ad Campaigns, and Monetization.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
              gap: '12px'
            }}
          >
            {HOW_IT_WORKS_STEPS.map((item) => (
              <div
                key={item.step}
                style={{
                  background: item.glassBg,
                  backdropFilter: 'blur(14px)',
                  border: `1px solid ${item.borderColor}`,
                  borderTop: `2.5px solid ${item.accent}`,
                  borderRadius: '15px',
                  padding: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  boxShadow: '0 10px 26px rgba(0, 0, 0, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '17px' }} aria-hidden="true">{item.icon}</span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: '800',
                      color: item.accent,
                      backgroundColor: 'rgba(7, 11, 20, 0.55)',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}
                  >
                    Step {item.step}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>{item.description}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 6. Professional Footer Linked to Dedicated Pages */}
      <footer
        style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.16)',
          backgroundColor: '#0b111e',
          padding: '18px 14px',
          marginTop: '8px'
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '12px',
            color: '#94a3b8'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            <Link href="/about" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '600' }}>
              About SHANORA
            </Link>
            <Link href="/contact" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '600' }}>
              Contact Us
            </Link>
            <Link href="/privacy" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '600' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '600' }}>
              Terms &amp; Conditions
            </Link>
          </div>
          <div>Copyright © 2026 SHANORA.</div>
        </div>
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
          Loading...
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
