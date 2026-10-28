'use client';
import Link from 'next/link';

export default function HomePage() {
  const categories = [
    { title: 'Software & Web Dev', icon: '💻', count: '320+ Profiles' },
    { title: 'Data & AI Engineering', icon: '🤖', count: '140+ Profiles' },
    { title: 'Graphic & UI/UX Design', icon: '🎨', count: '210+ Profiles' },
    { title: 'Finance & Accounts', icon: '📊', count: '180+ Profiles' },
    { title: 'Digital Marketing & Sales', icon: '🚀', count: '190+ Profiles' },
    { title: 'Content & Copywriting', icon: '✍️', count: '110+ Profiles' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Create Your Verified Profile',
      desc: 'Apni university, GPA, skills, final year project aur resume link add karein.',
    },
    {
      num: '02',
      title: 'Run Instant ATS Scanner',
      desc: 'Apna CV check karein aur job keywords ke hisaab se optimize karein.',
    },
    {
      num: '03',
      title: 'Direct WhatsApp Recruiter Connect',
      desc: 'Employers aapki live profile dekh kar direct WhatsApp par interview schedule karte hain.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Alert Bar */}
      <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.45rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#38bdf8' }}>
        🇵🇰 Pakistan's #1 Career Network & Digital Portfolio for Fresh Graduates
      </div>

      {/* Modern Navigation Header */}
      <header style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
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
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
        </Link>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/ats-checker" style={{ 
            backgroundColor: '#1e293b', 
            color: '#cbd5e1', 
            padding: '0.5rem 0.9rem', 
            borderRadius: '8px', 
            textDecoration: 'none', 
            fontSize: '0.85rem', 
            fontWeight: '600', 
            border: '1px solid #334155' 
          }}>
            ATS Scanner ⚡
          </Link>
          <Link href="/auth" style={{ 
            backgroundColor: '#0284c7', 
            color: '#ffffff', 
            padding: '0.5rem 1.1rem', 
            borderRadius: '8px', 
            textDecoration: 'none', 
            fontSize: '0.85rem', 
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
          }}>
            Sign In / Join 👤
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '950px', margin: '0 auto', padding: '4rem 1.25rem 2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '0.35rem 0.9rem', backgroundColor: '#1e293b', borderRadius: '50px', fontSize: '0.8rem', color: '#38bdf8', border: '1px solid #334155', marginBottom: '1.25rem', fontWeight: '600' }}>
          ✨ The Smart Way to Get Hired in Pakistan
        </div>

        <h1 style={{ fontSize: 'clamp(2.1rem, 5vw, 3.4rem)', fontWeight: '900', lineHeight: '1.2', marginBottom: '1.2rem', color: '#ffffff' }}>
          Skip Job Queues. <br />
          <span style={{ 
            background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Showcase Your Talent Directly to Employers.
          </span>
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          Traditional CVs get lost in inbox clutter. Shanora gives Pakistani students verified digital portfolio links with integrated ATS resume analysis and 1-click WhatsApp recruiter contact.
        </p>

        {/* Main CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <Link href="/auth" style={{ 
            backgroundColor: '#0284c7', 
            color: '#ffffff', 
            padding: '0.9rem 1.8rem', 
            borderRadius: '10px', 
            textDecoration: 'none', 
            fontWeight: '700', 
            fontSize: '1rem',
            boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)'
          }}>
            Build Free Student Profile 🎓
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
            Scan Resume for ATS ⚡
          </Link>
        </div>

        {/* Live Metrics Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '1rem',
          maxWidth: '780px',
          margin: '0 auto',
          padding: '1.25rem',
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          border: '1px solid #1e293b'
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#38bdf8' }}>1,200+</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Student Profiles</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#38bdf8' }}>35+</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Pakistani Universities</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#22c55e' }}>85%</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Faster Recruiter Response</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fbbf24' }}>100%</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Free For Students</div>
          </div>
        </div>
      </section>

      {/* Explore In-Demand Career Fields */}
      <section style={{ maxWidth: '1050px', margin: '3rem auto', padding: '0 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0' }}>Explore In-Demand Career Categories</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Find what local companies and remote startups in Pakistan are looking for</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '1rem' 
        }}>
          {categories.map((cat, i) => (
            <div key={i} style={{ 
              backgroundColor: '#0f172a', 
              padding: '1.25rem', 
              borderRadius: '12px', 
              border: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '1.8rem', backgroundColor: '#1e293b', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                {cat.icon}
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.98rem', color: '#ffffff' }}>{cat.title}</h4>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{cat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How Shanora Works (3 Steps) */}
      <section style={{ maxWidth: '1050px', margin: '4rem auto', padding: '0 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0' }}>How Shanora Gets You Hired</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>3 simple steps from graduating to your first interview call</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {steps.map((st, i) => (
            <div key={i} style={{ 
              backgroundColor: '#0f172a', 
              padding: '1.75rem', 
              borderRadius: '16px', 
              border: '1px solid #1e293b',
              position: 'relative'
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'rgba(56, 189, 248, 0.3)', marginBottom: '0.5rem' }}>
                {st.num}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', margin: '0 0 0.6rem 0' }}>
                {st.title}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section style={{ maxWidth: '950px', margin: '4rem auto 2rem', padding: '0 1.25rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)', 
          border: '1px solid #0284c7', 
          borderRadius: '20px', 
          padding: '3rem 1.5rem', 
          textAlign: 'center' 
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff', marginBottom: '0.8rem' }}>
            Ready to stand out in the job market?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '550px', margin: '0 auto 1.8rem' }}>
            Build your live portfolio today and share it with recruiters on LinkedIn and job applications.
          </p>
          <Link href="/auth" style={{ 
            backgroundColor: '#0284c7', 
            color: '#ffffff', 
            padding: '0.85rem 2rem', 
            borderRadius: '10px', 
            textDecoration: 'none', 
            fontWeight: '700', 
            fontSize: '1rem',
            display: 'inline-block',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.5)'
          }}>
            Get Started Now — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e293b', marginTop: '4rem', padding: '2rem 1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        <div style={{ marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>Shanora PK 🎓</div>
        © {new Date().getFullYear()} Shanora PK. All rights reserved. Connecting Pakistan’s Young Talent with Opportunities.
      </footer>

    </div>
  );
          }
              
