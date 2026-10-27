'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AtsCheckerPage() {
  const [cvText, setCvText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // Common market skills to audit
  const keywordsBank = [
    'react', 'next.js', 'javascript', 'typescript', 'python', 'sql', 'supabase', 'node.js',
    'tailwind', 'git', 'github', 'rest api', 'excel', 'powerbi', 'financial modeling',
    'accounting', 'communication', 'problem solving', 'leadership', 'teamwork', 'agile',
    'data analysis', 'seo', 'marketing', 'project management', 'autocad', 'design'
  ];

  const handleAudit = (e) => {
    e.preventDefault();
    if (!cvText.trim()) {
      alert('Pehle apni CV ka text paste karein!');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      const lowerCv = cvText.toLowerCase();
      const lowerJd = jobDesc.toLowerCase();

      // Extract detected skills from CV
      const foundSkills = keywordsBank.filter(skill => lowerCv.includes(skill));

      // Check JD keywords or use standard market requirements
      let targetKeywords = [];
      if (jobDesc.trim()) {
        targetKeywords = keywordsBank.filter(skill => lowerJd.includes(skill));
        if (targetKeywords.length === 0) {
          targetKeywords = ['communication', 'teamwork', 'problem solving', 'git', 'sql'];
        }
      } else {
        targetKeywords = ['communication', 'problem solving', 'leadership', 'git', 'excel', 'sql'];
      }

      // Find missing keywords
      const missingSkills = targetKeywords.filter(skill => !foundSkills.includes(skill));
      const matchedCount = targetKeywords.length - missingSkills.length;
      
      // Calculate realistic score
      let calculatedScore = Math.round((matchedCount / targetKeywords.length) * 100);
      if (foundSkills.length > 5 && calculatedScore < 60) calculatedScore = 65;
      if (calculatedScore < 30) calculatedScore = 40;
      if (calculatedScore > 95) calculatedScore = 95;

      // Formatting & Length checks
      const wordCount = cvText.trim().split(/\s+/).length;
      const formattingIssues = [];
      if (wordCount < 150) formattingIssues.push('CV bohot choti hai. Kam az kam 250-400 words hone chahiyen.');
      if (wordCount > 900) formattingIssues.push('CV bohot lambi hai. Fresh graduates ke liye 1-page (under 600 words) standard hai.');
      if (!lowerCv.includes('education') && !lowerCv.includes('degree')) formattingIssues.push('Education / Degree ka section wazeh nahi hai.');
      if (!lowerCv.includes('project') && !lowerCv.includes('experience')) formattingIssues.push('Projects ya Internships ka section shamil karein.');

      setResult({
        score: calculatedScore,
        wordCount,
        matchedSkills: foundSkills,
        missingSkills,
        formattingIssues,
        verdict: calculatedScore >= 75 ? 'Strong Match' : calculatedScore >= 55 ? 'Average Match' : 'Needs Optimization'
      });

      setAnalyzing(false);
    }, 700);
  };

  return (
    <main style={{ minHeight: '100vh', padding: '1.25rem 1rem', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif', color: '#f8fafc' }}>
      
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
          ← Back to Homepage
        </Link>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI ATS Resume Intelligence</span>
      </div>

      {/* Header */}
      <section style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>
            Shanora Smart ATS Resume Scanner
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>
          Check karein ke aapka resume recruiter ke automated screening filters pass kar sakta hai ya nahi.
        </p>
      </section>

      {/* Input Form */}
      <form onSubmit={handleAudit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* CV Text Area */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', display: 'block', marginBottom: '0.3rem' }}>
            1. Paste Your CV / Resume Content *
          </label>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 0.6rem 0' }}>
            Apni Word ya PDF file se text copy karein aur yahan paste karein:
          </p>
          <textarea
            required
            rows="7"
            placeholder="Paste your complete CV text here (Summary, Education, Projects, Skills)..."
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            style={textareaStyle}
          />
        </div>

        {/* Job Description Area (Optional but powerful) */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', display: 'block', marginBottom: '0.3rem' }}>
            2. Target Job Description (Optional)
          </label>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 0.6rem 0' }}>
            Jis job par apply karna chahte hain uski description yahan paste karein taake exact match calculate ho sake:
          </p>
          <textarea
            rows="5"
            placeholder="Paste Job Description (e.g. Requirements, Responsibilities from LinkedIn/Systems Ltd/HBL)..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            style={textareaStyle}
          />
        </div>

        <button
          type="submit"
          disabled={analyzing}
          style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.9rem', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)' }}
        >
          {analyzing ? 'Scanning Resume & Keywords...' : 'Scan Resume for ATS Compatibility 🚀'}
        </button>
      </form>

      {/* Analysis Results */}
      {result && (
        <section style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
          
          {/* Top Score Box */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Overall ATS Score</span>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: result.score >= 75 ? '#22c55e' : result.score >= 55 ? '#facc15' : '#ef4444' }}>
                {result.score}%
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ backgroundColor: result.score >= 75 ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: result.score >= 75 ? '#4ade80' : '#facc15', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {result.verdict}
              </span>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                Word Count: ~{result.wordCount} words
              </div>
            </div>
          </div>

          {/* Missing Keywords Warning */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#f87171', margin: '0 0 0.5rem 0' }}>
              ⚠️ Missing High-Impact Keywords:
            </h3>
            {result.missingSkills.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {result.missingSkills.map((skill, i) => (
                  <span key={i} style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                    + {skill.toUpperCase()}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#4ade80', fontSize: '0.82rem', margin: 0 }}>Zabardast! Aapki CV mein tamam required core keywords mojood hain.</p>
            )}
          </div>

          {/* Matched Keywords */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#4ade80', margin: '0 0 0.5rem 0' }}>
              ✅ Detected Skills in Your Resume:
            </h3>
            {result.matchedSkills.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {result.matchedSkills.map((skill, i) => (
                  <span key={i} style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                    ✓ {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>Koi clear technical keyword detect nahi hua.</p>
            )}
          </div>

          {/* Formatting & Content Checks */}
          {result.formattingIssues.length > 0 && (
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem', marginTop: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: '#facc15', margin: '0 0 0.5rem 0' }}>
                💡 Critical Improvements:
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: '1.5' }}>
                {result.formattingIssues.map((issue, idx) => (
                  <li key={idx} style={{ marginBottom: '0.3rem' }}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

        </section>
      )}

      <footer style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
        Shanora Pakistan • Recruiter Resume Compliance & ATS Optimization
      </footer>

    </main>
  );
}

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #334155',
  backgroundColor: '#0a0f1d',
  color: '#fff',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
  lineHeight: '1.4'
};
              
