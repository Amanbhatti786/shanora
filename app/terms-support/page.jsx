'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const TERMS_SECTIONS = [
  {
    title: '1. Account & Profile Responsibility',
    body: 'Users must provide accurate identity, contact, and career details. Sharing login credentials or impersonating another individual or organization is strictly prohibited on SHANORA.'
  },
  {
    title: '2. Job Postings & Recruitment Conduct',
    body: 'Employers are solely responsible for the accuracy, legality, compensation transparency, and timely status updates of their job listings. Fake job postings, advance-fee scams, or misleading recruitment offers are removed immediately.'
  },
  {
    title: '3. Candidate Applications & Resume Data',
    body: 'Candidates submit resumes, cover notes, and profile information voluntarily when applying for roles. Applicants should ensure their uploaded CVs do not contain sensitive government IDs or unauthorized third-party data.'
  },
  {
    title: '4. Platform Safety, Moderation & Suspension',
    body: 'SHANORA reserves the right to review reported listings, restrict abusive accounts, close expired or policy-violating jobs, and update platform features to maintain a safe professional network.'
  },
  {
    title: '5. Subscriptions, Digital Tools & Availability',
    body: 'Free and PRO features, resume templates, and automated notifications are provided on an as-available basis. Service interruptions may occur during maintenance or network updates.'
  }
];

const SUPPORT_FAQS = [
  {
    q: 'How do I post, edit, or close a job?',
    a: 'Go to Jobs → + Post Job to create a listing (or save as Draft), then use Employer Hub to edit details, schedule interviews, update candidate status, or close/reopen the job.'
  },
  {
    q: 'Why is my application status or alert showing in Alerts?',
    a: 'Whenever an employer reviews, shortlists, schedules an interview, or updates your application status, a real-time notification is sent to your Alerts tab.'
  },
  {
    q: 'How does the mobile Back button behave?',
    a: 'Safe back navigation returns you cleanly without unexpectedly jumping across unrelated tabs when closing views or returning to the previous screen.'
  }
];

