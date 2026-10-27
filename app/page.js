'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <header style={{ 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid #1e293b', 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8' }}>SHANORA</span>
          <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>PK 🇵🇰</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/profile" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.5rem 0.85rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Student Portal 🎓
          </Link>
          <Link href="/ats-checker" style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>
            ATS Scanner ⚡
          </Link>
          <Link href="/admin" style={{ backgroundColor: '#1e293b', color: '#fbbf24', padding: '0.5rem 0.85rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>
            Admin 🔒
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: '800px', margin: '3rem auto 2rem', padding: '0 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '1rem', color: '#fff' }}>
          Land Your First Career Role in Pakistan
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Verified graduate opportunities, digital resume links, and direct employer connections.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/profile" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.8rem 1.6rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            Build Student Profile 🎓
          </Link>
          <Link href="/ats-checker" style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '0.8rem 1.6rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            Scan CV for ATS ⚡
          </Link>
        </div>
      </section>

    </main>
  );
}
