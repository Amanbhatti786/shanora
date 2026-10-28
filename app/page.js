'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Banner Notice */}
      <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.45rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#38bdf8' }}>
        🇵🇰 Pakistan's Dedicated Career & Digital Portfolio Network for Fresh Graduates
      </div>

      {/* Modern Navigation Header */}
      <header style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.85)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e293b', 
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.85rem 1.5rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
            fontSize: '1.1rem'
          }}>
            🎓
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: '900', letterSpacing: '0.5px', color: '#ffffff' }}>
            SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/profile" style={{ 
            backgroundColor: '#0284c7', 
            color: '#ffffff', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px', 
            textDecoration: 'none', 
            fontSize: '0.85rem', 
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            Student Portal
          </Link>
          <Link href="/ats-checker" style={{ 
            backgroundColor: '#1e293b', 
            color: '#cbd5e1', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px', 
            textDecoration: 'none', 
            fontSize: '0.85rem', 
            fontWeight: '600', 
            border: '1px solid #334155' 
          }}>
            ATS Scanner ⚡
          </Link>
          <Link href="/admin" style={{ 
            backgroundColor: 'rgba(251, 191, 36, 0.1)', 
            color: '#fbbf24', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px', 
            textDecoration: 'none', 
            fontSize: '0.85rem', 
            fontWeight: '600', 
            border: '1px solid rgba(251, 191, 36, 0.3)' 
          }}>
            Admin 🔒
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '3.5rem 1.25rem 2rem', textAlign: 'center' }}>
        
        <div style={{ display: 'inline-block', padding: '0.35rem 0.9rem', backgroundColor: '#1e293b', borderRadius: '50px', fontSize: '0.8rem', color: '#94a3b8', border: '1px solid #334155', marginBottom: '1.25rem' }}>
          🚀 Launch Your Professional Career Today
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: '900', lineHeight: '1.2', marginBottom: '1.2rem', color: '#ffffff' }}>
          Build Your Verified Digital Identity & <br />
          <span style={{ 
            background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Connect With Top Employers
          </span>
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          Shanora PK empowers Pakistani university graduates with shareable digital portfolios, direct employer WhatsApp connections, and instant ATS resume optimization.
        </p>

        {/* Primary CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <Link href="/profile" style={{ 
            backgroundColor: '#0284c7', 
            color: '#ffffff', 
            padding: '0.9rem 1.8rem', 
            borderRadius: '10px', 
            textDecoration: 'none', 
            fontWeight: '700', 
            fontSize: '1rem',
            boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)'
          }}>
            Build Student Profile 🎓
          </Link>
          <Link href="/ats-checker" style={{ 
            backgroundColor: '#131b2e', 
            color: '#e2e8f0', 
            border: '1px solid #334155', 
            padding: '0.9rem 1.8rem', 
            borderRadius: '10px', 
            textDecoration: 'none', 
            fontWeight: '700', 
            fontSize: '1rem' 
          }}>
            Check Resume ATS Score ⚡
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.25rem', 
          textAlign: 'left',
          marginTop: '2rem'
        }}>
          
          {/* Card 1 */}
          <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>💼</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', margin: '0 0 0.5rem 0' }}>Shareable Digital Profile</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
              Create a unique online resume link showing your GPA, final year project, skills, and direct contact details.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', margin: '0 0 0.5rem 0' }}>ATS Resume Scanner</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
              Audit your CV formatting against modern recruiting software keywords to pass screening filters quickly.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>💬</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', margin: '0 0 0.5rem 0' }}>Direct Employer Reach</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
              Employers can connect with you straight over WhatsApp and verified contact channels without intermediaries.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e293b', marginTop: '4rem', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} Shanora PK. All rights reserved. Built for Pakistani Graduates.
      </footer>

    </div>
  );
}
