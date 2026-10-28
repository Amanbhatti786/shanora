'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

function ProfileContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidate() {
      if (!emailParam) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailParam.toLowerCase().trim())
          .maybeSingle();

        if (data) setProfile(data);
      } catch (err) {
        console.error('Candidate load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidate();
  }, [emailParam]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading Candidate Portfolio...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
        <h2>Candidate Profile Not Found</h2>
        <Link href="/" style={{ color: '#38bdf8', marginTop: '1rem' }}>Return Home</Link>
      </div>
    );
  }

  const skillsList = Array.isArray(profile.skills) ? profile.skills : (profile.skills ? profile.skills.split(',') : []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '1.25rem 1rem' }}>
      
      {/* Top Bar */}
      <header style={{ maxWidth: '750px', margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: '900', fontSize: '1.15rem' }}>
          SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
        </Link>
        <Link href={`/messages?chatWith=${encodeURIComponent(profile.email)}`} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>
          Send Direct Message 💬
        </Link>
      </header>

      {/* Profile Card */}
      <div style={{ maxWidth: '750px', margin: '0 auto', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
        {/* Banner */}
        <div style={{ height: '110px', background: 'linear-gradient(90deg, #0284c7, #0f172a)' }} />

        {/* Info */}
        <div style={{ padding: '0 1.5rem 1.5rem', position: 'relative' }}>
          <div style={{ width: '84px', height: '84px', borderRadius: '50%', backgroundColor: '#1e293b', border: '4px solid #0f172a', position: 'absolute', top: '-42px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8' }}>
            {profile.photo_url ? <img src={profile.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (profile.full_name || 'U')[0].toUpperCase()}
          </div>

          <div style={{ paddingTop: '50px' }}>
            <h1 style={{ margin: 0, fontSize: '1.45rem', color: '#fff' }}>{profile.full_name || 'Anonymous Graduate'}</h1>
            <span style={{ color: '#38bdf8', fontSize: '0.88rem', fontWeight: '600', display: 'block', marginTop: '0.2rem' }}>
              {profile.degree} • {profile.university}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              📍 {profile.city || 'Pakistan'} | Class of {profile.graduation_year || '2026'}
            </span>

            {profile.resume_url && (
              <div style={{ marginTop: '0.9rem' }}>
                <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid #22c55e', padding: '0.45rem 0.9rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block' }}>
                  Download Verified CV 📄
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bio & Details */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {profile.bio && (
            <div>
              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', color: '#38bdf8' }}>About Candidate</h3>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>{profile.bio}</p>
            </div>
          )}

          {skillsList.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#38bdf8' }}>Key Technical Competencies</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {skillsList.map((s, idx) => (
                  <span key={idx} style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #334155' }}>
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.fyp_title && (
            <div>
              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', color: '#38bdf8' }}>Final Year Project (FYP)</h3>
              <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{profile.fyp_title}</strong>
              <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>{profile.fyp_details}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default function ViewProfile() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#38bdf8', padding: '2rem' }}>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
                  }
          
