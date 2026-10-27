'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

function ProfileContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPublicProfile() {
      if (!emailParam) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailParam.trim().toLowerCase())
          .maybeSingle();

        if (data) setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicProfile();
  }, [emailParam]);

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>
        Loading digital profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif', color: '#fff', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#f87171' }}>Profile Not Found</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px', margin: '0.5rem 0 1.5rem 0' }}>
          Is email ke sath koi verified digital profile match nahi hui.
        </p>
        <Link href="/" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem' }}>
          Back to Shanora Home
        </Link>
      </main>
    );
  }

  const rawPhone = profile.phone ? profile.phone.replace(/[^0-9]/g, '') : '';
  const waNumber = rawPhone.startsWith('0') ? '92' + rawPhone.slice(1) : rawPhone.startsWith('92') ? rawPhone : '92' + rawPhone;

  return (
    <main style={{ minHeight: '100vh', padding: '1.5rem 1rem', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif', color: '#f8fafc' }}>
      
      {/* Top Bar Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
          ← Shanora Talent Network
        </Link>
        <button
          onClick={copyProfileLink}
          style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {copied ? 'Link Copied! ✅' : 'Share Profile 🔗'}
        </button>
      </div>

      {/* Main Profile Header Card */}
      <section style={{ backgroundColor: '#131b2e', padding: '2rem 1.5rem', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          
          <div style={{ width: '105px', height: '105px', borderRadius: '50%', backgroundColor: '#0a0f1d', border: '3px solid #38bdf8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2.5rem' }}>🎓</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0, color: '#fff' }}>
                {profile.full_name}
              </h1>
              <span style={{ backgroundColor: '#22c55e', color: '#090d16', fontSize: '0.68rem', padding: '0.2rem 0.55rem', borderRadius: '20px', fontWeight: 'bold' }}>
                Verified Graduate 🇵🇰
              </span>
            </div>

            <p style={{ color: '#38bdf8', fontSize: '0.95rem', margin: '0.35rem 0', fontWeight: '600' }}>
              {profile.degree} • {profile.university} (Class of {profile.graduation_year || '2026'})
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>
              <span>📍 {profile.city || 'Pakistan'}</span>
              {profile.relocate_ok && <span style={{ color: '#4ade80' }}>✓ Open to Relocate</span>}
              {profile.expected_salary && <span>💰 Expected: PKR {profile.expected_salary}</span>}
            </div>

            {/* Recruiter Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {profile.phone && (
                <a
                  href={`https://wa.me/${waNumber}?text=Assalam-o-Alaikum%20${encodeURIComponent(profile.full_name)},%20we%20reviewed%20your%20Shanora%20profile%20and%20would%20like%20to%20discuss%20an%20opportunity.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.6rem 1.15rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>💬</span> Contact on WhatsApp
                </a>
              )}

              {profile.resume_url && (
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.6rem 1.15rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  Download PDF CV 📄
                </a>
              )}
            </div>

          </div>
        </div>

        {profile.bio && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #1e293b' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.4rem 0' }}>About</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>{profile.bio}</p>
          </div>
        )}
      </section>

      {/* Core Skills */}
      {profile.skills && (
        <section style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#38bdf8', margin: '0 0 0.75rem 0' }}>Core Competencies & Skills</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(Array.isArray(profile.skills) ? profile.skills : profile.skills.split(',')).map((skill, i) => (
              <span key={i} style={{ backgroundColor: '#0a0f1d', color: '#cbd5e1', border: '1px solid #334155', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '500' }}>
                {skill.trim()}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Final Year Project (FYP) Showcase */}
      {profile.fyp_title && (
        <section style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🏆</span>
            <h2 style={{ fontSize: '1.05rem', color: '#38bdf8', margin: 0 }}>Final Year Project (FYP) / Capstone</h2>
          </div>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', margin: '0.4rem 0 0.2rem 0' }}>{profile.fyp_title}</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>{profile.fyp_details}</p>
        </section>
      )}

      {/* Experience & Internships */}
      {profile.experience && profile.experience.length > 0 && (
        <section style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.05rem', color: '#38bdf8', margin: '0 0 0.85rem 0' }}>Work Experience & Internships</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {profile.experience.map((exp, idx) => (
              <div key={idx} style={{ paddingLeft: '0.85rem', borderLeft: '2px solid #0284c7' }}>
                <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{exp.role}</strong>
                <div style={{ color: '#38bdf8', fontSize: '0.82rem' }}>{exp.company} {exp.duration && `• ${exp.duration}`}</div>
                {exp.desc && <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>{exp.desc}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Trainings */}
      {((profile.certifications && profile.certifications.length > 0) || (profile.trainings && profile.trainings.length > 0)) && (
        <section style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', color: '#38bdf8', margin: '0 0 0.85rem 0' }}>Certifications & Trainings</h2>

          {profile.certifications && profile.certifications.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#cbd5e1', margin: '0 0 0.4rem 0', fontSize: '0.85rem' }}>Verified Certifications:</h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.6' }}>
                {profile.certifications.map((c, i) => (
                  <li key={i}>
                    <strong style={{ color: '#fff' }}>{c.title}</strong> — {c.issuer} {c.year && `(${c.year})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.trainings && profile.trainings.length > 0 && (
            <div>
              <h4 style={{ color: '#cbd5e1', margin: '0 0 0.4rem 0', fontSize: '0.85rem' }}>Bootcamps & Industry Training:</h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.6' }}>
                {profile.trainings.map((t, i) => (
                  <li key={i}>
                    <strong style={{ color: '#fff' }}>{t.program}</strong> — {t.institute} {t.duration && `(${t.duration})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '1.5rem 0', borderTop: '1px solid #1e293b', color: '#64748b', fontSize: '0.8rem' }}>
        Verified by Shanora Pakistan Talent Ecosystem
      </footer>

    </main>
  );
}

export default function PublicProfileViewPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
                   }
        
