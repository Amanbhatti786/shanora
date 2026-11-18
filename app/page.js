import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070b14',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Header / Brand */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#fff'
          }}>
            S
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            SHANORA<span style={{ color: '#3b82f6' }}>.PK</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/auth?mode=login" style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#f8fafc',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px 0'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          Pakistan's Premier Professional Network
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          lineHeight: '1.2',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          Connect, Grow & Hire <br />
          <span style={{ color: '#3b82f6' }}>Professional Talent</span>
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          maxWidth: '320px',
          lineHeight: '1.5',
          marginBottom: '28px'
        }}>
          Build ATS-friendly resumes, discover executive career opportunities, and collaborate with verified creators and employers.
        </p>

        {/* Action Buttons (LinkedIn / Facebook Style Card Stack) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px' }}>
          <Link href="/auth?mode=register" style={{
            backgroundColor: '#3b82f6',
            color: '#fff',
            padding: '12px',
            borderRadius: '24px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            textAlign: 'center'
          }}>
            Join SHANORA - It's Free
          </Link>

          <Link href="/auth?mode=login" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#f8fafc',
            padding: '12px',
            borderRadius: '24px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            Existing User? Sign In
          </Link>
        </div>

        {/* Mini Trust Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '36px',
          width: '100%',
          maxWidth: '320px',
          textAlign: 'left'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>💼</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>Job Portal</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Find top local & remote roles</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>📄</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>ATS Resumes</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Build professional CVs</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        fontSize: '11px',
        color: '#64748b',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        &copy; {new Date().getFullYear()} SHANORA.PK &bull; All rights reserved.
      </footer>
    </div>
  );
            }
              
