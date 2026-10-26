'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [degree, setDegree] = useState('');
  const [interest, setInterest] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOpportunities() {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .limit(5);

      if (!error && data) {
        setOpportunities(data);
      }
    }
    fetchOpportunities();
  }, []);

  const handleGuidance = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setRecommendations({
        careerPaths: [
          'Full-Stack Developer (Remote / Local)',
          'Cloud Solutions Specialist',
          'Data Analyst in Fintech'
        ],
        certifications: [
          'AWS Certified Cloud Practitioner',
          'Meta Frontend Developer Professional'
        ],
        targetCompanies: ['Systems Ltd', 'Contour Software', 'State Bank of Pakistan (IT Dept)']
      });
      setLoading(false);
    }, 600);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.5rem' }}>SHANORA</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>AI-Powered Career Roadmap & Opportunities for Pakistani Graduates</p>
        </header>

        <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#e2e8f0' }}>Get Your Career Path</h2>
          <form onSubmit={handleGuidance} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Your Degree (e.g., BS Computer Science, BBA)"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            />
            <input
              type="text"
              placeholder="Your Area of Interest (e.g., AI, Web Dev, Finance)"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.75rem', borderRadius: '8px', background: '#0284c7', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              {loading ? 'Analyzing...' : 'Generate Roadmap'}
            </button>
          </form>

          {recommendations && (
            <div style={{ marginTop: '1.5rem', background: '#0f172a', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem' }}>Recommended Paths:</h3>
              <ul>
                {recommendations.careerPaths.map((path, i) => (
                  <li key={i} style={{ marginBottom: '0.3rem' }}>{path}</li>
                ))}
              </ul>
              <h4 style={{ color: '#38bdf8', marginTop: '1rem', marginBottom: '0.5rem' }}>Top Target Sectors:</h4>
              <p style={{ color: '#cbd5e1' }}>{recommendations.targetCompanies.join(', ')}</p>
            </div>
          )}
        </section>

        <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#e2e8f0' }}>Latest Verified Opportunities</h2>
          {opportunities.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>Connect database or add rows to Supabase to see real-time updates.</p>
          ) : (
            <ul>
              {opportunities.map((opp) => (
                <li key={opp.id} style={{ marginBottom: '0.5rem' }}>{opp.title} - {opp.company}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
