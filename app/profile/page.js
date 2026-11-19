'use client';

const TERMS_SECTIONS = [
  {
    title: '1. Account & Profile Accuracy',
    body: 'Provide accurate profile, contact, and career details. Impersonation or account misuse is strictly prohibited on SHANORA.'
  },
  {
    title: '2. Job Postings & Applications',
    body: 'Employers must keep job details, statuses, and hiring communications accurate and avoid misleading or fraudulent listings. Candidates apply voluntarily.'
  },
  {
    title: '3. Privacy, Safety & Platform Updates',
    body: 'Reported listings may be reviewed or removed to keep the community safe. Features and terms may be updated as SHANORA evolves.'
  }
];

export default function TermsContent({ onClose }) {
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.92rem', fontWeight: '900', color: '#fff' }}>📜 Terms & Conditions</span>
        {onClose && (
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.95rem' }}>
            ✕
          </button>
        )}
      </div>

      {TERMS_SECTIONS.map((sec) => (
        <div key={sec.title} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.75rem 0.85rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#38bdf8', marginBottom: '0.2rem' }}>{sec.title}</div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>{sec.body}</div>
        </div>
      ))}
    </div>
  );
}
