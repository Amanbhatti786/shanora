import Link from 'next/link';

export const metadata = {
  title: 'About SHANORA | Global Professional Network',
  description: 'Learn about SHANORA, our mission, CV Studio, PRO memberships, Ad Campaigns, and global career networking.'
};

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#070b14',
        backgroundImage:
          'radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.12), transparent 45%), radial-gradient(circle at 85% 80%, rgba(59, 130, 246, 0.12), transparent 45%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '28px 16px'
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                color: '#fff'
              }}
            >
              S
            </span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>
              SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
            </span>
          </Link>

          <Link
            href="/auth"
            style={{
              textDecoration: 'none',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: '700'
            }}
          >
            ← Back to Sign In / Auth
          </Link>
        </div>

        <section
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', letterSpacing: '1.1px', textTransform: 'uppercase' }}>
            ABOUT SHANORA
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: '800', margin: 0, color: '#fff' }}>
            Connecting Talent, Opportunities &amp; Growth Across Borders
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.65', margin: 0 }}>
            SHANORA is a modern professional networking, social community, and career platform designed to help students, job seekers, freelancers, and businesses build meaningful connections and grow together.
          </p>
          <p style={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: '1.65', margin: 0 }}>
            From creating your professional identity and exporting resumes via CV Studio to unlocking SHANORA PRO, launching Ad Campaigns, and exploring Monetization tools, SHANORA brings practical career and community features into one unified platform.
          </p>
        </section>
      </div>
    </main>
  );
}
