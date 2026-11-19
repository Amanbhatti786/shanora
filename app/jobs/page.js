'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const EMPTY_JOB_FORM = {
  title: '',
  company_name: '',
  city: '',
  location: '',
  workplace: 'Remote',
  job_type: 'Full-time',
  salary_range: '',
  category: 'Technology & IT',
  experience_level: 'Mid-Level',
  description: '',
  requirementsText: '',
  apply_link: '',
  contact_email: ''
};

function JobsContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [appliedJobsMap, setAppliedJobsMap] = useState({});
  const [myApplications, setMyApplications] = useState([]);
  const [employerApplications, setEmployerApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my_jobs' | 'my_apps'
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  // Post Job Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);
  const [postingJob, setPostingJob] = useState(false);

  // Apply Modal State
  const [activeJobModal, setActiveJobModal] = useState(null);
  const [applyForm, setApplyForm] = useState({
    applicant_name: '',
    applicant_email: '',
    phone: '',
    city: '',
    experience: '',
    resume_link: '',
    cover_note: ''
  });
  const [applying, setApplying] = useState(false);

  // Applicants Drawer/Modal for a specific posted job
  const [viewingJobApplicants, setViewingJobApplicants] = useState(null);

  const showNotice = (type, text) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const loadJobsData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user || null;

      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user || null;
      }

      setCurrentUser(user);

      const { data: allJobs, error: jobsErr } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!jobsErr && allJobs) {
        setJobs(allJobs);
      }

      if (user) {
        const userEmail = (user.email || '').trim().toLowerCase();

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${user.id},email.eq.${userEmail}`)
          .maybeSingle();

        setUserProfile(prof || null);

        // Fetch applications submitted by this user
        const { data: userApps } = await supabase
          .from('job_applications')
          .select('*')
          .or(`applicant_id.eq.${user.id},applicant_email.eq.${userEmail}`)
          .order('created_at', { ascending: false });

        const appMap = {};
        (userApps || []).forEach((a) => {
          appMap[a.job_id] = a.status || 'Applied';
        });
        setAppliedJobsMap(appMap);
        setMyApplications(userApps || []);

        // Fetch applications for jobs posted by this user
        const { data: empApps } = await supabase
          .from('job_applications')
          .select('*')
          .eq('employer_id', user.id)
          .order('created_at', { ascending: false });

        setEmployerApplications(empApps || []);
      } else {
        setUserProfile(null);
        setAppliedJobsMap({});
        setMyApplications([]);
        setEmployerApplications([]);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
      showNotice('error', 'Failed to load jobs data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobsData();
  }, [loadJobsData]);

  function openPostJobModal() {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setJobForm({
      ...EMPTY_JOB_FORM,
      company_name: userProfile?.company_name || '',
      city: userProfile?.city || '',
      contact_email: currentUser.email || ''
    });
    setShowPostModal(true);
  }

  async function handleCreateJob(e) {
    e.preventDefault();
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    if (!jobForm.title.trim() || !jobForm.company_name.trim() || !jobForm.description.trim()) {
      showNotice('error', 'Job title, company name, and description are required.');
      return;
    }

    setPostingJob(true);
    try {
      const parsedRequirements = jobForm.requirementsText
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);

      const finalLocation =
        jobForm.location.trim() ||
        jobForm.city.trim() ||
        (jobForm.workplace === 'Remote' ? 'Remote' : 'Pakistan');

      const payload = {
        title: jobForm.title.trim(),
        company_name: jobForm.company_name.trim(),
        company: jobForm.company_name.trim(),
        city: jobForm.city.trim() || null,
        location: finalLocation,
        workplace: jobForm.workplace,
        job_type: jobForm.job_type,
        type: jobForm.job_type,
        salary_range: jobForm.salary_range.trim() || null,
        salary: jobForm.salary_range.trim() || null,
        category: jobForm.category.trim() || 'General',
        experience_level: jobForm.experience_level,
        description: jobForm.description.trim(),
        requirements: parsedRequirements.length > 0 ? parsedRequirements : null,
        apply_link: jobForm.apply_link.trim() || null,
        contact_email: jobForm.contact_email.trim() || currentUser.email,
        status: 'Open',
        created_by: currentUser.id
      };

      const { data: insertedJob, error } = await supabase
        .from('jobs')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setJobs((prev) => [insertedJob, ...prev]);
      setShowPostModal(false);
      setJobForm(EMPTY_JOB_FORM);
      showNotice('success', 'Job posted live on SHANORA!');
    } catch (err) {
      showNotice('error', 'Could not post job: ' + err.message);
    } finally {
      setPostingJob(false);
    }
  }

  function openApplyModal(job) {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    const defaultName =
      userProfile?.full_name ||
      userProfile?.name ||
      currentUser.user_metadata?.full_name ||
      (currentUser.email || '').split('@')[0];

    setApplyForm({
      applicant_name: defaultName || '',
      applicant_email: (currentUser.email || '').toLowerCase(),
      phone: userProfile?.phone || '',
      city: userProfile?.city || '',
      experience: userProfile?.experience || '',
      resume_link: userProfile?.resume_url || userProfile?.resume_link || '',
      cover_note: ''
    });
    setActiveJobModal(job);
  }

  async function handleApplyJob(e) {
    e.preventDefault();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!activeJobModal) return;

    if (!applyForm.applicant_name.trim() || !applyForm.applicant_email.trim()) {
      showNotice('error', 'Please enter your name and email.');
      return;
    }

    setApplying(true);
    try {
      const employerId = activeJobModal.created_by || currentUser.id;

      const applicationPayload = {
        job_id: activeJobModal.id,
        applicant_id: currentUser.id,
        employer_id: employerId,
        applicant_name: applyForm.applicant_name.trim(),
        applicant_email: applyForm.applicant_email.trim().toLowerCase(),
        phone: applyForm.phone.trim() || null,
        city: applyForm.city.trim() || null,
        experience: applyForm.experience.trim() || null,
        resume_link: applyForm.resume_link.trim() || null,
        cover_note: applyForm.cover_note.trim() || 'Applied via Shanora Quick Apply.',
        status: 'Applied'
      };

      const { data: createdApp, error } = await supabase
        .from('job_applications')
        .insert([applicationPayload])
        .select()
        .single();

      if (error) throw error;

      setAppliedJobsMap((prev) => ({ ...prev, [activeJobModal.id]: 'Applied' }));
      if (createdApp) {
        setMyApplications((prev) => [createdApp, ...prev]);
        if (createdApp.employer_id === currentUser.id) {
          setEmployerApplications((prev) => [createdApp, ...prev]);
        }
      }

      setActiveJobModal(null);
      showNotice('success', 'Application submitted successfully!');
    } catch (err) {
      showNotice('error', 'Application failed: ' + err.message);
    } finally {
      setApplying(false);
    }
  }

  async function handleUpdateApplicationStatus(applicationId, nextStatus) {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: nextStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setEmployerApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: nextStatus } : app))
      );
      showNotice('success', `Candidate marked as ${nextStatus}.`);
    } catch (err) {
      showNotice('error', 'Status update failed: ' + err.message);
    }
  }

  async function handleToggleJobStatus(job) {
    const nextStatus = job.status === 'Closed' ? 'Open' : 'Closed';
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: nextStatus })
        .eq('id', job.id);

      if (error) throw error;

      setJobs((prev) =>
        prev.map((item) => (item.id === job.id ? { ...item, status: nextStatus } : item))
      );
      showNotice('success', `Job status set to ${nextStatus}.`);
    } catch (err) {
      showNotice('error', 'Could not update job status: ' + err.message);
    }
  }

  const myPostedJobs = currentUser
    ? jobs.filter((j) => j.created_by === currentUser.id)
    : [];

  const jobTitleById = {};
  jobs.forEach((j) => {
    jobTitleById[j.id] = {
      title: j.title,
      company: j.company_name || j.company || 'Company'
    };
  });

  const filteredJobs = jobs.filter((j) => {
    const title = j.title || '';
    const company = j.company_name || j.company || '';
    const location = j.location || j.city || '';
    const query = searchFilter.toLowerCase();

    const matchSearch =
      title.toLowerCase().includes(query) ||
      company.toLowerCase().includes(query) ||
      location.toLowerCase().includes(query);

    const jobTypeVal = j.job_type || j.type || '';
    const matchType = selectedType === 'All' || jobTypeVal === selectedType;
    return matchSearch && matchType;
  });

  const applicantsForSelectedJob = viewingJobApplicants
    ? employerApplications.filter((app) => app.job_id === viewingJobApplicants.id)
    : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Exact Shanora Header */}
      <header
        style={{
          backgroundColor: '#070b14',
          borderBottom: '1px solid #1e293b',
          padding: '0.65rem 1rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                padding: 0
              }}
            >
              ←
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                backgroundColor: '#0f172a',
                padding: '0.35rem 0.85rem',
                borderRadius: '14px',
                border: '1px solid #1e293b',
                height: '38px',
                boxSizing: 'border-box'
              }}
            >
              <span
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  fontWeight: '900',
                  fontSize: '0.95rem',
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                S
              </span>
              <span
                style={{
                  fontWeight: '900',
                  fontSize: '1.05rem',
                  letterSpacing: '0.5px',
                  color: '#ffffff'
                }}
              >
                SHANORA<span style={{ color: '#38bdf8', fontSize: '0.78rem' }}>.PK</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openPostJobModal}
            style={{
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.48rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            + Post a Job
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0.9rem 0.8rem 5.5rem 0.8rem' }}>
        {feedbackBanner && (
          <div
            style={{
              backgroundColor: feedbackBanner.type === 'error' ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.14)',
              border: `1px solid ${feedbackBanner.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
              color: feedbackBanner.type === 'error' ? '#fca5a5' : '#6ee7b7',
              borderRadius: '10px',
              padding: '0.65rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              marginBottom: '0.85rem'
            }}
          >
            {feedbackBanner.text}
          </div>
        )}

        {/* Tab Title Banner */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '0.7rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.55rem',
            marginBottom: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💼</span>
            <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>Career & Job Opportunities</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '700' }}>
            {jobs.length} Listed
          </span>
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.15rem' }}>
          {[
            { id: 'browse', label: `All Jobs (${jobs.length})` },
            { id: 'my_jobs', label: `My Posted Jobs (${myPostedJobs.length})` },
            { id: 'my_apps', label: `Applied (${myApplications.length})` }
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: active ? '#0284c7' : '#0f172a',
                  color: active ? '#fff' : '#94a3b8',
                  border: active ? '1px solid #0284c7' : '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '0.42rem 0.8rem',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#38bdf8' }}>Loading opportunities...</div>
        ) : activeTab === 'browse' ? (
          <>
            {/* Search & Type Filter */}
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
                {['All', 'Remote', 'Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => (
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

            {filteredJobs.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                No jobs found matching your criteria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {filteredJobs.map((job) => {
                  const appStatus = appliedJobsMap[job.id];
                  const isApplied = !!appStatus;
                  const isOwner = currentUser && job.created_by === currentUser.id;
                  const jobStatus = job.status || 'Open';
                  const companyLabel = job.company_name || job.company || 'Company';
                  const typeLabel = job.job_type || job.type;
                  const locationLabel = job.location || job.city;

                  return (
                    <div key={job.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ color: '#fff', fontWeight: '800', fontSize: '1rem' }}>{job.title}</div>
                          <div style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: '700', marginTop: '0.15rem' }}>{companyLabel}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {typeLabel && (
                            <span style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.3)', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                              {typeLabel}
                            </span>
                          )}
                          <span
                            style={{
                              backgroundColor: jobStatus === 'Closed' ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.14)',
                              color: jobStatus === 'Closed' ? '#fca5a5' : '#6ee7b7',
                              fontSize: '0.68rem',
                              fontWeight: '800',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px'
                            }}
                          >
                            {jobStatus}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#94a3b8' }}>
                        {locationLabel && <span>📍 {locationLabel}</span>}
                        {job.workplace && <span>🏢 {job.workplace}</span>}
                        {job.experience_level && <span>🎯 {job.experience_level}</span>}
                        {(job.salary_range || job.salary) && <span>💰 {job.salary_range || job.salary}</span>}
                      </div>

                      {job.description && (
                        <div style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.45 }}>
                          {job.description}
                        </div>
                      )}

                      {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {job.requirements.map((req, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#070b14',
                                border: '1px solid #1e293b',
                                color: '#cbd5e1',
                                fontSize: '0.7rem',
                                padding: '0.18rem 0.5rem',
                                borderRadius: '6px'
                              }}
                            >
                              {req}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.7rem', marginTop: '0.2rem', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'recently'}
                        </span>

                        {isOwner ? (
                          <button
                            type="button"
                            onClick={() => setViewingJobApplicants(job)}
                            style={{
                              backgroundColor: '#1e293b',
                              color: '#38bdf8',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              padding: '0.45rem 0.9rem',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            View Applicants ({employerApplications.filter((a) => a.job_id === job.id).length})
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isApplied || jobStatus === 'Closed'}
                            onClick={() => openApplyModal(job)}
                            style={{
                              backgroundColor: isApplied || jobStatus === 'Closed' ? '#1e293b' : '#0284c7',
                              color: isApplied || jobStatus === 'Closed' ? '#64748b' : '#fff',
                              border: isApplied || jobStatus === 'Closed' ? '1px solid #334155' : 'none',
                              borderRadius: '8px',
                              padding: '0.45rem 1.1rem',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: isApplied || jobStatus === 'Closed' ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isApplied ? `✓ ${appStatus}` : jobStatus === 'Closed' ? 'Closed' : 'Easy Apply'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : activeTab === 'my_jobs' ? (
          /* Employer View: My Posted Jobs & Applicants */
          !currentUser ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Please sign in to view jobs you posted and manage applicants.
            </div>
          ) : myPostedJobs.length === 0 ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.2rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ marginBottom: '0.8rem' }}>You haven&apos;t posted any jobs yet.</div>
              <button
                type="button"
                onClick={openPostJobModal}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Post Your First Job
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {myPostedJobs.map((job) => {
                const appsCount = employerApplications.filter((a) => a.job_id === job.id).length;
                const isClosed = job.status === 'Closed';
                return (
                  <div key={job.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.98rem' }}>{job.title}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                          {job.company_name || job.company} • {job.location || job.city || 'Remote'}
                        </div>
                      </div>
                      <span
                        style={{
                          backgroundColor: isClosed ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.14)',
                          color: isClosed ? '#fca5a5' : '#6ee7b7',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          padding: '0.22rem 0.55rem',
                          borderRadius: '6px'
                        }}
                      >
                        {job.status || 'Open'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.65rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setViewingJobApplicants(job)}
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.45rem 0.9rem',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Applicants ({appsCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleJobStatus(job)}
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#cbd5e1',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isClosed ? 'Reopen Job' : 'Close Job'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Applicant View: My Submitted Applications */
          !currentUser ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Please sign in to track your job applications.
            </div>
          ) : myApplications.length === 0 ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.2rem', textAlign: 'center', color: '#94a3b8' }}>
              You haven&apos;t applied to any jobs yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {myApplications.map((app) => {
                const jobMeta = jobTitleById[app.job_id] || { title: `Job #${app.job_id}`, company: 'SHANORA Listing' };
                return (
                  <div key={app.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.92rem' }}>{jobMeta.title}</div>
                        <div style={{ color: '#38bdf8', fontSize: '0.76rem', fontWeight: '700' }}>{jobMeta.company}</div>
                      </div>
                      <span
                        style={{
                          backgroundColor: 'rgba(2, 132, 199, 0.16)',
                          color: '#38bdf8',
                          border: '1px solid rgba(2, 132, 199, 0.35)',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '0.22rem 0.6rem',
                          borderRadius: '999px'
                        }}
                      >
                        {app.status || 'Applied'}
                      </span>
                    </div>
                    {app.cover_note && (
                      <div style={{ color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.4 }}>
                        “{app.cover_note}”
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Applied {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'recently'}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {/* Post a Job Modal */}
      {showPostModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <form
            onSubmit={handleCreateJob}
            style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Post a Job Opportunity</h3>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.15rem' }}>Publish directly to SHANORA Jobs</div>
              </div>
              <button type="button" onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Frontend Developer (Next.js)"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shanora Labs"
                  value={jobForm.company_name}
                  onChange={(e) => setJobForm({ ...jobForm, company_name: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Karachi / Remote"
                  value={jobForm.city}
                  onChange={(e) => setJobForm({ ...jobForm, city: e.target.value, location: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Job Type</label>
                <select
                  value={jobForm.job_type}
                  onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.5rem', color: '#fff', fontSize: '0.8rem' }}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Workplace</label>
                <select
                  value={jobForm.workplace}
                  onChange={(e) => setJobForm({ ...jobForm, workplace: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.5rem', color: '#fff', fontSize: '0.8rem' }}
                >
                  <option value="Remote">Remote</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Experience</label>
                <select
                  value={jobForm.experience_level}
                  onChange={(e) => setJobForm({ ...jobForm, experience_level: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.5rem', color: '#fff', fontSize: '0.8rem' }}
                >
                  <option value="Entry-Level">Entry-Level</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Salary Range</label>
                <input
                  type="text"
                  placeholder="e.g. PKR 80k - 140k / mo"
                  value={jobForm.salary_range}
                  onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Category</label>
                <input
                  type="text"
                  placeholder="e.g. Software / Design / Sales"
                  value={jobForm.category}
                  onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Key Skills / Requirements (comma separated)</label>
              <input
                type="text"
                placeholder="React, TypeScript, Supabase, Git"
                value={jobForm.requirementsText}
                onChange={(e) => setJobForm({ ...jobForm, requirementsText: e.target.value })}
                style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: '700' }}>Job Description *</label>
              <textarea
                rows={3}
                required
                placeholder="Describe responsibilities, expectations, and team details..."
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '9px', padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
              <button type="button" onClick={() => setShowPostModal(false)} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={postingJob} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 1.2rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                {postingJob ? 'Publishing...' : 'Publish Job'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Apply Now Modal */}
      {activeJobModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <form
            onSubmit={handleApplyJob}
            style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '490px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.7rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Apply to {activeJobModal.company_name || activeJobModal.company}</h3>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{activeJobModal.title}</div>
              </div>
              <button type="button" onClick={() => setActiveJobModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={applyForm.applicant_name}
                  onChange={(e) => setApplyForm({ ...applyForm, applicant_name: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Email *</label>
                <input
                  type="email"
                  required
                  value={applyForm.applicant_email}
                  onChange={(e) => setApplyForm({ ...applyForm, applicant_email: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+92 3xx xxxxxxx"
                  value={applyForm.phone}
                  onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>City & Experience</label>
                <input
                  type="text"
                  placeholder="e.g. Karachi, 2 yrs"
                  value={applyForm.experience}
                  onChange={(e) => setApplyForm({ ...applyForm, experience: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Resume / Portfolio Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={applyForm.resume_link}
                onChange={(e) => setApplyForm({ ...applyForm, resume_link: e.target.value })}
                style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Note to Hiring Manager:</label>
              <textarea
                rows={3}
                placeholder="Mention your relevant experience, skills, or portfolio..."
                value={applyForm.cover_note}
                onChange={(e) => setApplyForm({ ...applyForm, cover_note: e.target.value })}
                style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '10px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setActiveJobModal(null)} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={applying} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 1.2rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employer Applicants Modal */}
      {viewingJobApplicants && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Applicants — {viewingJobApplicants.title}</h3>
                <div style={{ color: '#38bdf8', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                  {applicantsForSelectedJob.length} candidate{applicantsForSelectedJob.length === 1 ? '' : 's'}
                </div>
              </div>
              <button type="button" onClick={() => setViewingJobApplicants(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {applicantsForSelectedJob.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', padding: '1.5rem 0', textAlign: 'center' }}>
                No applications received for this role yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {applicantsForSelectedJob.map((app) => (
                  <div key={app.id} style={{ backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>{app.applicant_name || 'Applicant'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{app.applicant_email}</div>
                      </div>
                      <select
                        value={app.status || 'Applied'}
                        onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                        style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', borderRadius: '8px', padding: '0.3rem 0.55rem', fontSize: '0.74rem', fontWeight: '700' }}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Hired">Hired</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', fontSize: '0.74rem', color: '#94a3b8' }}>
                      {app.phone && <span>📞 {app.phone}</span>}
                      {app.city && <span>📍 {app.city}</span>}
                      {app.experience && <span>💼 {app.experience}</span>}
                    </div>

                    {app.resume_link && (
                      <a
                        href={app.resume_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#38bdf8', fontSize: '0.76rem', fontWeight: '700', textDecoration: 'none' }}
                      >
                        🔗 View Resume / Portfolio
                      </a>
                    )}

                    {app.cover_note && (
                      <div style={{ color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.4, backgroundColor: '#0f172a', padding: '0.55rem 0.7rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        {app.cover_note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
