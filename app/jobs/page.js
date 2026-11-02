'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function JobsContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [appliedJobsMap, setAppliedJobsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const [activeJobModal, setActiveJobModal] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadJobsData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let user = session?.user || null;

        if (!user) {
          const { data: userData } = await supabase.auth.getUser();
          user = userData?.user || null;
        }

        if (user && isMounted) {
          setCurrentUser(user);
          const userEmail = (user.email || '').trim().toLowerCase();

          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();

          if (isMounted) setUserProfile(prof);

          const { data: userApps } = await supabase
            .from('job_applications')
            .select('job_id')
            .eq('applicant_email', userEmail);

          if (isMounted) {
            const appMap = {};
            (userApps || []).forEach((a) => {
              appMap[a.job_id] = true;
            });
            setAppliedJobsMap(appMap);
          }
        }

        const { data: allJobs, error } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && allJobs && isMounted) {
          setJobs(allJobs);
        }
      } catch (err) {
        console.error('Error loading jobs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadJobsData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleApplyJob() {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!activeJobModal) return;

    setApplying(true);
    const applicantEmail = currentUser.email.toLowerCase();
    const applicantName =
      userProfile?.name ||
      currentUser.user_metadata?.full_name ||
      applicantEmail.split('@')[0];
    const resumeUrl = userProfile?.resume_url || null;

    try {
      const { error } = await supabase.from('job_applications').insert([
        {
          job_id: activeJobModal.id,
          applicant_email: applicantEmail,
          applicant_name: applicantName,
          applicant_resume_url: resumeUrl,
          cover_note: coverNote.trim() || 'Applied via Shanora Quick Apply.'
        }
      ]);

      if (error) throw error;

      alert('Application submitted successfully! 🚀');
      setAppliedJobsMap((prev) => ({ ...prev, [activeJobModal.id]: true }));
      setActiveJobModal(null);
      setCoverNote('');
    } catch (err) {
      alert('Application failed: ' + err.message);
    } finally {
      setApplying(false);
    }
  }

  const filteredJobs = jobs.filter((j) => {
    const title = j.title || '';
    const company = j.company_name || '';
    const location = j.location || '';
    const query = searchFilter.toLowerCase();

    const matchSearch =
      title.toLowerCase().includes(query) ||
      company.toLowerCase().includes(query) ||
      location.toLowerCase().includes(query);

    const matchType = selectedType === 'All' || j.job_type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Shanora Header with Logo & Chat */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#070b14',
                border: '1px solid #1e293b',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
                padding: 0
              }}
            >
              ←
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#070b14', padding: '0.3rem 0.65rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <span style={{ backgroundColor: '#0284c7', color: '#fff', fontWeight: '900', fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>S</span>
              <span style={{ fontWeight: '900', fontSize: '0.88rem', letterSpacing: '0.5px', color: '#fff' }}>
                SHANORA<span style={{ color: '#38bdf8', fontSize: '0.7rem' }}>.PK</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              href="/chat"
              style={{
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                borderRadius: '20px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>💬</span> Chat
            </Link>
            <Link
              href="/employer"
              style={{
                backgroundColor: '#0284c7',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px'
              }}
            >
              + Post
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0.9rem 0.8rem 5.5rem 0.8rem' }}>
        {/* Tab Title Banner */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>💼</span>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>Career & Job Opportunities</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.5rem 0.9rem' }}>
            <span style={{ marginRight: '0.5rem', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Search title, company, or city..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {['All', 'Remote', 'Full-time', 'Part-time', 'Contract'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                style={{
                  backgroundColor: selectedType === type ? '#0284c7' : '#0f172a',
                  color: selectedType === type ? '#fff' : '#94a3b8',
                  border: selectedType === type ? '1px solid #0284c7' : '1px solid #1e293b',
                  borderRadius: '20px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#38bdf8' }}>Loading opportunities...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            No jobs found matching your criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {filteredJobs.map((job) => {
              const isApplied = !!appliedJobsMap[job.id];
              return (
                <div key={job.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '800', fontSize: '1rem' }}>{job.title}</div>
                      <div style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: '700', marginTop: '0.15rem' }}>{job.company_name}</div>
                    </div>
                    {job.job_type && (
                      <span style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.3)', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                        {job.job_type}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {job.location && <span>📍 {job.location}</span>}
                    {job.salary_range && <span>💰 {job.salary_range}</span>}
                  </div>

                  {job.description && <div style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.45 }}>{job.description}</div>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.7rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'recently'}
                    </span>
                    <button
                      type="button"
                      disabled={isApplied}
                      onClick={() => setActiveJobModal(job)}
                      style={{
                        backgroundColor: isApplied ? '#1e293b' : '#0284c7',
                        color: isApplied ? '#64748b' : '#fff',
                        border: isApplied ? '1px solid #334155' : 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 1.1rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: isApplied ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isApplied ? '✓ Applied' : 'Easy Apply'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {activeJobModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Apply to {activeJobModal.company_name}</h3>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{activeJobModal.title}</div>
              </div>
              <button type="button" onClick={() => setActiveJobModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Note to Hiring Manager:</label>
              <textarea
                rows={3}
                placeholder="Mention your relevant experience, skills, or portfolio..."
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '10px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setActiveJobModal(null)} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
              <button type="button" disabled={applying} onClick={handleApplyJob} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 1.2rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading opportunities...</div>}>
      <JobsContent />
    </Suspense>
  );
}
