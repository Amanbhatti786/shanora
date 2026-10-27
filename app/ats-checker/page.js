'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AtsCheckerPage() {
  const [role, setRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      alert('Kripya apna resume text yahan paste karein.');
      return;
    }

    setScanning(true);
    setResult(null);

    setTimeout(() => {
      const text = resumeText.toLowerCase();
      let score = 50;
      const strengths = [];
      const improvements = [];

      // Basic keyword checks
      if (text.includes('project') || text.includes('developed')) {
        score += 15;
        strengths.push('Practical projects aur build work shamil hai.');
      } else {
        improvements.push('Action verbs (e.g. Developed, Built, Managed) add karein.');
      }

      if (text.includes('python') || text.includes('javascript') || text.includes('react') || text.includes('sql') || text.includes('excel')) {
        score += 15;
        strengths.push('Technical core skills mention hain.');
      } else {
        improvements.push('Relevant hard skills aur software tools list karein.');
      }

      if (text.includes('@') && (text.includes('03') || text.includes('+92'))) {
        score += 10;
        strengths.push('Contact info (Email aur Phone) complete hai.');
      } else {
        improvements.push('Professional email aur phone number zaroor shamil karein.');
      }

      if (text.includes('achieved') || text.includes('%') || text.includes('increased')) {
        score += 10;
        strengths.push('Measurable impact aur numbers shamil hain.');
      } else {
        improvements.push('Bullet points mein numbers ya quantifiable results add karein.');
      }

      const finalScore = Math.min(score, 98);

      setResult({
        score: finalScore,
        status: finalScore >= 75 ? 'Strong ATS Readiness' : 'Needs Optimization',
        strengths,
        improvements
      });

      setScanning(false);
    }, 1200);
  };

  return (
    <main style={{ minHeight: '90vh', padding: '1.5rem 1rem', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span style={{ backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          AI RESUME OPTIMIZER
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.5rem 0 0.2rem 0' }}>
          Pakistani Graduate ATS Scanner
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Apna resume text paste karein aur Pakistani hiring criteria ke hisab se audit report hasil karein.
        </p>
      </div>

      {/* Input Box */}
      <form onSubmit={handleScan} style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Target Job Role</label>
          <input
            type="text"
            placeholder="e.g. Junior Web Developer, Trainee Banker, Data Analyst"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Paste Resume Text</label>
          <textarea
            rows="9"
            placeholder="Apne resume ka pura text yahan paste karein..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={scanning}
          style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          {scanning ? 'Analyzing Resume...' : 'Start ATS Audit ⚡'}
        </button>
      </form>

      {/* Result Card */}
      {result && (
        <div style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>ATS Readiness Score</h2>
              <span style={{ color: result.score >= 75 ? '#4ade80' : '#facc15', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {result.status}
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: result.score >= 75 ? '#4ade80' : '#facc15' }}>
              {result.score}/100
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ backgroundColor: '#0a0f1d', padding: '1rem', borderRadius: '8px' }}>
              <strong style={{ color: '#4ade80', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>✓ Key Strengths</strong>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
                {result.strengths.map((str, idx) => (
                  <li key={idx} style={{ marginBottom: '0.3rem' }}>{str}</li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: '#0a0f1d', padding: '1rem', borderRadius: '8px' }}>
              <strong style={{ color: '#f87171', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>! Recommended Improvements</strong>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
                {result.improvements.map((imp, idx) => (
                  <li key={idx} style={{ marginBottom: '0.3rem' }}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem' }}>
          ← Back to Homepage
        </Link>
      </div>

    </main>
  );
      }
