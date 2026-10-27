'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function HomePage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Degree roadmap state
  const [degreeInput, setDegreeInput] = useState('');
  const [roadmapResult, setRoadmapResult] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateRoadmap = (e) => {
    e.preventDefault();
    if (!degreeInput) return;

    const lower = degreeInput.toLowerCase();
    if (lower.includes('cs') || lower.includes('software') || lower.includes('it')) {
      setRoadmapResult(`🎯 Roadmap for ${degreeInput}:
1. Month 1-2: Master Core Web / Python & Git version control.
2. Month 3-4: Build 2 production-ready projects with Supabase/PostgreSQL.
3. Month 5: Prepare ATS Resume & apply to Pakistani Software Houses (Lahore, Karachi, Islamabad).`);
    } else if (lower.includes('bba') || lower.includes('commerce') || lower.includes('finance')) {
      setRoadmapResult(`🎯 Roadmap for ${degreeInput}:
1. Month 1-2: Master Advanced Excel, Financial Modeling & Basic SQL.
2. Month 3: Target State Bank OTS / Commercial Bank Management Trainee programs.
3. Month 4-5: Optimize LinkedIn for corporate FinTech & business analyst roles.`);
    } else {
      setRoadmapResult(`🎯 Career Trajectory for ${degreeInput}:
1. Identify high-demand digital skills complementing your degree (Data Analytics, Digital Marketing, or Tech Sales).
2. Build a verified portfolio on Shanora and connect directly with local recruiters.`);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      (job.title && job.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.company && job.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      selectedType === 'All' ||
      (job.type && job.type.toLowerCase() === selectedType.toLowerCase());

    return matchesSearch && matchesType;
  });

  return (
    <main style={{ minHeight: '100vh', padding: '1.5rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: '#131b2e', borderRadius: '20px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
        <span style={{ backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          Pakistan’s Graduate Talent Network 🇵🇰
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#ffffff', margin: '1rem 0 0.5rem 0', letterSpacing: '-0.02em' }}>
          Land Your First Career Role in Pakistan
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
          Verified entry-level jobs, district-level hiring, AI career roadmaps, and recruiter-ready ATS scoring.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/auth"
            style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem' }}
          >
            Create Student Profile 🎓
          </Link>
          <Link
            href="/ats-checker"
            style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem', border: '1px solid #334155' }}
          >
            Scan CV for ATS ⚡
          </Link>
        </div>
      </section>

      {/* Degree Career Guidance AI */}
      <section style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '0 0 0.4rem 0' }}>🧭 AI Degree-to-Career Roadmap</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Apni degree likhein (e.g. BSCS, BBA, Civil, English) aur tailored Pakistani career roadmap hasil karein:
        </p>
        <form onSubmit={handleGenerateRoadmap} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="e.g. BS Computer Science, BBA..."
            value={degreeInput}
            onChange={(e) => setDegreeInput(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#38bdf8', color: '#090d16', border: 'none', borderRadius: '8px', padding: '0.7rem 1.25rem', fontWeight: '800', cursor: 'pointer' }}
          >
            Generate Roadmap ⚡
          </button>
        </form>

        {roadmapResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#0a0f1d', borderRadius: '8px', border: '1px solid #334155', whiteSpace: 'pre-line', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {roadmapResult}
          </div>
        )}
      </section>

      {/* Jobs Board Section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0 }}>💼 Verified Entry-Level Opportunities</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>Real-time verified graduate & intern roles</p>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search role, city or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#131b2e', color: '#fff', fontSize: '0.85rem', minWidth: '220px', outline: 'none' }}
          />
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {['All', 'Internship', 'Fresh Graduate', 'Entry-Level'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                backgroundColor: selectedType === type ? '#0284c7' : '#131b2e',
                color: selectedType === type ? '#ffffff' : '#94a3b8',
                border: '1px solid #1e293b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: selectedType === type ? '700' : '500',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading jobs feed...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#131b2e', borderRadius: '12px', border: '1px solid #1e293b' }}>
            Koi job nahi mili. Search criteria change karein ya Admin panel se nayi job post karein.
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
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.6rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  Apply Now ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', borderTop: '1px solid #1e293b', color: '#64748b', fontSize: '0.85rem' }}>
        Shanora Pakistan © 2026 • Empowering Pakistani Graduates Nationwide
      </footer>

    </main>
  );
            }
