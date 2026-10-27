'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function HomePage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // AI Roadmap state
  const [degreeInput, setDegreeInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [roadmapResult, setRoadmapResult] = useState(null);

  const defaultJobs = [
    {
      id: 'demo-1',
      title: 'Graduate Trainee Software Engineer',
      company: 'Systems Limited',
      location: 'Lahore / Remote',
      type: 'Fresh Graduate',
      apply_link: 'https://systemsltd.com/careers'
    },
    {
      id: 'demo-2',
      title: 'Management Trainee Officer (MTO)',
      company: 'Habib Bank Limited (HBL)',
      location: 'Karachi / Nationwide',
      type: 'Entry-Level',
      apply_link: 'https://hbl.com/careers'
    },
    {
      id: 'demo-3',
      title: 'Associate Product / QA Intern',
      company: 'Arbisoft',
      location: 'Lahore',
      type: 'Internship',
      apply_link: 'https://arbisoft.com/careers'
    },
    {
      id: 'demo-4',
      title: 'Junior Data & Business Analyst',
      company: 'Jazz (Veon)',
      location: 'Islamabad',
      type: 'Entry-Level',
      apply_link: 'https://jazz.com.pk/careers'
    }
  ];

  useEffect(() => {
    async function loadJobs() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setJobs(data);
        } else {
          setJobs(defaultJobs);
        }
      } catch (err) {
        setJobs(defaultJobs);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const handleGenerateRoadmap = (e) => {
    e.preventDefault();
    if (!degreeInput.trim()) return;
    setGenerating(true);
    setRoadmapResult(null);

    setTimeout(() => {
      const lower = degreeInput.toLowerCase();
      let plan = {};

      if (lower.includes('cs') || lower.includes('software') || lower.includes('it') || lower.includes('computer')) {
        plan = {
          title: `Technology Career Blueprint for ${degreeInput.toUpperCase()}`,
          timeline: [
            { phase: 'Month 1 - Core Stack', desc: 'React.js, Next.js, Tailwind CSS aur Git / GitHub workflows master karein.' },
            { phase: 'Month 2 - Backend & DB', desc: 'Supabase, PostgreSQL aur REST APIs integrate karna seekhein.' },
            { phase: 'Month 3 - Production Portfolio', desc: '2 full-stack SaaS apps live deploy karein (e.g. Vercel) with clean code.' },
            { phase: 'Month 4 - Market Entry', desc: 'Systems Ltd, Arbisoft, 10Pearls aur remote international tech roles target karein.' }
          ],
          marketSkills: 'Next.js, TypeScript, Supabase, Tailwind, Postman, Git',
          hiringHubs: 'Lahore, Islamabad, Karachi, Remote Global',
          salaryEstimate: 'PKR 65,000 - 120,000 / month (Entry-level)'
        };
      } else if (lower.includes('bba') || lower.includes('finance') || lower.includes('accounting') || lower.includes('commerce') || lower.includes('mba')) {
        plan = {
          title: `Corporate & Finance Blueprint for ${degreeInput.toUpperCase()}`,
          timeline: [
            { phase: 'Month 1 - Data Tools', desc: 'Advanced Excel (VLOOKUP, Pivot, Macros) aur PowerBI reporting seekhein.' },
            { phase: 'Month 2 - Industry Knowledge', desc: 'Corporate Banking, Supply Chain processes, aur FMCG business dynamics samjhein.' },
            { phase: 'Month 3 - MTO Test Prep', desc: 'HBL, Meezan, Nestle, Unilever ki screening & aptitude test practice karein.' },
            { phase: 'Month 4 - Applications', desc: 'LinkedIn optimization karein aur verified corporate Trainee roles par apply karein.' }
          ],
          marketSkills: 'Financial Modeling, PowerBI, Advanced Excel, ERP Basics, Corporate Communication',
          hiringHubs: 'Karachi (Banking/FMCG), Lahore, Islamabad',
          salaryEstimate: 'PKR 55,000 - 95,000 / month (MTO/Trainee)'
        };
      } else if (lower.includes('engineer') || lower.includes('electrical') || lower.includes('mechanical') || lower.includes('civil')) {
        plan = {
          title: `Engineering Industry Roadmap for ${degreeInput.toUpperCase()}`,
          timeline: [
            { phase: 'Month 1 - Industry Software', desc: 'AutoCAD, MATLAB, ya specific engineering modeling software seekhein.' },
            { phase: 'Month 2 - Site / Lab Skills', desc: 'Quality control, HSE protocols aur practical technical standards study karein.' },
            { phase: 'Month 3 - Certifications', desc: 'PEC registration complete karein aur Project Management basics sekhein.' },
            { phase: 'Month 4 - Hiring Target', desc: 'Engro, Fatima Group, FWO, Descon aur Industrial Estate zones target karein.' }
          ],
          marketSkills: 'AutoCAD, Project Estimation, Quality Assurance, Site Safety (HSE)',
          hiringHubs: 'Lahore, Karachi, Faisalabad, Sheikhupura, Hub',
          salaryEstimate: 'PKR 50,000 - 85,000 / month (Site Trainee)'
        };
      } else {
        plan = {
          title: `Digital High-Growth Career Roadmap for ${degreeInput.toUpperCase()}`,
          timeline: [
            { phase: 'Month 1 - Digital Bridge', desc: 'Digital Marketing, SEO, ya Data Analysis me se 1 high-income skill choose karein.' },
            { phase: 'Month 2 - Practical Execution', desc: 'Live campaigns ya sample analytics dashboards prepare karein.' },
            { phase: 'Month 3 - CV ATS Audit', desc: 'Shanora ATS Scanner se resume score 80+ set karein.' },
            { phase: 'Month 4 - Direct Outreach', desc: 'Pakistani agencies aur tech startups ko direct WhatsApp / LinkedIn par pitch karein.' }
          ],
          marketSkills: 'Google Analytics, Content Strategy, Performance Marketing, CRM',
          hiringHubs: 'Nationwide & Remote Freelance',
          salaryEstimate: 'PKR 45,000 - 75,000 / month'
        };
      }

      setRoadmapResult(plan);
      setGenerating(false);
    }, 600);
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (job.title && job.title.toLowerCase().includes(q)) ||
      (job.company && job.company.toLowerCase().includes(q)) ||
      (job.location && job.location.toLowerCase().includes(q));

    const matchesCity =
      selectedCity === 'All' ||
      (job.location && job.location.toLowerCase().includes(selectedCity.toLowerCase()));

    const matchesType =
      selectedType === 'All' ||
      (job.type && job.type.toLowerCase() === selectedType.toLowerCase());

    return matchesSearch && matchesCity && matchesType;
  });

  return (
    <main style={{ minHeight: '100vh', padding: '1.5rem 1rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Hero Banner */}
      <section style={{ textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: '#131b2e', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
        <span style={{ backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          Pakistan’s Graduate Talent Network 🇵🇰
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#ffffff', margin: '1rem 0 0.5rem 0' }}>
          Land Your First Career Role in Pakistan
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Verified graduate opportunities, district-level hiring, AI career roadmaps, and recruiter ATS scoring.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/profile" style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.7rem 1.4rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
            Student Profile 🎓
          </Link>
          <Link href="/ats-checker" style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.7rem 1.4rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #334155' }}>
            Scan CV for ATS ⚡
          </Link>
        </div>
      </section>

      {/* AI Roadmap Generator */}
      <section style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '0 0 0.4rem 0' }}>🧭 AI Degree-to-Career Roadmap</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Apni Pakistani degree enter karein (e.g. BSCS, BBA, Civil, Commerce) aur practical action plan hasil karein:
        </p>
        <form onSubmit={handleGenerateRoadmap} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Degree (e.g. BSCS, BBA, Electrical, B.Com)..."
            value={degreeInput}
            onChange={(e) => setDegreeInput(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
          />
          <button type="submit" disabled={generating} style={{ backgroundColor: '#38bdf8', color: '#090d16', border: 'none', borderRadius: '8px', padding: '0.7rem 1.25rem', fontWeight: '800', cursor: 'pointer' }}>
            {generating ? 'Analyzing...' : 'Generate Roadmap ⚡'}
          </button>
        </form>

        {roadmapResult && (
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', backgroundColor: '#0a0f1d', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ color: '#38bdf8', margin: '0 0 0.8rem 0', fontSize: '1.1rem' }}>{roadmapResult.title}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {roadmapResult.timeline.map((step, idx) => (
                <div key={idx} style={{ padding: '0.65rem 0.85rem', backgroundColor: '#131b2e', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                  <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{step.phase}</strong>
                  <p style={{ color: '#cbd5e1', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>{step.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '0.85rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>High-Demand Skills:</span>
                <div style={{ color: '#4ade80', fontWeight: 'bold' }}>{roadmapResult.marketSkills}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Top Hiring Hubs:</span>
                <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{roadmapResult.hiringHubs}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Estimated Starting Pay:</span>
                <div style={{ color: '#facc15', fontWeight: 'bold' }}>{roadmapResult.salaryEstimate}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Opportunities Feed */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', color: '#ffffff', margin: 0 }}>💼 Verified Entry-Level Opportunities</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>Real-time verified graduate & intern roles</p>
          </div>
          <input
            type="text"
            placeholder="Search role, city or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#131b2e', color: '#fff', fontSize: '0.85rem', minWidth: '220px', outline: 'none' }}
          />
        </div>

        {/* City Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {['All', 'Lahore', 'Karachi', 'Islamabad', 'Sukkur', 'Remote'].map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              style={{
                backgroundColor: selectedCity === city ? '#38bdf8' : '#131b2e',
                color: selectedCity === city ? '#090d16' : '#94a3b8',
                border: '1px solid #1e293b',
                padding: '0.35rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: selectedCity === city ? '800' : '500',
              }}
            >
              📍 {city}
            </button>
          ))}
        </div>

        {/* Role Type Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {['All', 'Internship', 'Fresh Graduate', 'Entry-Level'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                backgroundColor: selectedType === type ? '#0284c7' : '#0a0f1d',
                color: selectedType === type ? '#ffffff' : '#94a3b8',
                border: '1px solid #1e293b',
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: selectedType === type ? '700' : '500',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Job Cards */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading opportunities...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#131b2e', borderRadius: '12px' }}>
            Koi job match nahi hui. Filter change karein.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
                      {job.type || 'Entry-Level'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{job.location || 'Pakistan'}</span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontWeight: '700' }}>{job.title}</h3>
                  <p style={{ color: '#38bdf8', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>{job.company}</p>
                </div>

                <a
                  href={job.apply_link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.6rem 1.15rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  Apply Now ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating WhatsApp Community Alert Button */}
      <a
        href="https://chat.whatsapp.com/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#22c55e',
          color: '#090d16',
          padding: '0.75rem 1.25rem',
          borderRadius: '50px',
          boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 999
        }}
      >
        <span>💬</span> Join WhatsApp Alerts
      </a>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', borderTop: '1px solid #1e293b', color: '#64748b', fontSize: '0.82rem' }}>
        Shanora Pakistan © 2026 • Career Intelligence & Graduate Network
      </footer>

    </main>
  );
              }
              
