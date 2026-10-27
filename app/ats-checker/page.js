'use client';
import { useState } from 'react';

export default function ATSChecker() {
  const [resumeText, setResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [results, setResults] = useState(null);

  const handleScan = (e) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setEvaluating(true);

    setTimeout(() => {
      const text = resumeText.toLowerCase();
      let score = 50;
      let strengths = [];
      let improvements = [];
      let detectedKeywords = [];

      // Industry keywords dictionary
      const techKeywords = ['git', 'github', 'sql', 'python', 'javascript', 'react', 'api', 'database', 'agile', 'next.js', 'docker', 'problem solving', 'teamwork', 'leadership'];
      const actionVerbs = ['developed', 'designed', 'led', 'created', 'managed', 'optimized', 'engineered', 'built', 'implemented', 'improved', 'achieved'];

      // Check keywords
      techKeywords.forEach(kw => {
        if (text.includes(kw)) {
          score += 3;
          detectedKeywords.push(kw.toUpperCase());
        }
      });

      // Check action verbs
      let verbCount = 0;
      actionVerbs.forEach(verb => {
        if (text.includes(verb)) verbCount++;
      });

      if (verbCount >= 3) {
        strengths.push(`Strong active verbs detected (${verbCount} action verbs found).`);
        score += 8;
      } else {
        improvements.push('Add more impactful action verbs (e.g. Developed, Engineered, Optimized, Implemented).');
      }

      // Check formatting markers
      if (text.includes('education') || text.includes('degree') || text.includes('university')) {
        strengths.push('Education section is clearly identifiable.');
        score += 5;
      } else {
        improvements.push('Add an explicit "Education" header with degree and institution name.');
      }

      if (text.includes('experience') || text.includes('projects')) {
        strengths.push('Work experience or personal project section detected.');
        score += 5;
      } else {
        improvements.push('Include a dedicated "Projects" or "Experience" section with verifiable achievements.');
      }

      if (text.includes('@') || text.includes('linkedin.com')) {
        strengths.push('Professional contact information detected.');
        score += 4;
      } else {
        improvements.push('Include professional email and your LinkedIn / GitHub URL at the top.');
      }

      // Cap score
      score = Math.min(score, 98);

      setResults({
        score,
        strengths,
        improvements,
        detectedKeywords: detectedKeywords.slice(0, 10),
        analyzedRole: jobTitle || 'General Technical Role'
      });

      setEvaluating(false);
    }, 600);
  };

  return (
    <main style={{ minHeight: '90vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '2.5rem 1rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
            ⚡ ATS Resume Scanner
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
            Analyze your CV against Pakistani hiring benchmarks (Systems, Contour, Tech Startups & Banks).
          </p>
        </header>

        <section style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
          <form onSubmit={handleScan}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Target Role (Optional)
              </label>
              <input 
                type="text" 
                placeholder="e.g. Associate Software Engineer, Frontend Dev, Data Analyst"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Paste Resume Text (Copy-paste content from your CV)
              </label>
              <textarea 
                rows={9}
                placeholder="Paste your education, skills, projects, and work history text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                required
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}
              />
            </div>

            <button
              type="submit"
              disabled={evaluating}
              style={{ width: '100%', padding: '0.9rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)' }}
            >
              {evaluating ? 'Analyzing CV against ATS Matrix...' : 'Run Free ATS Scan'}
            </button>
          </form>

          {results && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#0a0f1d', borderRadius: '12px', border: '1px solid #1e293b' }}>
              
              {/* Score Display */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Match Score</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', color: results.score >= 70 ? '#4ade80' : '#f59e0b' }}>
                    {results.score}<span style={{ fontSize: '1.2rem', color: '#64748b' }}>/100</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600' }}>{results.analyzedRole}</span>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {results.score >= 70 ? '🟢 Strong ATS Compatibility' : '🟡 Needs Optimization'}
                  </p>
                </div>
              </div>

              {/* Detected Keywords */}
              {results.detectedKeywords.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>Identified High-Value Keywords:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {results.detectedKeywords.map((kw, idx) => (
                      <span key={idx} style={{ backgroundColor: '#1e293b', color: '#38bdf8', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              <div style={{ marginBottom: '1.25rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#4ade80', display: 'block', marginBottom: '0.4rem' }}>Key Positives:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  {results.strengths.map((str, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{str}</li>)}
                </ul>
              </div>

              {/* Improvements */}
              {results.improvements.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#f87171', display: 'block', marginBottom: '0.4rem' }}>Recommended Enhancements:</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {results.improvements.map((imp, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{imp}</li>)}
                  </ul>
                </div>
              )}

            </div>
          )}
        </section>

      </div>
    </main>
  );
        }
  
