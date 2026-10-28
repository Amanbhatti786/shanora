'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function EmployerPortal() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Data States
  const [postedJobs, setPostedJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('all');

  // New Job Form State
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    city: 'Lahore',
    type: 'Full-time',
    workplace: 'Onsite',
    salary: 'PKR 60,000 - 80,000',
    category: 'Software & Web',
    experience_level: 'Fresher',
    description: '',
    location: 'Lahore, Pakistan'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadEmployerData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);

      try {
        // Fetch jobs posted by this employer
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_email', session.user.email)
          .order('created_at', { ascending: false });

        if (jobsData) {
          setPostedJobs(jobsData);
          if (jobsData.length > 0) {
            setJobForm(prev => ({ ...prev, company: jobsData[0].company || '' }));
          }
        }

        // Fetch applications for all jobs posted by this employer
        const { data: appsData } = await supabase
          .from('applications')
          .select('*, jobs(*)')
          .order('applied_at', { ascending: false });

        if (appsData && jobsData) {
          const myJobIds = new Set(jobsData.map(j => Number(j.id)));
          const myApplicants = appsData.filter(a => myJobIds.has(Number(a.job_id)));
          setApplicants(myApplicants);
        }
      } catch (err) {
        console.error('Employer load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEmployerData();
  }, [router]);

  // Handle New Job Post
  async function handleCreateJob(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const payload = {
        title: jobForm.title.trim(),
        company: jobForm.company.trim(),
        city: jobForm.city.trim(),
        location: `${jobForm.city.trim()}, Pakistan`,
        type: jobForm.type,
        workplace: jobForm.workplace,
        salary: jobForm.salary.trim(),
        category: jobForm.category,
        experience_level: jobForm.experience_level,
        description: jobForm.description.trim(),
        employer_email: user.email.toLowerCase().trim(),
        is_verified: true
      };

      const { data, error } = await supabase.from('jobs').insert([payload]).select().single();
      if (error) throw error;

      setPostedJobs([data, ...postedJobs]);
      setStatusMsg({ text: 'Job opening posted successfully! 🎉', type: 'success' });
      setJobForm({
        ...jobForm,
        title: '',
        description: ''
      });
      setActiveTab('jobs');
    } catch (err) {
      setStatusMsg({ text: 'Failed to post job: ' + err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  // Update Candidate Status (Shortlist, Interview, etc.)
  async function handleStatusChange(applicationId, newStatus) {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplicants(applicants.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      setStatusMsg({ text: `Applicant status updated to ${newStatus}!`, type: 'success' });
    } catch (err) {
      alert('Could not update status: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading Employer Portal...
      </div>
    );
  }

  const filteredApplicants = selectedJobId === 'all' 
    ? applicants 
    : applicants.filter(a => Number(a.job_id) === Number(selectedJobId));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
          </Link>
          <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
            RECRUITER SUITE
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Link href="/profile" style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>
            Student View
          </Link>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{user?.email}</span>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '950px', margin: '1.5rem auto', padding: '0 1rem' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('jobs')}
            style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'jobs' ? '#0284c7' : '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
          >
            My Job Postings ({postedJobs.length})
          </button>
          <button 
            onClick={() => setActiveTab('applicants')}
            style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'applicants' ? '#0284c7' : '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
          >
            Review Applicants ({applicants.length})
          </button>
          <button 
            onClick={() => setActiveTab('new-job')}
            style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'new-job' ? '#0284c7' : '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
          >
            + Post A New Job
          </button>
        </div>

        {statusMsg.text && (
          <div style={{ padding: '0.8rem', borderRadius: '8px', marginBottom: '1.2rem', backgroundColor: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: statusMsg.type === 'error' ? '#fca5a5' : '#86efac', border: `1px solid ${statusMsg.type === 'error' ? '#ef4444' : '#22c55e'}`, fontSize: '0.85rem' }}>
            {statusMsg.text}
          </div>
        )}

        {/* TAB 1: POSTED JOBS */}
        {activeTab === 'jobs' && (
          <div>
            {postedJobs.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', padding: '2.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #1e293b' }}>
                <p style={{ color: '#94a3b8', margin: '0 0 1rem 0' }}>You have not posted any active job vacancies yet.</p>
                <button onClick={() => setActiveTab('new-job')} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Post Your First Job Opening
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {postedJobs.map(job => (
                  <div key={job.id} style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem' }}>{job.title}</h3>
                      <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: '600' }}>{job.company}</span>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}> • {job.city} ({job.type})</span>
                      <p style={{ margin: '0.4rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>{job.salary}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedJobId(job.id); setActiveTab('applicants'); }}
                      style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      View Candidates ({applicants.filter(a => Number(a.job_id) === Number(job.id)).length})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPLICANTS REVIEW */}
        {activeTab === 'applicants' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Candidate Applications</h2>
              <select 
                value={selectedJobId} 
                onChange={e => setSelectedJobId(e.target.value)}
                style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff', fontSize: '0.8rem' }}
              >
                <option value="all">All Vacancies</option>
                {postedJobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>

            {filteredApplicants.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', padding: '2rem', textAlign: 'center', borderRadius: '12px', color: '#94a3b8' }}>
                No candidate has applied to this opening yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {filteredApplicants.map(app => (
                  <div key={app.id} style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem', color: '#fff' }}>Candidate: {app.student_email}</h4>
                      <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>Position: {app.jobs?.title || 'Job Opening'}</span>
                      <span style={{ color: '#64748b', fontSize: '0.78rem' }}> • Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                      
                      <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.6rem' }}>
                        {app.resume_url && (
                          <a href={app.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: '#1e293b', color: '#22c55e', padding: '0.3rem 0.7rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', border: '1px solid #334155', fontWeight: 'bold' }}>
                            View PDF CV 📄
                          </a>
                        )}
                        <Link href={`/view-profile?email=${encodeURIComponent(app.student_email)}`} target="_blank" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.3rem 0.7rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', border: '1px solid #334155' }}>
                          View Portfolio 🔗
                        </Link>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Status:</span>
                      <select 
                        value={app.status || 'Applied'} 
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        style={{ padding: '0.45rem 0.7rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview">Interview</option>
                        <option value="Hired">Hired</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POST A NEW JOB */}
        {activeTab === 'new-job' && (
          <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0' }}>Post a Graduate / Entry-Level Vacancy</h2>
            
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Job Title *</label>
                  <input type="text" required placeholder="e.g. Trainee Software Engineer" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Company Name *</label>
                  <input type="text" required placeholder="e.g. Systems Ltd" value={jobForm.company} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>City</label>
                  <input type="text" value={jobForm.city} onChange={e => setJobForm({ ...jobForm, city: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Workplace</label>
                  <select value={jobForm.workplace} onChange={e => setJobForm({ ...jobForm, workplace: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}>
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Type</label>
                  <select value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}>
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Trainee">Trainee</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Monthly Salary / Stipend (PKR)</label>
                <input type="text" placeholder="e.g. PKR 50,000 - 75,000" value={jobForm.salary} onChange={e => setJobForm({ ...jobForm, salary: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Job Description & Expectations *</label>
                <textarea rows={4} required placeholder="Detail the duties, tools, and technical expectations..." value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              <button type="submit" disabled={submitting} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                {submitting ? 'Publishing...' : 'Publish Job Opportunity 🚀'}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}
  
