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
  const [roadmapResult, setRoadmapResult] = useState('');

  // Fallback verified jobs agar database mein jobs kam hon
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
    if (!degreeInput) return;
    const lower = degreeInput.toLowerCase();
    if (lower.includes('cs') || lower.includes('software') || lower.includes('it') || lower.includes('computer')) {
      setRoadmapResult(`🎯 Career Action Plan for ${degreeInput}:
1. Month 1-2: Master JavaScript/React or Python & Git GitHub.
2. Month 3-4: Build 2 production apps (E-commerce / Dashboard) using Supabase.
3. Month 5: Optimize ATS Resume on Shanora and target top IT hubs (Lahore, Karachi, Islamabad).`);
    } else if (lower.includes('bba') || lower.includes('commerce') || lower.includes('finance') || lower.includes('accounting')) {
      setRoadmapResult(`🎯 Career Action Plan for ${degreeInput}:
1. Month 1-2: Master Advanced Excel, PowerBI, and basic Financial Modeling.
2. Month 3: Target Commercial Bank Management Trainee programs (HBL, Meezan, UBL).
3. Month 4-5: Prepare for Corporate Sales, Supply Chain or FinTech analyst openings.`);
    } else {
      setRoadmapResult(`🎯 Career Guidance for ${degreeInput}:
1. Bridge degree knowledge with high-demand digital skills (SEO, Data Analytics, Digital Marketing).
2. Complete verified portfolio projects and scan your CV with Shanora ATS scanner.`);
    }
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
    <main style={{ minHeight: '100vh', padding: '1.5rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      
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
          Apni degree enter karein (e.g. BSCS, BBA, Civil, English) aur tailored roadmap hasil karein:
        </p>
        <form onSubmit={handleGenerateRoadmap} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Degree (e.g. BSCS, BBA, Mechanical)..."
            value={degreeInput}
            onChange={(e) => setDegreeInput(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
          />
          <button type="submit" style={{ backgroundColor: '#38bdf8', color: '#090d16', border: 'none', borderRadius: '8px', padding: '0.7rem 1.25rem', fontWeight: '800', cursor: 'pointer' }}>
            Generate Roadmap ⚡
          </button>
        </form>

        {roadmapResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#0a0f1d', borderRadius: '8px', border: '1px solid #334155', whiteSpace: 'pre-line', color: '#e2e8f0', fontSize: '0.88rem', lineHeight: '1.6' }}>
            {roadmapResult}
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
          {['All', 'Lahore', 'Karachi', 'Islamabad', 'Remote'].map((city) => (
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
            Koi job nahi mili. Search ya city filter change karein.
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

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', borderTop: '1px solid #1e293b', color: '#64748b', fontSize: '0.82rem' }}>
        Shanora Pakistan © 2026 • Empowering Pakistani Graduates Nationwide
      </footer>

    </main>
  );
      }
      