export default function TermsAndSupportHub() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);

  const [supportCategory, setSupportCategory] = useState('Jobs & Hiring');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  const [notice, setNotice] = useState(null);

  const showNotice = useCallback((type, text) => {
    setNotice({ type, text });
    setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (active) setUser(session?.user || null);
    }
    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const handleSafeBack = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      window.history.length > 1 &&
      document.referrer.startsWith(window.location.origin)
    ) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  async function handleAcceptTerms() {
    if (!agreedTerms) {
      showNotice('error', 'Please check the box to confirm you agree to the Terms & Conditions.');
      return;
    }

    setSavingTerms(true);
    try {
      if (user) {
        const emailLower = (user.email || '').trim().toLowerCase();
        await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .ilike('email', emailLower);
      }
      showNotice('success', 'Terms & Conditions acknowledged and saved.');
    } catch (err) {
      showNotice('error', 'Could not save acknowledgment: ' + err.message);
    } finally {
      setSavingTerms(false);
    }
  }

  async function handleSupportSubmit(e) {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMsg.trim()) {
      showNotice('error', 'Please enter both a subject and message for Help & Support.');
      return;
    }

    setSubmittingTicket(true);
    const ticketCode = '#SH-' + Math.floor(10000 + Math.random() * 90000);

    try {
      if (user?.email) {
        const emailLower = user.email.trim().toLowerCase();
        await supabase.from('notifications').insert([
          {
            recipient_email: emailLower,
            sender_name: 'SHANORA Help & Support',
            sender_email: emailLower,
            action_type: 'support_ticket',
            content: `Ticket ${ticketCode} [${supportCategory}]: ${supportSubject.trim()} — ${supportMsg.trim()}`,
            is_read: false
          }
        ]);
      }

      setSupportSubject('');
      setSupportMsg('');
      showNotice('success', `Help & Support ticket ${ticketCode} submitted successfully.`);
    } catch (err) {
      showNotice('error', 'Failed to submit support request: ' + err.message);
    } finally {
      setSubmittingTicket(false);
    }
  }

  const cardBox = {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    padding: '1.2rem',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
  };

  const subCard = {
    backgroundColor: '#131b2e',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '0.9rem 1rem'
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.7rem 0.8rem',
    color: '#fff',
    fontSize: '0.84rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '4rem', overflowX: 'hidden' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#070b14', borderBottom: '1px solid #1e293b', padding: '0.65rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={handleSafeBack}
              style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              ←
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', backgroundColor: '#0f172a', padding: '0.35rem 0.85rem', borderRadius: '14px', border: '1px solid #1e293b', height: '38px', boxSizing: 'border-box' }}>
              <span style={{ backgroundColor: '#0284c7', color: '#fff', fontWeight: '900', fontSize: '0.95rem', width: '26px', height: '26px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                S
              </span>
              <span style={{ fontWeight: '900', fontSize: '1.05rem', color: '#fff' }}>
                SHANORA<span style={{ color: '#38bdf8', fontSize: '0.78rem' }}>.PK</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <a href="#terms-section" style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #1e293b', borderRadius: '9px', padding: '0.38rem 0.7rem', fontSize: '0.75rem', fontWeight: '800', textDecoration: 'none' }}>
              Terms
            </a>
            <a href="#help-support-section" style={{ backgroundColor: '#0284c7', color: '#fff', borderRadius: '9px', padding: '0.38rem 0.7rem', fontSize: '0.75rem', fontWeight: '800', textDecoration: 'none' }}>
              Help & Support
            </a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '760px', margin: '1.1rem auto', padding: '0 0.85rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxSizing: 'border-box' }}>
        {notice && (
          <div style={{
            backgroundColor: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
            color: notice.type === 'error' ? '#fca5a5' : '#6ee7b7',
            borderRadius: '12px',
            padding: '0.8rem 1rem',
            fontSize: '0.84rem',
            fontWeight: '700'
          }}>
            {notice.text}
          </div>
        )}

        {/* 1. TERMS AND CONDITIONS */}
        <section id="terms-section" style={cardBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #1e293b', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>
                📜 Terms & Conditions
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Platform usage, recruitment conduct, and safety guidelines for SHANORA
              </p>
            </div>
            <span style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.35)', fontSize: '0.7rem', fontWeight: '800', padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
              Effective 2026
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {TERMS_SECTIONS.map((sec) => (
              <div key={sec.title} style={subCard}>
                <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.88rem', marginBottom: '0.3rem' }}>
                  {sec.title}
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.55 }}>
                  {sec.body}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', borderTop: '1px solid #1e293b', paddingTop: '0.9rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: '700' }}>
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ width: '17px', height: '17px' }}
              />
              <span>I have read and agree to SHANORA&apos;s Terms & Conditions</span>
            </label>

            <button
              type="button"
              disabled={savingTerms}
              onClick={handleAcceptTerms}
              style={{
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.6rem 1.15rem',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              {savingTerms ? 'Saving...' : 'Accept & Save'}
            </button>
          </div>
        </section>

        {/* 2. HELP & SUPPORT (IMMEDIATELY AFTER TERMS & CONDITIONS) */}
        <section id="help-support-section" style={cardBox}>
          <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: '#fff' }}>
              🆘 Help & Support Center
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Find quick answers or submit a support ticket directly to SHANORA
            </p>
          </div>

          {/* Quick FAQs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.15rem' }}>
            {SUPPORT_FAQS.map((item, idx) => {
              const expanded = openFaqIdx === idx;
              return (
                <div key={item.q} style={subCard}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(expanded ? -1 : idx)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      padding: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{item.q}</span>
                    <span style={{ color: '#38bdf8' }}>{expanded ? '−' : '+'}</span>
                  </button>
                  {expanded && (
                    <div style={{ color: '#94a3b8', fontSize: '0.79rem', lineHeight: 1.5, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #1e293b' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Support Ticket Form */}
          <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.7rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Topic
                </label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Jobs & Hiring">Jobs & Hiring</option>
                  <option value="CV Studio & PDF">CV Studio & PDF</option>
                  <option value="Account & Security">Account & Security</option>
                  <option value="Report Abuse / Scam">Report Abuse / Scam</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Issue with job application or profile"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.35rem' }}>
                How can we help? *
              </label>
              <textarea
                rows={3}
                placeholder="Describe your issue or question clearly..."
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={submittingTicket}
              style={{
                backgroundColor: '#22c55e',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              {submittingTicket ? 'Submitting Ticket...' : 'Submit Support Request'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
