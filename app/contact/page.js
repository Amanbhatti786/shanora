'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Please fill in your name, email address, and message.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatusMsg('Your inquiry has been prepared. You can also reach us directly at support@shanora.online.');
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#111b2e',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: '11px',
    padding: '10.5px 12px',
    color: '#f8fafc',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box'
  };

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
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
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
            padding: '24px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: '6px' }}>
            CONTACT US
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px', color: '#fff' }}>
            Get in Touch with SHANORA Support
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 18px' }}>
            Have questions about your account, app downloads, SHANORA PRO, or partnerships? Send us a note below or email{' '}
            <a href="mailto:support@shanora.online" style={{ color: '#38bdf8', fontWeight: '700', textDecoration: 'none' }}>
              support@shanora.online
            </a>
            .
          </p>

          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.14)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', padding: '10px 12px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '14px' }}>
              {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.14)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#86efac', padding: '10px 12px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '14px' }}>
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label htmlFor="contact-name" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '5px' }}>
                Full Name *
              </label>
              <input id="contact-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>

            <div>
              <label htmlFor="contact-email" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '5px' }}>
                Email Address *
              </label>
              <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
            </div>

            <div>
              <label htmlFor="contact-subject" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '5px' }}>
                Topic
              </label>
              <input id="contact-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Account, App Download, PRO, Ads, or Feedback" style={inputStyle} />
            </div>

            <div>
              <label htmlFor="contact-message" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '5px' }}>
                Message *
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 16px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Send Message
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
