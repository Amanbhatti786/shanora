'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [degree, setDegree] = useState('');
  const [interest, setInterest] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Fetch opportunities from Supabase
  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;
        if (data) setOpportunities(data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoadingJobs(false);
      }
    }
    fetchOpportunities();
  }, []);

  // Career Roadmap Logic
  const handleGenerate = (e) => {
    e.preventDefault();
    if (!degree.trim() || !interest.trim()) return;

    setLoadingRoadmap(true);

    setTimeout(() => {
      const deg = degree.toLowerCase();
      const intr = interest.toLowerCase();

      let targetRoles = [
        `${interest} Specialist / Engineer`,
        'Junior Solutions Consultant',
        'Associate Tech Analyst'
      ];

      let coreSkills = ['Problem Solving & DSA', 'Version Control (Git/GitHub)', 'Modern Frameworks & Cloud Basics'];
      let targetCompanies = 'Systems Limited, Contour Software, Jazz, Techlogix, 10Pearls, Folio3';
      let entryCertifications = ['AWS Certified Cloud Practitioner', 'Google Professional Certificate / Coursera'];

      if (intr.includes('ai') || intr.includes('data') || intr.includes('machine learning')) {
        targetRoles = ['Associate Data Scientist', 'AI / ML Engineer Intern', 'Business Intelligence Analyst'];
        coreSkills = ['Python / PyTorch / Pandas', 'SQL & Database Optimization', 'Data Pipelines & Model Deployment'];
        targetCompanies = 'Systems Ltd, Jazz xplr, Afiniti, Arbisoft, VentureDive';
        entryCertifications = ['DeepLearning.AI TensorFlow / GenAI', 'IBM Data Science Professional'];
      } else if (intr.includes('web') || intr.includes('frontend') || intr.includes('backend') || intr.includes('full stack')) {
        targetRoles = ['Full-Stack Developer (MERN / Next.js)', 'Frontend Engineer', 'Backend API Specialist'];
        coreSkills = ['React / Next.js', 'Node.js / FastAPI / Supabase', 'REST & GraphQL APIs', 'Docker Basics'];
        targetCompanies = 'Contour Software, Devsinc, Educative, Netsol, Remote Global Startups';
        entryCertifications = ['Meta Front-End / Back-End Developer', 'FreeCodeCamp Full Stack'];
      } else if (intr.includes('cyber') || intr.includes('security') || intr.includes('network')) {
        targetRoles = ['Information Security Analyst', 'SOC Analyst (L1)', 'Network Security Associate'];
        coreSkills = ['Network Protocols (TCP/IP, OSI)', 'SIEM Tools & Wireshark', 'Linux System Administration'];
        targetCompanies = 'State Bank of Pakistan, Nayatel, Jazz, Commercial Banks (HBL/UBL IT), Trillium';
        entryCertifications = ['CompTIA Security+', 'Certified in Cybersecurity (ISC2)'];
      }

      setRoadmap({
        targetRoles,
        coreSkills,
        targetCompanies,
        entryCertifications,
        degreeTitle: degree,
        interestArea: interest
      });

      setLoadingRoadmap(false);
    }, 600);
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '2.5rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            Pakistan Talent Accelerator 🇵🇰
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
            SHANORA
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.5', margin: 0 }}>
            Curated Career Blueprints & Real-Time Verified Opportunities for Pakistani Graduates
          </p>
        </header>

        {/* Input Form Card */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎯</span> Build Your Strategic Roadmap
          </h2>
          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.35rem' }}>Your Degree / Background</label>
              <input
                type="text"
                placeholder="e.g. BS Computer Science, BBA, Electrical Engg"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.35rem' }}>Target Specialty / Focus Area</label>
              <input
                type="text"
                placeholder="e.g. Web Development, AI, Cyber Security, Fintech"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                required
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loadingRoadmap}
              style={{ width: '100%', padding: '0.9rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)' }}
            >
              {loadingRoadmap ? 'Generating Blueprint...' : 'Generate Career Roadmap'}
            </button>
          </form>

          {/* Generated Roadmap Result */}
          {roadmap && (
            <div style={{ marginTop: '1.75rem', padding: '1.5rem', backgroundColor: '#0a0f1d', borderRadius: '12px', border: '1px solid #1e293b', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tailored Blueprint</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{roadmap.degreeTitle} ➔ {roadmap.interestArea}</span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem', marginBottom: '0.35rem' }}>Primary Career Roles:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  {roadmap.targetRoles.map((role, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{role}</li>)}
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem', marginBottom: '0.35rem' }}>Priority Skill Matrix:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {roadmap.coreSkills.map((sk, idx) => (
                    <span key={idx} style={{ backgroundColor: '#1e293b', color: '#38bdf8', fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>{sk}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Recommended Validations:</strong>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{roadmap.entryCertifications.join(' • ')}</p>
              </div>

              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Pakistani Market Target Employers:</strong>
                <p style={{ margin: 0, color: '#38bdf8', fontSize: '0.85rem' }}>{roadmap.targetCompanies}</p>
              </div>
            </div>
          )}
        </section>

        {/* Real-time Jobs Section */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                💼 Live Opportunities
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified openings in Pakistan tech & banking sectors</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '600' }}>Live Sync</span>
            </div>
          </div>

          {loadingJobs ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Connecting to database...</p>
          ) : opportunities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {opportunities.map((item) => (
                <div
                  key={item.id}
                  style={{ backgroundColor: '#0a0f1d', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: '#f1f5f9' }}>{item.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <span style={{ color: '#38bdf8' }}>{item.company}</span>
                      <span>•</span>
                      <span>📍 {item.location || 'Pakistan'}</span>
                    </div>
                  </div>
                  <span style={{ backgroundColor: '#1e293b', color: '#e2e8f0', fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #334155' }}>
                    Open Role
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No open opportunities found currently.</p>
          )}
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '2.5rem', color: '#64748b', fontSize: '0.8rem' }}>
          Shanora Career Intelligence © 2026 • Powered by Next.js & Supabase
        </footer>

      </div>
    </main>
  );
              }
                
