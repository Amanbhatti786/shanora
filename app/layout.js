import Link from 'next/link';

export const metadata = {
  title: 'Shanora - Pakistan Career Intelligence & Verified Opportunities',
  description: 'AI Career Roadmaps, ATS Resume Checker & Verified Entry-Level Jobs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <nav style={{ backgroundColor: '#131b2e', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 50, padding: '0.85rem 1.25rem' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8' }}>SHANORA</span>
              <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>PK</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.85rem' }}>Roadmap</Link>
              <Link href="/ats-checker" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.85rem' }}>ATS Scanner</Link>
              <Link href="/profile" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>Student Portal</Link>
              <Link href="/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.8rem', border: '1px solid #334155', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Admin</Link>
              <a 
                href="https://whatsapp.com/channel/0029VbDvJtl5a242cAW6DF2s" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ backgroundColor: '#22c55e', color: '#090d16', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', padding: '0.3rem 0.7rem', borderRadius: '6px' }}
              >
                WhatsApp ⚡
              </a>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
