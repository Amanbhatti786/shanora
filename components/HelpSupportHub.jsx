'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const FAQ_ITEMS = [
  {
    q: 'How do I post, edit, or close a job in Jobs Hub?',
    a: 'Open Jobs → + Post Job, complete Step 1 and Step 2 (or save as Draft), and then use Employer Hub to edit details, schedule interviews, update candidate status, or close/reopen listings.'
  },
  {
    q: 'How do I unlock PRO templates or download my A4 CV PDF?',
    a: 'Free templates (1–4) can be edited and exported as PDF right away. PRO templates (5–12) and AI tools unlock automatically once your account has active PRO status in SHANORA.'
  },
  {
    q: 'Why is my application status or alert showing in Alerts?',
    a: 'Whenever an employer reviews, shortlists, schedules an interview, or updates your application status, a real-time notification is recorded and appears in your Alerts tab.'
  },
  {
    q: 'How do I add another account or log out safely?',
    a: 'In the Menu tab, use Add Account to open the login/sign-up screen or Log Out to sign out of your current session.'
  }
];

export default function HelpSupportHub({ onClose }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  const [category, setCategory] = useState('Jobs & Hiring');
  const [priority, setPriority] = useState('Normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const showNotice = useCallback((type, text) => {
    setNotice({ type, text });
    setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const loadUserAndTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser?.email) {
        const emailLower = currentUser.email.trim().toLowerCase();
        const { data, error } = await supabase
          .from('notifications')
          .select('id, content, created_at, is_read')
          .ilike('recipient_email', emailLower)
          .eq('action_type', 'support_ticket')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && Array.isArray(data)) {
          setTickets(data);
        }
      }
    } catch (err) {
      console.error('Error loading support tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    loadUserAndTickets();
  }, [loadUserAndTickets]);

  function handleBack() {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile?tab=menu');
    }
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showNotice('error', 'Please enter both a subject and a detailed message.');
      return;
    }

    setSubmitting(true);
    const ticketId = '#SH-' + Math.floor(10000 + Math.random() * 90000);
    const formattedContent = `Ticket ${ticketId} [${category} • ${priority}]: ${subject.trim()} — ${message.trim()}`;

    try {
      const emailLower = (user?.email || '').trim().toLowerCase();
      if (emailLower) {
        const { data: inserted, error } = await supabase
          .from('notifications')
          .insert([
            {
              recipient_email: emailLower,
              sender_name: 'SHANORA Help & Support',
              sender_email: emailLower,
              action_type: 'support_ticket',
              content: formattedContent,
              is_read: false
            }
          ])
          .select('id, content, created_at, is_read')
          .single();

        if (error) throw error;
        if (inserted) {
          setTickets((prev) => [inserted, ...prev]);
        }
      } else {
        setTickets((prev) => [
          {
            id: `local-${Date.now()}`,
            content: formattedContent,
            created_at: new Date().toISOString(),
            is_read: false
          },
          ...prev
        ]);
      }

      setSubject('');
      setMessage('');
      setPriority('Normal');
      showNotice('success', `Support ticket ${ticketId} created and saved.`);
    } catch (err) {
      showNotice('error', 'Could not submit ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const cardStyle = {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '14px',
    padding: '1rem',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
  };

  const innerCardStyle = {
    backgroundColor: '#131b2e',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    padding: '0.75rem 0.9rem'
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.68rem 0.8rem',
    color: '#fff',
    fontSize: '0.82rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', color: '#f8fafc' }}>
      {/* Top Bar */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={handleBack}
            style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#131b2e', border: '1px solid #334155', color: '#38bdf8', fontWeight: '800', cursor: 'pointer' }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: '900', color: '#fff' }}>🆘 Help & Support Center</div>
            <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>FAQs, issue reporting & ticket history</div>
          </div>
        </div>
        <span style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.35)', fontSize: '0.7rem', fontWeight: '800', padding: '0.22rem 0.6rem', borderRadius: '999px' }}>
          24/7 Desk
        </span>
      </div>

      {notice && (
        <div
          style={{
            backgroundColor: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
            color: notice.type === 'error' ? '#fca5a5' : '#6ee7b7',
            borderRadius: '10px',
            padding: '0.7rem 0.9rem',
            fontSize: '0.8rem',
            fontWeight: '700'
          }}
        >
          {notice.text}
        </div>
      )}

      {/* Submit Support Ticket Form */}
      <form onSubmit={handleCreateTicket} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>Submit a Support Request</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.3rem' }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              <option value="Jobs & Hiring">Jobs & Hiring</option>
              <option value="CV Studio & PDF">CV Studio & PDF</option>
              <option value="Account & Security">Account & Security</option>
              <option value="PRO & Billing">PRO & Billing</option>
              <option value="Report Bug / Safety">Report Bug / Safety</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.3rem' }}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.3rem' }}>Subject *</label>
          <input
            type="text"
            placeholder="Briefly summarize your issue or question"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.3rem' }}>Details *</label>
          <textarea
            rows={3}
            placeholder="Write what happened, which page you were on, or how we can help..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '0.72rem 1rem',
            fontSize: '0.84rem',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          {submitting ? 'Submitting Ticket...' : 'Create Support Ticket'}
        </button>
      </form>

      {/* Frequently Asked Questions */}
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', marginBottom: '0.15rem' }}>Common Questions</div>
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div key={item.q} style={innerCardStyle}>
              <button
                type="button"
                onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#f8fafc',
                  padding: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <span>{item.q}</span>
                <span style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div style={{ color: '#cbd5e1', fontSize: '0.77rem', lineHeight: 1.5, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #1e293b' }}>
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Support Tickets */}
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>Your Recent Tickets ({tickets.length})</div>
        {loadingTickets ? (
          <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>No support tickets submitted yet.</div>
        ) : (
          tickets.map((t) => (
            <div key={t.id} style={innerCardStyle}>
              <div style={{ color: '#e2e8f0', fontSize: '0.78rem', lineHeight: 1.45 }}>{t.content}</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                {t.created_at ? new Date(t.created_at).toLocaleString() : 'Just now'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
