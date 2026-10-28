'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';


export default function AdminPanel() {
  const [jobs, setJobs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadAdminData() {
      const { data: allJobs } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (allJobs) setJobs(allJobs);
      if (allProfiles) setProfiles(allProfiles);
      setLoading(false);
    }
    loadAdminData();
  }, []);

  async function handleDeleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job listing permanently?')) return;

    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
      setJobs(jobs.filter(j => j.id !== jobId));
      alert('Job listing deleted.');
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  async function handleToggleVerifyJob(jobId, currentStatus) {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_verified: !currentStatus })
        .eq('id', jobId);
      if (error) throw error;

      setJobs(jobs.map(j => j.id === jobId ? { ...j, is_verified: !currentStatus } : j));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading Shanora Master Admin...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Shanora PK — Master Admin</h1>
          <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Manage job authenticity, employers, and registered candidates.</p>
        </div>
        <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.82rem', border: '1px solid #334155' }}>
          Back to Portal ➔
        </Link>
      </div>

      {/* Metrics Overview */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Registered Users</span>
          <h2 style={{ margin: '0.3rem 0 0', color: '#38bdf8' }}>{profiles.length}</h2>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Live Job Listings</span>
          <h2 style={{ margin: '0.3rem 0 0', color: '#22c55e' }}>{jobs.length}</h2>
        </div>
      </div>

      {/* Job Moderation Table */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Job Listings Moderation</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {jobs.map(job => (
            <div key={job.id} style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.2rem 0', color: '#fff' }}>{job.title}</h4>
                <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{job.company}</span>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}> • {job.city} ({job.type})</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Poster: {job.employer_email || 'System Default'}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button 
                  onClick={() => handleToggleVerifyJob(job.id, job.is_verified)}
                  style={{
                    backgroundColor: job.is_verified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    color: job.is_verified ? '#22c55e' : '#fbbf24',
                    border: `1px solid ${job.is_verified ? '#22c55e' : '#fbbf24'}`,
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 'bold'
                  }}
                >
                  {job.is_verified ? 'Verified ✓' : 'Mark Verified'}
                </button>
                <button 
                  onClick={() => handleDeleteJob(job.id)}
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}
                >
                  Delete 🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
