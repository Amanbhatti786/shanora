import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | SHANORA',
  description: 'Review the Terms & Conditions for using SHANORA accounts, job listings, and community features.'
};

export default function TermsPage() {
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
          <Link href="/" style={{ textDecoration: 'none', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
            SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
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
            TERMS &amp; CONDITIONS
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#fff' }}>
            SHANORA Terms of Service
          </h1>

          <div style={{ backgroundColor: '#111b2e', border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '12px', padding: '14px' }}>
            <h2 style={{ fontSize: '14.5px', fontWeight: '700', margin: '0 0 6px', color: '#38bdf8' }}>1. Account Accuracy &amp; Conduct</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              Members agree to provide truthful profile information, respect community guidelines, and refrain from spam, impersonation, or abusive activity.
            </p>
          </div>

          <div style={{ backgroundColor: '#111b2e', border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '12px', padding: '14px' }}>
            <h2 style={{ fontSize: '14.5px', fontWeight: '700', margin: '0 0 6px', color: '#38bdf8' }}>2. Opportunities, PRO &amp; Promotions</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              Job posts, promotional campaigns, and PRO features must follow platform standards. Content that violates policies or misleads users may be removed.
            </p>
          </div>

          <div style={{ backgroundColor: '#111b2e', border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '12px', padding: '14px' }}>
            <h2 style={{ fontSize: '14.5px', fontWeight: '700', margin: '0 0 6px', color: '#38bdf8' }}>3. Service Updates</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              SHANORA may update features, security measures, and terms as the platform evolves. Continued use of the platform indicates acceptance of current terms.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
