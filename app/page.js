'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* Professional Navbar with Logo */}
      <nav style={{ 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid #1e293b', 
        padding: '0.9rem 1.25rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>💎</span>
          <span style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '0.5px', color: '#38bdf8' }}>SHANORA</span>
          <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 'bold' }}>PK 🇵🇰</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/profile" style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 0.9rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 'bold' }}>
            Student Portal 🎓
          </Link>
          <Link href="/ats-checker" style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 'bold', border: '1px solid #334155' }}>
            ATS Scanner ⚡
          </Link>
          <Link href="/admin" style={{ backgroundColor: '#1e293b', color: '#fbbf24', padding: '0.5rem 0.9rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 'bold', border: '1px solid #334155' }}>
            Admin 🔒
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ maxWidth: '850px', margin: '3.5rem auto 2rem', padding: '0 1.25rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '1.2rem', lineHeight: '1.2', color: '#ffffff' }}>
          Connecting Pakistani Fresh Graduates with Real Opportunities
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
          Verified talent database, dynamic portfolio sharing, and automated ATS resume optimization.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/profile" style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.85rem 1.6rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' }}>
            Create Student Profile 🎓
          </Link>
          <Link href="/ats-checker" style={{ backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid #334155', padding: '0.85rem 1.6rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' }}>
            Check ATS Score ⚡
          </Link>
        </div>
      </main>

    </div>
  );
            }
