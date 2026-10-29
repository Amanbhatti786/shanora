'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function PageMonetizationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Application form fields
  const [applicantCountry, setApplicantCountry] = useState('Pakistan');
  const [taxIdentifier, setTaxIdentifier] = useState('');
  const [primaryMethod, setPrimaryMethod] = useState('sponsored_posts');
  const [trafficDetails, setTrafficDetails] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  useEffect(() => {
    async function loadMonetizationData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        // Fetch pages managed by the logged-in user
        const { data: userPages } = await supabase
          .from('pages')
          .select('*')
          .eq('owner_email', session.user.email);

        if (userPages && userPages.length > 0) {
          setPages(userPages);
          setSelectedPage(userPages[0]);
        }
      } catch (err) {
        console.error('Monetization loader error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMonetizationData();
  }, [router]);

  async function handleApplyMonetization(e) {
    e.preventDefault();
    if (!selectedPage) return;
    setSubmitting(true);

    try {
      const payload = {
        page_id: selectedPage.id,
        applicant_email: user.email,
        country: applicantCountry,
        tax_identifier: taxIdentifier.trim(),
        primary_method: primaryMethod,
        traffic_details: trafficDetails.trim(),
        status: 'pending'
      };

      const { error } = await supabase.from('monetization_applications').insert([payload]);
      if (error) throw error;

      await supabase.from('pages').update({ monetization_status: 'pending' }).eq('id', selectedPage.id);
      setSelectedPage({ ...selectedPage, monetization_status: 'pending' });
      setApplicationSubmitted(true);
    } catch (err) {
      alert('Application failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading Monetization Dashboard...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: '900', fontSize: '1.2rem' }}>
          SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/feed" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', textDecoration: 'none', border: '1px solid #334155' }}>
            Feed 🌐
          </Link>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', textDecoration: 'none', border: '1px solid #334155' }}>
            Portal 💼
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '950px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', color: '#fff', margin: '0 0 0.3rem 0' }}>Page Monetization Dashboard</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Manage monetization applications, creator programs, and financial settings for verified Pages.
          </p>
        </div>

        {/* Integration Notice */}
        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '10px', padding: '0.9rem', marginBottom: '1.5rem', color: '#fef08a', fontSize: '0.82rem', lineHeight: 1.5 }}>
          ⚠️ <strong>Integration Status:</strong> Payment gateway webhooks and automated bank payouts are currently pending configuration. Eligible applications will be recorded and audited in Supabase; live bank transfers will activate once financial provider keys are deployed.
        </div>

        {pages.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>No Organization or Creator Pages Found</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              You must own or manage an active Page (Company, Institution, or Creator Community) to apply for monetization.
            </p>
            <Link href="/profile" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 'bold' }}>
              Go to Portal & Create Page
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Left Column: Eligibility & Performance Overview */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.2rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 1rem 0' }}>Monetization Eligibility Checklist</h3>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem' }}>
                <li style={{ color: '#22c55e' }}>✓ Page Ownership Authenticated ({selectedPage?.name})</li>
                <li style={{ color: '#22c55e' }}>✓ Community Guidelines Compliance: Clean Record</li>
                <li style={{ color: '#cbd5e1' }}>○ Active Monthly Audience / Engagement Verification</li>
                <li style={{ color: '#cbd5e1' }}>○ Tax Identification & Identity Check</li>
              </ul>

              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 0.6rem 0' }}>Financial Ledger Overview</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Estimated Balance:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>$0.00 USD</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Available for Payout:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#22c55e' }}>$0.00 USD</strong>
                </div>
              </div>
            </div>

            {/* Right Column: Application Form */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.2rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 0.8rem 0' }}>Apply for Page Monetization</h3>
              
              {applicationSubmitted || selectedPage?.monetization_status === 'pending' ? (
                <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', padding: '1rem', borderRadius: '8px', color: '#38bdf8', fontSize: '0.85rem' }}>
                  Application submitted and pending review by platform administrators. You will receive an on-platform notification upon status update.
                </div>
              ) : (
                <form onSubmit={handleApplyMonetization} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Applicant Country</label>
                    <input
                      type="text"
                      value={applicantCountry}
                      onChange={e => setApplicantCountry(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Tax / Business ID Number</label>
                    <input
                      type="text"
                      placeholder="e.g. NTN, EIN, or VAT ID"
                      value={taxIdentifier}
                      onChange={e => setTaxIdentifier(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Preferred Monetization Program</label>
                    <select
                      value={primaryMethod}
                      onChange={e => setPrimaryMethod(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    >
                      <option value="sponsored_posts">Sponsored Brand Posts & Campaigns</option>
                      <option value="subscriptions">Paid Page Subscriptions</option>
                      <option value="content_sales">Digital Products & Course Sales</option>
                      <option value="events">Paid Workshops & Online Events</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Audience & Content Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Describe your content niche and audience metrics..."
                      value={trafficDetails}
                      onChange={e => setTrafficDetails(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application 🚀'}
                  </button>
                </form>
              )}
            </div>

          </div>
        )}
      </main>

    </div>
  );
}
  
