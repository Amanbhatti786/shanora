'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [jobQuery, setJobQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('All Pakistan');

  const handleJobSearch = (e) => {
    e.preventDefault();
    router.push(`/jobs?query=${encodeURIComponent(jobQuery)}&location=${encodeURIComponent(locationQuery)}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. NAVIGATION HEADER */}
      <header style={{ backgroundColor: '#070b14', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.5rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(2, 132, 199, 0.45)' }}>
              <span style={{ color: '#fff', fontSize: '1rem', fontWeight: '900' }}>S</span>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px' }}>
              SHANORA<span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#38bdf8', verticalAlign: 'super', marginLeft: '2px' }}>.PK</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/" style={{ color: '#f8fafc', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Home</Link>
            <Link href="/jobs" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Jobs</Link>
            <Link href="/profile?tab=network" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Network</Link>
            <Link href="/pages" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Companies</Link>
          </nav>

          {/* Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/auth" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', padding: '0.45rem 0.9rem' }}>
              Sign In
            </Link>
            <Link href="/auth?mode=signup" style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '800', padding: '0.5rem 1.1rem', borderRadius: '8px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)' }}>
              Join Free
            </Link>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '5rem 1rem 3rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px', lineHeight: '1.2', marginBottom: '1rem' }}>
          Build Your Career. <br />
          <span style={{ color: '#38bdf8' }}>Connect With the World.</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
          Discover jobs, connect with professionals, and explore global opportunities with SHANORA.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/auth?mode=signup" style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '0.75rem 1.8rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '800', boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)' }}>
            Join SHANORA – Free
          </Link>
          <Link href="/jobs" style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', textDecoration: 'none', padding: '0.75rem 1.8rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700' }}>
            Explore Jobs
          </Link>
        </div>
      </section>

      {/* 3. JOB SEARCH WIDGET */}
      <section style={{ maxWidth: '720px', margin: '0 auto 4rem auto', padding: '0 1rem' }}>
        <form onSubmit={handleJobSearch} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '0.75rem', display: 'flex', gap: '0.5rem', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: '#131b2e', borderRadius: '10px' }}>
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Job Title, Skills, or Keywords" 
              value={jobQuery}
              onChange={(e) => setJobQuery(e.target.value)}
              style={{ width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.88rem' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: '#131b2e', borderRadius: '10px' }}>
            <span>📍</span>
            <input 
              type="text" 
              placeholder="Country / Location" 
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              style={{ width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.88rem' }}
            />
          </div>
          <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer' }}>
            Search Jobs
          </button>
        </form>
      </section>

      {/* 4. FOUR MAIN FEATURES */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 5rem auto', padding: '0 1rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: '800', marginBottom: '2rem', color: '#fff' }}>
          Why Professionals Choose SHANORA
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
          {[
            { title: 'Find Jobs', desc: 'Explore career openings tailored to your exact skills and experience level.', icon: '💼' },
            { title: 'Connect with Professionals', desc: 'Build a meaningful network with global industry experts and peers.', icon: '🤝' },
            { title: 'Discover Companies', desc: 'Follow leading organizations, check culture, and view verified openings.', icon: '🏢' },
            { title: 'Professional Community', desc: 'Share your insights, publish articles, and engage in high-value discussions.', icon: '🌐' }
          ].map((feat, idx) => (
            <div key={idx} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '2rem' }}>{feat.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: 0 }}>{feat.title}</h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section style={{ maxWidth: '800px', margin: '0 auto 5rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'linear-gradient(135deg, rgba(2,132,199,0.15) 0%, rgba(15,23,42,0.8) 100%)', backgroundColor: '#0f172a', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '20px', padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', marginBottom: '0.6rem' }}>One Platform. Endless Opportunities.</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Join SHANORA and take the next step in your professional journey.</p>
          <Link href="/auth?mode=signup" style={{ display: 'inline-block', backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '800', boxShadow: '0 4px 15px rgba(2,132,199,0.4)' }}>
            Join SHANORA – It's Free
          </Link>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer style={{ backgroundColor: '#070b14', borderTop: '1px solid #1e293b', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            © {new Date().getFullYear()} SHANORA.PK — All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem' }}>
            <Link href="/about" style={{ color: '#94a3b8', textDecoration: 'none' }}>About Us</Link>
            <Link href="/contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact</Link>
            <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms & Conditions</Link>
            <Link href="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Help Center</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
