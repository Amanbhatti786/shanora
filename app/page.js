'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  const [liveJobs, setLiveJobs] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (jobs) setLiveJobs(jobs);

        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (count !== null) setTotalStudents(count);
      } catch (err) {
        console.error('Landing load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLandingData();
  }, []);

  const filteredJobs = liveJobs.filter(job => {
    const matchQuery = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       job.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCity = selectedCity === 'All' || job.city?.toLowerCase() === selectedCity.toLowerCase();
    return matchQuery && matchCity;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Embedded CSS for Mobile & Desktop Perfection */}
      <style>{`
        .hero-title {
          font-size: 1.85rem;
          line-height: 1.25;
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0.8rem 0;
        }
        .hero-subtitle {
          font-size: 0.88rem;
          color: #94a3b8;
          max-width: 580px;
          margin: 0.8rem auto 1.8rem;
          line-height: 1.5;
        }
        .search-container {
          background: #0f172a;
          padding: 0.85rem;
          border-radius: 14px;
          border: 1px solid #1e293b;
          max-width: 650px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .grid-cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .nav-btn-feed {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          padding: 0.4rem 0.65rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }
        .nav-btn-start {
          background: #0284c7;
          color: #ffffff;
          padding: 0.42rem 0.85rem;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        @media (min-width: 640px) {
          .hero-title {
            font-size: 2.8rem;
          }
          .hero-subtitle {
            font-size: 1rem;
          }
          .search-container {
            flex-direction: row;
          }
          .grid-cards {
            grid-template-columns: repeat(2, 1fr);
          }
          .nav-btn-feed {
            padding: 0.45rem 0.85rem;
            font-size: 0.82rem;
          }
          .nav-btn-start {
            padding: 0.48rem 1rem;
            font-size: 0.85rem;
          }
        }

        @media (min-width: 960px) {
          .grid-cards {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      {/* CLEAN MOBILE-FRIENDLY NAVBAR */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
        </Link>

        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <Link href="/feed" className="nav-btn-feed">
            Feed 🌐
          </Link>
          <Link href="/auth" style={{ color: '#cbd5e1', fontSize: '0.78rem', textDecoration: 'none', padding: '0.4rem 0.5rem', fontWeight: '600' }}>
            Sign In
          </Link>
          <Link href="/auth" className="nav-btn-start">
            Get Started ➔
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '2.5rem 1rem 2rem', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '0.3rem 0.75rem', borderRadius: '20px', color: '#38bdf8', fontSize: '0.72rem', fontWeight: 'bold' }}>
          <span>🇵🇰 Built for Pakistani Fresh Graduates</span>
        </div>

        <h1 className="hero-title">
          Land Your First Career Role <br />
          <span style={{ color: '#38bdf8' }}>Without Hassle or Fake Jobs</span>
        </h1>

        <p className="hero-subtitle">
          Direct 1-click ATS applications for verified IT companies, startups, and corporate openings in Pakistan.
        </p>

        {/* SEARCH BOX */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Job title or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 2, padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
          />
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            style={{ flex: 1, padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
          >
            <option value="All">All Cities</option>
            <option value="Lahore">Lahore</option>
            <option value="Karachi">Karachi</option>
            <option value="Islamabad">Islamabad</option>
            <option value="Rawalpindi">Rawalpindi</option>
            <option value="Remote">Remote</option>
          </select>
          <Link
            href="/profile"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0284c7', color: '#fff', padding: '0.65rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            Search Openings 🔍
          </Link>
        </div>

        {/* METRICS ROW */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.45rem', color: '#38bdf8', fontWeight: '800' }}>{liveJobs.length}+</h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Verified Openings</span>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.45rem', color: '#22c55e', fontWeight: '800' }}>{Math.max(totalStudents, 25)}+</h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Registered Candidates</span>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.45rem', color: '#fbbf24', fontWeight: '800' }}>100%</h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Direct Applications</span>
          </div>
        </div>
      </section>

      {/* FEATURED LIVE JOBS SECTION */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 0.2rem 0' }}>Latest Verified Vacancies</h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.78rem' }}>Fresh graduate, internship, and trainee opportunities.</p>
          </div>
          <Link href="/profile" style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold' }}>
            View all jobs ➔
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading verified vacancies...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.85rem' }}>
            No jobs found matching your criteria.
          </div>
        ) : (
          <div className="grid-cards">
            {filteredJobs.map(job => (
              <div key={job.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem', borderRadius: '6px', backgroundColor: '#1e293b', color: '#38bdf8', fontWeight: 'bold' }}>
                      {job.type || 'Full-time'}
                    </span>
                    {job.is_verified && (
                      <span style={{ fontSize: '0.62rem', color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '0.12rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        Verified ✓
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: '0.3rem 0 0.15rem 0', fontSize: '0.98rem', color: '#fff' }}>{job.title}</h3>
                  <span style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: '600' }}>{job.company}</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}> • {job.city || 'Pakistan'}</span>
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0.6rem 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.description}
                  </p>
                </div>

                <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 'bold' }}>
                    {job.salary || 'Competitive'}
                  </span>
                  <Link
                    href="/profile"
                    style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: 'bold' }}
                  >
                    Apply ⚡
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#0b1120', borderTop: '1px solid #1e293b', padding: '1.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '2rem' }}>
        <p style={{ margin: '0 0 0.3rem 0' }}>© {new Date().getFullYear()} Shanora.pk — Pakistan’s Professional & Hiring Network.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginTop: '0.4rem' }}>
          <Link href="/feed" style={{ color: '#94a3b8', textDecoration: 'none' }}>Community Feed</Link>
          <Link href="/auth" style={{ color: '#94a3b8', textDecoration: 'none' }}>Candidate Sign In</Link>
        </div>
      </footer>

    </div>
  );
        }
            
