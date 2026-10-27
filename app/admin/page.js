'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tab, setTab] = useState('jobs'); // 'jobs' | 'students'
  
  // Job Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Lahore');
  const [type, setType] = useState('Fresh Graduate');
  const [applyLink, setApplyLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Data states
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Security Check (Default PIN: 1234)
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
      fetchAdminData();
    } else {
      alert('Ghalat PIN Code! Dobara koshish karein.');
    }
  };

  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      // Fetch Jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (jobsData) setJobs(jobsData);

      // Fetch Profiles
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (studentsData) setStudents(studentsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // Create or Update Job
  const handleSaveJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg('');

    const jobPayload = {
      title,
      company,
      location,
      type,
      apply_link: applyLink,
    };

    try {
      if (editingId) {
        // Update existing job
        const { error } = await supabase
          .from('jobs')
          .update(jobPayload)
          .eq('id', editingId);
        if (error) throw error;
        setStatusMsg('Job kamyabi se update ho gayi! ✅');
      } else {
        // Create new job
        const { error } = await supabase
          .from('jobs')
          .insert([jobPayload]);
        if (error) throw error;
        setStatusMsg('Nayi Job Shanora par live post ho gayi! 🚀');
      }

      // Reset form
      setTitle('');
      setCompany('');
      setLocation('Lahore');
      setType('Fresh Graduate');
      setApplyLink('');
      setEditingId(null);
      fetchAdminData();
    } catch (err) {
      setStatusMsg('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Start Edit
  const handleEditClick = (job) => {
    setEditingId(job.id);
    setTitle(job.title || '');
    setCompany(job.company || '');
    setLocation(job.location || 'Lahore');
    setType(job.type || 'Fresh Graduate');
    setApplyLink(job.apply_link || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Job
  const handleDeleteJob = async (id) => {
    const confirmDelete = window.confirm('Kya aap waqai is job ko delete karna chahte hain?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setJobs(jobs.filter(j => j.id !== id));
      alert('Job delete ho gayi! 🗑️');
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Generate WhatsApp Share Message
  const copyWhatsAppText = (job) => {
    const text = `📢 *Shanora PK - Verified Opportunity*\n\n💼 *Role:* ${job.title}\n🏢 *Company:* ${job.company}\n📍 *Location:* ${job.location}\n🎯 *Type:* ${job.type}\n\n🔗 *Apply Here:* ${job.apply_link}\n\n👉 Join Official WhatsApp Channel: https://whatsapp.com/channel/0029VbDvJtl5a242cAW6DF2s`;
    navigator.clipboard.writeText(text);
    alert('WhatsApp post copy ho gayi! Ab aap channel mein paste kar sakte hain.');
  };

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', padding: '1rem', fontFamily: 'sans-serif', color: '#fff' }}>
        <div style={{ backgroundColor: '#131b2e', padding: '2rem', borderRadius: '14px', border: '1px solid #1e293b', width: '100%', maxWidth: '380px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Shanora Admin 🔒</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Management Panel mein dakhil hone ke liye PIN likhein:</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter PIN (e.g. 1234)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '1rem', textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
            />
            <button
              type="submit"
              style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Unlock Dashboard 🔓
            </button>
          </form>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/" style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>← Back to Website</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '1.25rem 1rem', maxWidth: '950px', margin: '0 auto', fontFamily: 'sans-serif', color: '#f8fafc' }}>
      
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#131b2e', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Shanora Admin</span>
          <span style={{ backgroundColor: '#22c55e', color: '#090d16', fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 'bold' }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setTab('jobs')} style={{ backgroundColor: tab === 'jobs' ? '#0284c7' : '#0a0f1d', color: '#fff', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
            Jobs Control ({jobs.length})
          </button>
          <button onClick={() => setTab('students')} style={{ backgroundColor: tab === 'students' ? '#0284c7' : '#0a0f1d', color: '#fff', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
            Students List ({students.length})
          </button>
          <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.82rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d' }}>
            View Site ↗
          </Link>
        </div>
      </div>

      {tab === 'jobs' ? (
        <div>
          {/* Post or Edit Job Box */}
          <section style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', margin: 0, color: editingId ? '#facc15' : '#38bdf8' }}>
                {editingId ? '✏️ Edit Job Details' : '➕ Post a New Opportunity'}
              </h2>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setCompany('');
                    setApplyLink('');
                  }}
                  style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveJob} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Job Title *</label>
                  <input type="text" required placeholder="e.g. Graduate Trainee Engineer" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Company Name *</label>
                  <input type="text" required placeholder="e.g. Systems Limited, Arbisoft" value={company} onChange={(e) => setCompany(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Location / City</label>
                  <input type="text" placeholder="e.g. Lahore / Remote / Karachi" value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Category / Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                    <option value="Fresh Graduate">Fresh Graduate</option>
                    <option value="Internship">Internship</option>
                    <option value="Entry-Level">Entry-Level</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Apply Link (URL or Email) *</label>
                <input type="text" required placeholder="https://company.com/careers or mailto:hr@..." value={applyLink} onChange={(e) => setApplyLink(e.target.value)} style={inputStyle} />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: editingId ? '#facc15' : '#22c55e', color: '#090d16', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' }}
              >
                {submitting ? 'Processing...' : editingId ? 'Save & Update Job 🔄' : 'Publish to Shanora Live 🚀'}
              </button>
            </form>

            {statusMsg && <div style={{ marginTop: '0.75rem', color: '#4ade80', fontSize: '0.85rem' }}>{statusMsg}</div>}
          </section>

          {/* Jobs Listing & Control */}
          <section>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#fff' }}>Manage Live Jobs ({jobs.length})</h3>
            
            {loadingData ? (
              <div style={{ color: '#94a3b8' }}>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div style={{ color: '#94a3b8', backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '10px' }}>Abhi koi job post nahi hui. Upar wala form fill karke pehli job post karein!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {jobs.map((job) => (
                  <div key={job.id} style={{ backgroundColor: '#131b2e', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{job.title}</strong>
                      <div style={{ color: '#38bdf8', fontSize: '0.82rem' }}>{job.company} • <span style={{ color: '#94a3b8' }}>{job.location} ({job.type})</span></div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => copyWhatsAppText(job)}
                        style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', padding: '0.4rem 0.7rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        WhatsApp Text 📢
                      </button>
                      <button
                        onClick={() => handleEditClick(job)}
                        style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.7rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Edit ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.7rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Delete 🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Students List Tab */
        <section>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#fff' }}>Registered Graduates ({students.length})</h3>
          {students.length === 0 ? (
            <div style={{ color: '#94a3b8', backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '10px' }}>Abhi koi student register nahi hua.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {students.map((std) => (
                <div key={std.id} style={{ backgroundColor: '#131b2e', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{std.full_name || 'Anonymous Student'}</strong>
                    <div style={{ color: '#38bdf8', fontSize: '0.82rem' }}>{std.degree} • {std.university} ({std.city})</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>WhatsApp: {std.phone || 'N/A'} | Email: {std.email}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {std.phone && (
                      <a
                        href={`https://wa.me/92${std.phone.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.4rem 0.7rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 'bold' }}
                      >
                        Direct WhatsApp 💬
                      </a>
                    )}
                    {std.resume_url && (
                      <a
                        href={std.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.4rem 0.7rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem' }}
                      >
                        View CV 📄
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <footer style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
        Shanora Pakistan • Secure Operations Control
      </footer>

    </main>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.8rem',
  borderRadius: '8px',
  border: '1px solid #334155',
  backgroundColor: '#0a0f1d',
  color: '#fff',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
  marginTop: '0.25rem'
};
    
