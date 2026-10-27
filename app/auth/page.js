'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [degree, setDegree] = useState('');
  const [city, setCity] = useState('Lahore');
  const [targetRole, setTargetRole] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        router.push('/profile');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;

        if (data?.user) {
          await supabase.from('profiles').insert([
            {
              id: data.user.id,
              full_name: fullName.trim() || 'Pakistani Graduate',
              phone: phone.trim(),
              degree: degree.trim(),
              city: city,
              target_role: targetRole.trim() || 'General Tech',
            },
          ]);
        }
        router.push('/profile');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred during login/signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ backgroundColor: '#131b2e', padding: '2rem', borderRadius: '16px', border: '1px solid #1e293b', width: '100%', maxWidth: '420px' }}>
        
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: isLogin ? '2px solid #38bdf8' : 'none',
              color: isLogin ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: !isLogin ? '2px solid #38bdf8' : 'none',
              color: !isLogin ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
          {isLogin ? 'Student Sign In 👋' : 'Create Graduate Account 🎓'}
        </h2>

        {errorMsg && (
          <div style={{ padding: '0.65rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ali Khan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="03xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Degree</label>
                  <input
                    type="text"
                    placeholder="e.g. BSCS"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>City</label>
                  <input
                    type="text"
                    placeholder="e.g. Lahore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Target Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Web Dev, AI, Banking"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Email</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In ➔' : 'Create Account 🚀'}
          </button>
        </form>

      </div>
    </main>
  );
}
