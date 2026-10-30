'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPanel() {
  const [jobs, setJobs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [proRequests, setProRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    async function loadAdminData() {
      try {
        const { data: allJobs } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { data: allProRequests } = await supabase.from('pro_requests').select('*').order('created_at', { ascending: false });

        if (allJobs) setJobs(allJobs);
        if (allProfiles) setProfiles(allProfiles);
        if (allProRequests) setProRequests(allProRequests);
      } catch (err) {
        console.error('Error loading admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  // --- JOB ACTIONS ---
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

  // --- PRO SUBSCRIPTION ACTIONS ---
  async function handleApprovePro(reqItem) {
    if (!confirm(`Are you sure you want to grant Blue Tick and Shanora PRO to ${reqItem.user_email}?`)) return;

    setActionLoading(prev => ({ ...prev, [reqItem.id]: true }));
    try {
      // 1. Update request status to 'approved'
      const { error: reqError } = await supabase
        .from('pro_requests')
        .update({ status: 'approved' })
        .eq('id', reqItem.id);

      if (reqError) throw reqError;

      // 2. Grant Blue Tick & PRO status in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_pro: true, pro_plan: 'PRO_MONTHLY' })
        .ilike('email', reqItem.user_email.toLowerCase());

      if (profileError) throw profileError;

      // 3. Send Notification to User in English
      await supabase
        .from('notifications')
        .insert([{
          recipient_email: reqItem.user_email.toLowerCase(),
          sender_name: 'Shanora Team',
          action_type: 'pro',
          content: 'Congratulations! Your Shanora PRO membership and Blue Tick have been activated. 💎✨',
          is_read: false
        }]);

      setProRequests(prev => prev.map(r => r.id === reqItem.id ? { ...r, status: 'approved' } : r));
      setProfiles(prev => prev.map(p => (p.email || '').toLowerCase() === reqItem.user_email.toLowerCase() ? { ...p, is_pro: true } : p));
      alert('Approved! User has been granted Shanora PRO with Blue Tick. 💎');
    } catch (err) {
      alert('Approval Error: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [reqItem.id]: false }));
    }
  }

  async function handleRejectPro(reqItem) {
    if (!confirm(`Reject PRO request for ${reqItem.user_email}?`)) return;

    setActionLoading(prev => ({ ...prev, [reqItem.id]: true }));
    try {
      const { error } = await supabase
        .from('pro_requests')
        .update({ status: 'rejected' })
        .eq('id', reqItem.id);

      if (error) throw error;

      setProRequests(prev => prev.map(r => r.id === reqItem.id ? { ...r, status: 'rejected' } : r));
      alert('Request Rejected.');
    } catch (err) {
      alert('Rejection Error: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [reqItem.id]: false }));
    }
  }

  const approvedProCount = proRequests.filter(r => r.status === 'approved').length;
  const pendingProCount = proRequests.filter(r => r.status === 'pending').length;

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
          <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Manage job authenticity, PRO subscriptions, employers, and candidates.</p>
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
        <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pending PRO Requests</span>
          <h2 style={{ margin: '0.3rem 0 0', color: '#facc15' }}>{pendingProCount}</h2>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>PRO Revenue</span>
          <h2 style={{ margin: '0.3rem 0 0', color: '#4ade80' }}>Rs. {approvedProCount * 499}</h2>
        </div>
      </div>

      {/* SECTION 1: SHANORA PRO REQUESTS MANAGER */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 1.5rem', backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(250, 204, 21, 0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#facc15', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>💎</span> Shanora PRO & Blue Tick Requests ({proRequests.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Verify EasyPaisa / JazzCash transactions to grant Blue Tick</span>
          </div>
        </div>

        {proRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
            No PRO subscription requests submitted yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {proRequests.map(reqItem => (
              <div 
                key={reqItem.id} 
                style={{ 
                  backgroundColor: '#131b2e', 
                  padding: '1rem', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '0.8rem',
                  border: reqItem.status === 'pending' ? '1px solid rgba(250, 204, 21, 0.4)' : '1px solid #1e293b'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{reqItem.user_email}</strong>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      backgroundColor: reqItem.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : (reqItem.status === 'pending' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                      color: reqItem.status === 'approved' ? '#4ade80' : (reqItem.status === 'pending' ? '#facc15' : '#ef4444'),
                      textTransform: 'uppercase'
                    }}>
                      {reqItem.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span>Wallet: <strong style={{ color: '#cbd5e1' }}>{reqItem.payment_method}</strong></span>
                    <span>Amount: <strong style={{ color: '#4ade80' }}>Rs. {reqItem.amount || 499}</strong></span>
                    <span>TID: <code style={{ backgroundColor: '#070b14', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#38bdf8' }}>{reqItem.transaction_id}</code></span>
                  </div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Requested: {new Date(reqItem.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {reqItem.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprovePro(reqItem)}
                        disabled={actionLoading[reqItem.id]}
                        style={{
                          backgroundColor: '#22c55e',
                          color: '#000',
                          border: 'none',
                          padding: '0.45rem 0.9rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {actionLoading[reqItem.id] ? 'Processing...' : 'Approve & Blue Tick ✓'}
                      </button>
                      <button
                        onClick={() => handleRejectPro(reqItem)}
                        disabled={actionLoading[reqItem.id]}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Reject ✕
                      </button>
                    </>
                  ) : reqItem.status === 'approved' ? (
                    <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>Active Member 💎✓</span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>Declined ✕</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: JOB MODERATION TABLE */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Job Listings Moderation</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {jobs.map(job => (
            <div key={job.id} style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.2rem 0', color: '#fff' }}>{job.title}</h4>
                <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{job.company_name || job.company}</span>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}> • {job.location || job.city} ({job.job_type || job.type})</span>
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
