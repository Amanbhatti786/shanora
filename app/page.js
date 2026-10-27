'use client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      {/* 🚀 Ultra-Professional Header Navigation */}
      <header style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
        borderBottom: '1px solid #1e293b', 
        padding: '0.85rem 1.25rem', 
        position: 'sticky', 
        top: 0, 
        zIndex: 50 
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Cyan Glow Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ 
              fontSize: '1.45rem', 
              fontWeight: '900', 
              letterSpacing: '0.5px',
              color: '#38bdf8' 
            }}>
              SHANORA
            </span>
            <span style={{ 
              backgroundColor: '#0284c7', 
              color: '#fff', 
              fontSize: '0.62rem', 
              fontWeight: '900', 
              padding: '0.18rem 0.45rem', 
              borderRadius: '4px',
              letterSpacing: '0.5px'
            }}>
              PK 
            </span>
          </Link>

          {/* Sleek Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            
            <Link href="/profile" style={navBtnStyle('#38bdf8', 'rgba(56, 189, 248, 0.1)')}>
              <span>🎓</span> Student Portal
            </Link>

            <Link href="/ats-checker" style={navBtnStyle('#cbd5e1', '#1e293b')}>
              <span>⚡</span> ATS Scanner
            </Link>

            <Link href="/admin" style={navBtnStyle('#fbbf24', 'rgba(251, 191, 36, 0.1)')}>
              <span>🔒</span> Admin
            </Link>

            <a 
              href="https://whatsapp.com/channel/YOUR_LINK" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#22c55e',
                color: '#090d16',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>📢</span> WhatsApp ⚡
            </a>

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '850px', margin: '2.5rem auto 1.5rem', padding: '0 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '0.35rem 0.9rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>
          Pakistan’s Graduate Talent Network 🇵🇰
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: '1.25', margin: '0 0 1rem 0', color: '#fff' }}>
          Land Your First Career Role in Pakistan
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
          Verified graduate opportunities, district-level hiring, AI career roadmaps, and recruiter ATS scoring.
        </p>

        {/* Hero Quick Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <Link href="/profile" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.75rem 1.6rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Student Profile 🎓
          </Link>
          <Link href="/ats-checker" style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', padding: '0.75rem 1.6rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Scan CV for ATS ⚡
          </Link>
        </div>
      </section>

    </main>
  );
}

const navBtnStyle = (textColor, bgColor) => ({
  backgroundColor: bgColor,
  color: textColor,
  border: '1px solid #334155',
  padding: '0.45rem 0.8rem',
  borderRadius: '8px',
  fontSize: '0.78rem',
  fontWeight: '700',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem'
});
