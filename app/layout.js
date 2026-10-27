import Link from 'next/link';

export const metadata = {
  title: 'Shanora - Pakistan Career Intelligence & Opportunities',
  description: 'AI Career Roadmaps, ATS Resume Checker & Verified Jobs for Pakistani Graduates',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Global Shanora Navbar */}
        <nav style={{ backgroundColor: '#131b2e', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 50, padding: '0.85rem 1.25rem' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '-0.03em' }}>SHANORA</span>
              <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>PK</span>
            </Link>

            {/* Navigation Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500' }}>
                Roadmap
              </Link>
              <Link href="/ats-checker" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500' }}>
                ATS Scanner
              </Link>
              <Link href="/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.82rem', border: '1px solid #334155', padding: '0.3rem 0.65rem', borderRadius: '6px' }}>
                Admin Panel
              </Link>
              <a 
                href="https://whatsapp.com/channel/0029VbDvJtl5a242cAW6DF2s" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ backgroundColor: '#22c55e', color: '#090d16', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '700', padding: '0.35rem 0.85rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <span>WhatsApp</span> ⚡
              </a>
            </div>

          </div>
        </nav>

        {/* Page Content */}
        {children}

      </body>
    </html>
  );
}
