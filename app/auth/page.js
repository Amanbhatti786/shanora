'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      if (isLogin) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;
        setMsg({ text: 'Login successful! Redirecting...', type: 'success' });
       setTimeout(() => {
  router.push('/feed');
}, 1000);
      } else {
        // Sign Up (LinkedIn/Indeed Style)
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        setMsg({ text: 'Account created successfully! Redirecting...', type: 'success' });
        setTimeout(() => router.push('/profile'), 1200);
      }
    } catch (err) {
      setMsg({ text: err.message || 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Brand Header */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
          🎓
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffffff' }}>
          SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
        </span>
      </Link>

      {/* Main Card */}
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#0f172a', padding: '2rem', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Toggle Switch */}
        <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '0.3rem', borderRadius: '10px', marginBottom: '1.8rem' }}>
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setMsg({ text: '', type: '' }); }}
            style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', backgroundColor: isLogin ? '#0284c7' : 'transparent', color: '#ffffff' }}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setMsg({ text: '', type: '' }); }}
            style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', backgroundColor: !isLogin ? '#0284c7' : 'transparent', color: '#ffffff' }}
          >
            Sign Up
          </button>
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#fff' }}>
          {isLogin ? 'Welcome Back 👋' : 'Join Shanora Community 🚀'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
          {isLogin ? 'Enter your student credentials to access your portal' : 'Set up your student profile and get discovered'}
        </p>

        {/* Message Alert */}
        {msg.text && (
          <div style={{ 
            padding: '0.75rem', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            marginBottom: '1.2rem',
            backgroundColor: msg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${msg.type === 'error' ? '#ef4444' : '#22c55e'}`,
            color: msg.type === 'error' ? '#fca5a5' : '#86efac'
          }}>
            {msg.text}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Full Name</label>
              <input 
                type="text" 
                required 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Muhammad Ali" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>Minimum 6 characters</span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              backgroundColor: '#0284c7', 
              color: '#ffffff', 
              padding: '0.85rem', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: '700', 
              fontSize: '0.95rem', 
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

      </div>
    </div>
  );
            }
                     
