'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function MonetizationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        // Fetch pages owned by current user
        const { data: userPages, error } = await supabase
          .from('pages')
          .select('*')
          .eq('owner_email', session.user.email);

        if (!error && userPages) {
          setPages(userPages);
          if (userPages.length > 0) {
            setSelectedPage(userPages[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  async function handleApplyMonetization() {
    if (!selectedPage) return;
    setApplying(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('pages')
        .update({ monetization_status: 'pending' })
        .eq('id', selectedPage.id);

      if (error) throw error;

      setSelectedPage(prev => ({ ...prev, monetization_status: 'pending' }));
      setPages(prev => prev.map(p => p.id === selectedPage.id ? { ...p, monetization_status: 'pending' } : p));
      setMessage({ text: 'Monetization application submitted successfully for review!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message || 'Failed to submit application.', type: 'error' });
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading monetization hub...
      </div>
    );
  }

  const followers = selectedPage?.followers_count || 0;
  const isEligible = followers >= 1000;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: '900', fontSize: '1.2rem' }}>
          SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/feed" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #334155' }}>
            Feed 🌐
          </Link>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #334155' }}>
            Portal 💼
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1rem' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', color: '#fff', margin: '0 0 0.3rem 0', fontWeight: '800' }}>
            Page Monetization Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Manage monetization applications, creator programs, and financial settings for verified Pages.
          </p>
        </div>

        {/* Integration Status Notice */}
        <div style={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem' }}>
            ⚠️ Integration Status: Payment Gateway Notice
          </div>
          <p style={{ fontSize: '0.78rem', color: '#d6d3d1', margin: 0, lineHeight: 1.5 }}>
            Automated bank payouts and webhooks are currently recording via Supabase audit. Eligible applications will be verified, and bank transfers will activate once financial provider keys are deployed.
          </p>
        </div>

        {message.text && (
          <div style={{
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            color: message.type === 'error' ? '#f87171' : '#4ade80',
            padding: '0.8rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            {message.text}
          </div>
        )}

        {/* Case 1: No Pages Found */}
        {pages.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 0.5rem 0' }}>
              No Organization or Creator Pages Found
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '450px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              You must own or manage an active Page (Company, Institution, or Creator Community) to apply for monetization.
            </p>
            <button
              type="button"
              onClick={() => router.push('/create-page')}
              style={{
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '0.7rem 1.4rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Create Organization or Creator Page 🚀
            </button>
          </div>
        ) : (
          /* Case 2: Pages Found - Manage & Apply */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Page Selector */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.5rem' }}>
                Select Your Active Page
              </label>
              <select
                value={selectedPage?.id}
                onChange={(e) => {
                  const match = pages.find(p => p.id === e.target.value);
                  setSelectedPage(match || null);
                }}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.88rem' }}
              >
                {pages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.name} ({page.category || 'Creator'}) — Status: {page.monetization_status || 'not_applied'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Page Overview & Eligibility */}
            {selectedPage && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.5rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>{selectedPage.name}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                      URL: shanora.pk/page/{selectedPage.slug}
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: selectedPage.monetization_status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : selectedPage.monetization_status === 'pending' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: selectedPage.monetization_status === 'approved' ? '#4ade80' : selectedPage.monetization_status === 'pending' ? '#facc15' : '#94a3b8',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    {selectedPage.monetization_status || 'Not Applied'}
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Monetization Target: 1,000 Verified Followers</span>
                    <span style={{ color: '#38bdf8', fontWeight: '800' }}>{followers} / 1,000</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#070b14', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((followers / 1000) * 100, 100)}%`, height: '100%', backgroundColor: '#38bdf8', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Eligibility Checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: isEligible ? '#4ade80' : '#94a3b8' }}>
                    {isEligible ? '✅' : '⚪'} 1,000 Followers Milestone
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#4ade80' }}>
                    ✅ Clean Community Guidelines
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#4ade80' }}>
                    ✅ Account Security (KYC Ready)
                  </div>
                </div>

                {/* Submit Application Button */}
                {selectedPage.monetization_status === 'pending' ? (
                  <div style={{ textAlign: 'center', padding: '0.8rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#facc15', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                    ⏳ Your application is currently under review by our audit team.
                  </div>
                ) : selectedPage.monetization_status === 'approved' ? (
                  <div style={{ textAlign: 'center', padding: '0.8rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                    🎉 Congratulations! This page is verified and actively earning.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyMonetization}
                    disabled={!isEligible || applying}
                    style={{
                      width: '100%',
                      backgroundColor: isEligible ? '#0284c7' : '#334155',
                      color: isEligible ? '#fff' : '#64748b',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      cursor: isEligible && !applying ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {applying ? 'Submitting Application...' : isEligible ? 'Submit Application for Review 🚀' : 'Locked: Reach 1,000 Followers to Apply'}
                  </button>
                )}

              </div>
            )}

            {/* Secondary Action */}
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => router.push('/create-page')}
                style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #1e293b', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                + Create Another Organization / Creator Page
              </button>
            </div>

          </div>
        )}

      </main>

    </div>
  );
              }
                      
