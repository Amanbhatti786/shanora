'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfessionalLandingPage() {
  const router = useRouter();
  const [jobQuery, setJobQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('Global / Pakistan');

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/jobs?query=${encodeURIComponent(jobQuery)}&location=${encodeURIComponent(locationQuery)}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      
      {/* 1. ULTRA-CLEAN GLASSMORPHIC HEADER */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000, 
        backgroundColor: 'rgba(7, 11, 20, 0.85)', 
        backdropFilter: 'blur(12px)', 
        borderBottom: '1px solid rgba(30, 41, 59, 0.8)', 
        padding: '0.9rem 2rem' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
          
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(2, 132, 199, 0.5)' }}>
              <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '900' }}>S</span>
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>
              SHANORA<span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#38bdf8', verticalAlign: 'super', marginLeft: '2px' }}>.PK</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem', display: { xs: 'none', md: 'flex' } }}>
            <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '700' }}>Home</Link>
            <Link href="/jobs" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600', transition: 'color 0.2s' }}>Jobs</Link>
            <Link href="/profile?tab=network" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Network</Link>
            <Link href="/pages" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Companies</Link>
          </nav>

          {/* Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/auth" style={{ color: '#f8fafc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', padding: '0.5rem 1rem' }}>
              Sign In
            </Link>
            <Link href="/auth?mode=signup" style={{ 
              backgroundColor: '#0284c7', 
              color: '#fff', 
              textDecoration: 'none', 
              fontSize: '0.85rem', 
              fontWeight: '800', 
              padding: '0.55rem 1.25rem', 
              borderRadius: '10px', 
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s ease'
            }}>
              Join Free 🚀
            </Link>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION WITH GLOW EFFECT */}
      <section style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', padding: '6rem 1rem 4rem 1rem', textAlign: 'center' }}>
        
        {/* Background Ambient Glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '350px', height: '350px', backgroundColor: 'rgba(2, 132, 199, 0.12)', filter: 'blur(90px)', borderRadius: '50%', zIndex: -1 }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.35rem 1rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700' }}>✨ Pakistan’s Premier Professional Network</span>
        </div>

        <h1 style={{ fontSize: '3.2rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px', lineHeight: '1.15', marginBottom: '1.2rem' }}>
          Build Your Career. <br />
          <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Connect With the World.
          </span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.6', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
          Discover high-paying jobs, connect with industry leaders, showcase your portfolio, and scale your professional journey with SHANORA.
        </p>

        {/* Hero CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <Link href="/auth?mode=signup" style={{ 
            backgroundColor: '#0284c7', 
            color: '#fff', 
            textDecoration: 'none', 
            padding: '0.85rem 2rem', 
            borderRadius: '12px', 
            fontSize: '1rem', 
            fontWeight: '800', 
            boxShadow: '0 8px 25px rgba(2, 132, 199, 0.45)' 
          }}>
            Get Started – It's Free
          </Link>
          <Link href="/jobs" style={{ 
            backgroundColor: '#0f172a', 
            border: '1px solid #334155', 
            color: '#f8fafc', 
            textDecoration: 'none', 
            padding: '0.85rem 2rem', 
            borderRadius: '12px', 
            fontSize: '1rem', 
            fontWeight: '700' 
          }}>
            Explore Live Jobs 💼
          </Link>
        </div>
      </section>

      {/* 3. ADVANCED JOB SEARCH WIDGET */}
      <section style={{ maxWidth: '800px', margin: '0 auto 5rem auto', padding: '0 1rem' }}>
        <form onSubmit={handleSearch} style={{ 
          backgroundColor: '#0f172a', 
          border: '1px solid rgba(56, 189, 248, 0.25)', 
          borderRadius: '20px', 
          padding: '0.85rem', 
          display: 'flex', 
          gap: '0.75rem', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', backgroundColor: '#131b2e', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '1.1rem' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Job title, skill, or keyword..." 
              value={jobQuery}
              onChange={(e) => setJobQuery(e.target.value)}
              style={{ width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', backgroundColor: '#131b2e', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '1.1rem' }}>📍</span>
            <input 
              type="text" 
              placeholder="Country or City" 
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              style={{ width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>

          <button type="submit" style={{ 
            backgroundColor: '#0284c7', 
            color: '#fff', 
            border: '0', 
            padding: '0.85rem 1.8rem', 
            borderRadius: '12px', 
            fontWeight: '800', 
            fontSize: '0.9rem', 
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
          }}>
            Search Jobs
          </button>
        </form>
      </section>

      {/* 4. FOUR MAIN FEATURE CARDS (EXECUTIVE STYLE) */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 6rem auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', marginBottom: '0.5rem' }}>
            Engineered for Professional Excellence
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Everything you need to grow your career and business in one unified ecosystem.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: 'Find Jobs', desc: 'Access exclusive job postings from top global tech companies and local employers.', icon: '💼', tag: 'Career Growth' },
            { title: 'Connect with Professionals', desc: 'Build meaningful relationships with peers, mentors, and industry leaders.', icon: '🤝', tag: 'Networking' },
            { title: 'Discover Companies', desc: 'Explore organizational cultures, verified workplace reviews, and openings.', icon: '🏢', tag: 'Organizations' },
            { title: 'Professional Community', desc: 'Publish articles, share project updates, and engage in high-value tech discussions.', icon: '🌐', tag: 'Feed & Media' }
          ].map((feat, idx) => (
            <div key={idx} style={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid #1e293b', 
              borderRadius: '20px', 
              padding: '2rem 1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '2.2rem' }}>{feat.icon}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#131b2e', color: '#38bdf8', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  {feat.tag}
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', margin: 0 }}>{feat.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FINAL HIGH-CONVERSION CTA */}
      <section style={{ maxWidth: '900px', margin: '0 auto 6rem auto', padding: '0 1rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #131b2e 100%)', 
          border: '1px solid rgba(56, 189, 248, 0.35)', 
          borderRadius: '24px', 
          padding: '4rem 2rem', 
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)'
        }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff', marginBottom: '0.8rem' }}>
            One Platform. Endless Opportunities.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '550px', margin: '0 auto 2rem auto' }}>
            Join SHANORA today and take the definitive next step in your professional journey. Completely free to join.
          </p>
          <Link href="/auth?mode=signup" style={{ 
            display: 'inline-block', 
            backgroundColor: '#0284c7', 
            color: '#fff', 
            textDecoration: 'none', 
            padding: '0.9rem 2.5rem', 
            borderRadius: '12px', 
            fontSize: '1rem', 
            fontWeight: '800', 
            boxShadow: '0 8px 25px rgba(2,132,199,0.5)' 
          }}>
            Join SHANORA – It's Free 🚀
          </Link>
        </div>
      </section>

      {/* 6. PROFESSIONAL FOOTER */}
      <footer style={{ backgroundColor: '#070b14', borderTop: '1px solid #1e293b', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ color: '#fff', fontWeight: '900', fontSize: '1rem' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
            <span style={{ color: '#475569', fontSize: '0.82rem' }}>| Professional Networking & Jobs</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
            <Link href="/about" style={{ color: '#94a3b8', textDecoration: 'none' }}>About Us</Link>
            <Link href="/contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact</Link>
            <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms & Conditions</Link>
            <Link href="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Help Center</Link>
          </div>
        </div>
        <div style={{ maxWidth: '1100px', margin: '2rem auto 0 auto', textAlign: 'center', color: '#475569', fontSize: '0.78rem' }}>
          © {new Date().getFullYear()} SHANORA.PK — All rights reserved. Built for international standards.
        </div>
      </footer>

    </div>
  );
}
