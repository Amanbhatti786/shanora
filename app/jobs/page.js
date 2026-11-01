'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function JobsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [appliedJobsMap, setAppliedJobsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Application Modal State
  const [activeJobModal, setActiveJobModal] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function loadJobsData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user || null;
        setCurrentUser(user);

        if (user?.email) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
          setUserProfile(prof);

          // User ki existing applications load karein
          const { data: userApps } = await supabase
            .from('job_applications')
            .select('job_id')
            .eq('applicant_email', user.email.toLowerCase());

          const appMap = {};
          (userApps || []).forEach(a => { appMap[a.job_id] = true; });
          setAppliedJobsMap(appMap);
        }

        // Jobs fetch karein
        const { data: allJobs, error } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && allJobs) {
          setJobs(allJobs);
        }
      } catch (err) {
        console.error('Error loading jobs:', err);
      } finally {
        setLoading(false);
      }
    }

    loadJobsData();
  }, []);

  // Quick Easy Apply
  async function handleApplyJob() {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!activeJobModal) return;

    setApplying(true);
    const applicantEmail = currentUser.email.toLowerCase();
    const applicantName = userProfile?.name || currentUser.user_metadata?.full_name || applicantEmail.split('@')[0];
    const resumeUrl = userProfile?.resume_url || null;

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert([{
          job_id: activeJobModal.id,
          applicant_email: applicantEmail,
          applicant_name: applicantName,
          applicant_resume_url: resumeUrl,
          cover_note: coverNote.trim() || 'Applied via Shanora Quick Apply.'
        }]);

      if (error) throw error;

      alert('Application submitted successfully! 🚀');
      setAppliedJobsMap(prev => ({ ...prev, [activeJobModal.id]: true }));
      setActiveJobModal(null);
      setCoverNote('');
    } catch (err) {
      alert('Application failed: ' + err.message);
    } finally {
      setApplying(false);
    }
  }

  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        j.company_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        j.location.toLowerCase().includes(searchFilter.toLowerCase());
    const matchType = selectedType === 'All' || j.job_type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💼</span>
            <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#fff' }}>Shanora Jobs</span>
          </div>

          <Link href="/employer" style={{
            backgroundColor: '#0284c7',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.78rem',
            fontWeight: '700',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px'
          }}>
            + Post a Job
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.8rem 5.5rem 0.8rem' }}>
        
        {/* Search & Filter Bar */}
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

          {/* Quick Filter Tags */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {['All', 'Remote', 'Full-time', 'Part-time', 'Contract'].map(type => (
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

        {/* Jobs List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#38bdf8' }}>Loading opportunities...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            No jobs found matching your criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {filteredJobs.map(job => {
              const isApplied = !!appliedJobsMap[job.id];

              return (
                <div key={job.id} style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.7rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '800', fontSize: '1rem' }}>
                        {job.title}
                      </div>
                      <div style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: '700', marginTop: '0.15rem' }}>
                        {job.company_name}
                      </div>
                    </div>

                    <span style={{
                      backgroundColor: 'rgba(2, 132, 199, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px'
                    }}>
                      {job.job_type}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary_range}</span>
                  </div>

                  <div style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.45 }}>
                    {job.description}
                  </div>

                  {job.requirements && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: '#0b1322', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <strong style={{ color: '#e2e8f0' }}>Requirements:</strong> {job.requirements}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.7rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Posted {new Date(job.created_at).toLocaleDateString()}
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

      {/* Easy Apply Modal */}
      {activeJobModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Apply to {activeJobModal.company_name}</h3>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{activeJobModal.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveJobModal(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Note to Hiring Manager:
              </label>
              <textarea
                rows={3}
                placeholder="Mention your relevant experience, skills, or portfolio..."
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '10px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ backgroundColor: '#070b14', padding: '0.65rem', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '0.74rem', color: '#94a3b8' }}>
              📄 Your Shanora profile and ATS resume will be attached automatically.
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveJobModal(null)}
                style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applying}
                onClick={handleApplyJob}
                style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 1.2rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
        }
        
