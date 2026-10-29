import Link from 'next/link';

export const metadata = {
  title: 'SHANORA — Global Professional Networking & Career Platform',
  description: 'Connecting People. Empowering Careers. Building the Future. A ShanTech Project.',
};

export default function HomePage() {
  const categories = [
    { name: 'Software & Technology', count: 'Engineering, Cloud, Web3', icon: '💻' },
    { name: 'Finance & Banking', count: 'Accounting, Auditing, FinTech', icon: '📊' },
    { name: 'Healthcare & Sciences', count: 'Clinical, Pharma, Biotech', icon: '🩺' },
    { name: 'Creative Arts & Media', count: 'Design, Animation, Marketing', icon: '🎨' },
    { name: 'Education & Research', count: 'Teaching, Academia, Training', icon: '🎓' },
    { name: 'Engineering & Construction', count: 'Civil, Electrical, Mech', icon: '⚙️' },
  ];

  const faqs = [
    {
      q: 'What is SHANORA?',
      a: 'SHANORA is an international professional networking, career advancement, and verified talent platform developed under the ShanTech technology brand.'
    },
    {
      q: 'Is SHANORA only for users in Pakistan?',
      a: 'No. SHANORA is built for international professionals, students, recruiters, and companies across all countries, supporting remote and local opportunities.'
    },
    {
      q: 'How does Page Monetization work?',
      a: 'Eligible organization and creator Pages can apply for monetization once community criteria are met. Actual payouts require verified identity, tax details, and supported payment provider connections.'
    },
    {
      q: 'Is the platform free to join?',
      a: 'Yes. Core networking, professional profiles, job search, and community feed access are completely free for all members.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. Global Navigation Bar */}
      <header style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.5rem', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.5px', color: '#ffffff' }}>
              SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
            </span>
          </Link>
          <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700' }}>
            A ShanTech Project
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/feed" style={{ color: '#cbd5e1', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600', padding: '0.4rem 0.6rem' }}>
            Feed 🌐
          </Link>
          <Link href="/messages" style={{ color: '#cbd5e1', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600', padding: '0.4rem 0.6rem' }}>
            Messages 💬
          </Link>
          <Link href="/profile" style={{ color: '#cbd5e1', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600', padding: '0.4rem 0.6rem' }}>
            Students & Portal 🎓
          </Link>
          <Link href="/auth" style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '700', padding: '0.5rem 1.1rem', borderRadius: '8px' }}>
            Sign In / Join ➔
          </Link>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem 3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', backgroundColor: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.3)', borderRadius: '30px', padding: '0.35rem 1rem', marginBottom: '1.2rem' }}>
          <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: '700' }}>Global Professional Network & Opportunities Hub</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.1rem, 5vw, 3.4rem)', fontWeight: '900', lineHeight: 1.15, margin: '0 0 1.2rem 0', color: '#ffffff' }}>
          Connecting People. Empowering Careers. <br />
          <span style={{ color: '#38bdf8' }}>Building the Future.</span>
        </h1>
        <p style={{ maxWidth: '750px', margin: '0 auto 2rem auto', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
          SHANORA unites global students, verified job seekers, educational institutions, and multinational employers on a unified platform featuring ATS resumes, direct messaging, and verifiable creator pages.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/auth" style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.85rem 1.8rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', textDecoration: 'none' }}>
            Create Free Account
          </Link>
          <Link href="/feed" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.85rem 1.8rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', textDecoration: 'none' }}>
            Explore Community Feed
          </Link>
        </div>
      </section>

      {/* 3. Global Career Categories */}
      <section style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.8rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#ffffff' }}>Explore Global Careers</h2>
            <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Find internships and opportunities across leading industries worldwide</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {categories.map((c, i) => (
            <div key={i} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '1.2rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{c.icon}</div>
              <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 0.25rem 0' }}>{c.name}</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>{c.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Tier Comparison & Transparency */}
      <section style={{ maxWidth: '1100px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#ffffff', margin: '0 0 0.5rem 0' }}>Transparent Membership Structure</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Full transparency: core career tools remain free for all global users</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '1.8rem', borderRadius: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>Basic Tier</span>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0.4rem 0 0.8rem 0' }}>SHANORA Free</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Standard access for students and professionals starting their career journey.
            </p>
            <ul style={{ paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <li>Full public profile & portfolio</li>
              <li>Community feed posting & attachments</li>
              <li>1-to-1 direct messaging</li>
              <li>Standard job and internship search</li>
              <li>Basic resume upload</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '1.8rem', borderRadius: '14px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#0284c7', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
              Pro Upgrade
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>Professional Tier</span>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0.4rem 0 0.8rem 0' }}>SHANORA Pro</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Enhanced visibility, profile analytics, and advanced application prioritization.
            </p>
            <ul style={{ paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <li>Verified Pro profile badge</li>
              <li>Featured candidate spotlight in recruiter portals</li>
              <li>Detailed profile view insights & analytics</li>
              <li>Future AI Resume Scanner diagnostics (requires API config)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. FAQs */}
      <section style={{ maxWidth: '850px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#ffffff', textAlign: 'center', marginBottom: '1.5rem' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '1.1rem', borderRadius: '10px' }}>
              <strong style={{ fontSize: '0.9rem', color: '#38bdf8', display: 'block', marginBottom: '0.4rem' }}>{f.q}</strong>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Footer */}
      <footer style={{ borderTop: '1px solid #1e293b', backgroundColor: '#0b1120', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 'bold', color: '#fff', margin: '0 0 0.4rem 0' }}>
          SHANORA — A ShanTech Project
        </p>
        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 1.2rem 0' }}>
          Connecting People. Empowering Careers. Building the Future.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', fontSize: '0.8rem', color: '#94a3b8', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/community" style={{ color: '#94a3b8', textDecoration: 'none' }}>Community Guidelines</Link>
          <Link href="/support" style={{ color: '#94a3b8', textDecoration: 'none' }}>Support & Contact</Link>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: '1.5rem' }}>
          © 2026 SHANORA. Built with Next.js & Supabase.
        </p>
      </footer>

    </div>
  );
                         }
              
