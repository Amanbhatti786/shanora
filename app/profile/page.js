'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function StudentPortal() {
  const router = useRouter();

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Student State
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    city: 'Lahore',
    country: 'Pakistan',
    degree: '',
    university: '',
    graduation_year: '2026',
    bio: '',
    skills: '',
    languages: 'English, Urdu',
    expected_salary: '50,000 - 80,000',
    relocate_ok: true,
    is_searchable: true,
    job_preference: 'hybrid',
    photo_url: '',
    resume_url: '',
    fyp_title: '',
    fyp_details: '',
    experience: [],
    certificates: [],
    plan: 'free',
  });

  // Jobs, Applications & Saved Jobs Data
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [jobSearch, setJobSearch] = useState('');
  const [jobCategoryFilter, setJobCategoryFilter] = useState('All');
  const [jobTypeFilter, setJobTypeFilter] = useState('All');

  // Experience & Certificate Inputs
  const [expInput, setExpInput] = useState({ role: '', company: '', duration: '' });
  const [certInput, setCertInput] = useState({ name: '', issuer: '', year: '2026' });

  // AI Scanner & Cover Letter Generator States
  const [aiJobDescription, setAiJobDescription] = useState('');
  const [aiGeneratedLetter, setAiGeneratedLetter] = useState('');
  const [scannerResult, setScannerResult] = useState(null);

  // 1. Initial Load & Authentication Check
  useEffect(() => {
    async function initPortal() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        // Fetch Student Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (profileData) {
          setProfile({
            ...profileData,
            skills: Array.isArray(profileData.skills) ? profileData.skills.join(', ') : (profileData.skills || ''),
            languages: Array.isArray(profileData.languages) ? profileData.languages.join(', ') : (profileData.languages || 'English, Urdu'),
            experience: profileData.experience || [],
            certificates: profileData.certificates || []
          });
        } else {
          setProfile(prev => ({
            ...prev,
            full_name: session.user.user_metadata?.full_name || '',
            email: session.user.email
          }));
        }

        // Fetch Jobs
        const { data: jobsData } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        if (jobsData) setJobs(jobsData);

        // Fetch Student Applications
        const { data: appsData } = await supabase
          .from('applications')
          .select('*, jobs(*)')
          .eq('student_email', session.user.email)
          .order('applied_at', { ascending: false });
        if (appsData) setApplications(appsData);

        // Fetch Saved Jobs
        const { data: savedData } = await supabase
          .from('saved_jobs')
          .select('job_id')
          .eq('student_email', session.user.email);
        if (savedData) {
          setSavedJobIds(new Set(savedData.map(s => s.job_id)));
        }

      } catch (err) {
        console.error('Portal load error:', err);
      } finally {
        setLoading(false);
      }
    }

    initPortal();
  }, [router]);

  // Profile Completeness Score
  const calculateCompleteness = () => {
    let score = 0;
    if (profile.full_name) score += 15;
    if (profile.phone) score += 15;
    if (profile.university && profile.degree) score += 20;
    if (profile.skills) score += 15;
    if (profile.photo_url) score += 15;
    if (profile.resume_url) score += 20;
    return score;
  };

  // Upload handler for Photo or Resume
  async function handleFileUpload(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'resume' && file.type !== 'application/pdf') {
      setStatusMsg({ text: 'Please upload a PDF document for your CV.', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ text: 'File size must be under 5MB.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setStatusMsg({ text: `Uploading ${type}...`, type: 'info' });

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Date.now()}.${ext}`;
      const bucketName = type === 'photo' ? 'profile-photos' : 'resumes';

      const { error: uploadErr } = await supabase.storage.from(bucketName).upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      const updateKey = type === 'photo' ? 'photo_url' : 'resume_url';
      setProfile(prev => ({ ...prev, [updateKey]: publicUrl }));

      await supabase.from('profiles').upsert({
        email: user.email,
        [updateKey]: publicUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      setStatusMsg({ text: `${type === 'photo' ? 'Profile picture' : 'Resume'} updated successfully!`, type: 'success' });
    } catch (err) {
      setStatusMsg({ text: 'Upload failed: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  // Profile Save
  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const formattedSkills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
      const formattedLangs = profile.languages.split(',').map(l => l.trim()).filter(Boolean);

      const payload = {
        email: user.email.toLowerCase().trim(),
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        city: profile.city,
        country: profile.country,
        degree: profile.degree.trim(),
        university: profile.university.trim(),
        graduation_year: profile.graduation_year,
        bio: profile.bio.trim(),
        skills: formattedSkills,
        languages: formattedLangs,
        expected_salary: profile.expected_salary,
        relocate_ok: profile.relocate_ok,
        is_searchable: profile.is_searchable,
        job_preference: profile.job_preference,
        photo_url: profile.photo_url,
        resume_url: profile.resume_url,
        fyp_title: profile.fyp_title?.trim() || '',
        fyp_details: profile.fyp_details?.trim() || '',
        experience: profile.experience,
        certificates: profile.certificates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'email' });
      if (error) throw error;
      setStatusMsg({ text: 'Profile changes saved successfully! 🎉', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.message || 'Failed to save changes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // Apply to Job
  async function handleApplyJob(jobId) {
    if (!profile.resume_url) {
      setStatusMsg({ text: 'Please upload your CV in the "My Resume" section before applying.', type: 'error' });
      setActiveTab('resume');
      return;
    }

    const alreadyApplied = applications.some(a => a.job_id === jobId);
    if (alreadyApplied) {
      setStatusMsg({ text: 'You have already applied for this position.', type: 'info' });
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.from('applications').insert({
        job_id: jobId,
        student_email: user.email,
        resume_url: profile.resume_url,
        status: 'Applied'
      }).select('*, jobs(*)').single();

      if (error) throw error;

      setApplications([data, ...applications]);
      setStatusMsg({ text: 'Application submitted successfully! Track it in "My Applications".', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.message || 'Application failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  // Toggle Save Job
  async function handleToggleSave(jobId) {
    const isSaved = savedJobIds.has(jobId);
    try {
      if (isSaved) {
        await supabase.from('saved_jobs').delete().match({ job_id: jobId, student_email: user.email });
        const updated = new Set(savedJobIds);
        updated.delete(jobId);
        setSavedJobIds(updated);
      } else {
        await supabase.from('saved_jobs').insert({ job_id: jobId, student_email: user.email });
        setSavedJobIds(new Set([...savedJobIds, jobId]));
      }
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  }

  // Resume ATS Audit Analysis (Transparent Heuristic Engine)
  function handleRunAtsAudit() {
    if (!profile.resume_url && !profile.skills) {
      setStatusMsg({ text: 'Please complete your skills and upload your CV first.', type: 'error' });
      return;
    }

    const skillList = profile.skills.split(',').map(s => s.trim().toLowerCase());
    let detectedScore = 40;
    const suggestions = [];

    if (profile.full_name && profile.phone) detectedScore += 15;
    if (profile.degree && profile.university) detectedScore += 15;
    if (skillList.length >= 5) {
      detectedScore += 15;
    } else {
      suggestions.push('Add at least 5 technical/domain skills to improve ATS keyword detection.');
    }
    if (profile.fyp_title) {
      detectedScore += 10;
    } else {
      suggestions.push('Add your Final Year Project (FYP) to showcase real hands-on technical execution.');
    }
    if (profile.experience.length > 0) {
      detectedScore += 5;
    } else {
      suggestions.push('Include relevant coursework, internships, or volunteer work under Experience.');
    }

    setScannerResult({
      score: Math.min(detectedScore, 95),
      suggestions,
      disclaimer: 'Notice: This score is a structured estimate based on entry-level Pakistani tech job keywords. It is not an employment guarantee.'
    });
  }

  // Cover Letter Generator (Client-Side Template Engine based on real student data)
  function handleGenerateCoverLetter() {
    if (!profile.full_name || !profile.degree) {
      setStatusMsg({ text: 'Please complete your Full Name and Degree in My Profile first.', type: 'error' });
      return;
    }

    const text = `Dear Hiring Manager,

I am writing to express my strong interest in an entry-level position with your esteemed organization. As a fresh graduate in ${profile.degree || 'my field'} from ${profile.university || 'university'}, I have developed hands-on technical competencies and problem-solving skills suited for dynamic workplace environments in Pakistan.

During my academic tenure, I specialized in core areas including ${profile.skills || 'key domain methodologies'}.${profile.fyp_title ? ` For my final year project, I spearheaded "${profile.fyp_title}", which enhanced my practical execution and teamwork capabilities.` : ''}

I am confident that my diligence, adaptability, and eager readiness to learn will make me a productive addition to your team. Thank you for your consideration, and I look forward to discussing how my background aligns with your requirements.

Sincerely,
${profile.full_name}
${profile.phone} | ${user.email}
${profile.city}, Pakistan`;

    setAiGeneratedLetter(text);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading Shanora Student Portal...
      </div>
    );
  }

  const completeness = calculateCompleteness();
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
                          job.company.toLowerCase().includes(jobSearch.toLowerCase()) ||
                          job.city.toLowerCase().includes(jobSearch.toLowerCase());
    const matchesCategory = jobCategoryFilter === 'All' || job.category === jobCategoryFilter;
    const matchesType = jobTypeFilter === 'All' || job.type === jobTypeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* TOP NAVBAR */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }} className="mobile-toggle">
            ☰
          </button>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
          </Link>
          <span style={{ backgroundColor: profile.plan === 'pro' ? '#fbbf24' : '#1e293b', color: profile.plan === 'pro' ? '#000' : '#38bdf8', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
            {profile.plan === 'pro' ? 'PRO STUDENT ⚡' : 'STUDENT FREE'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Link href={`/view-profile?email=${encodeURIComponent(user?.email || '')}`} target="_blank" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: '600' }}>
            Public Portfolio 🔗
          </Link>
          <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}>
            Logout 🚪
          </button>
        </div>
      </header>

      {/* PORTAL BODY WITH SIDEBAR */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* SIDEBAR NAVIGATION */}
        <aside style={{ width: '250px', backgroundColor: '#0b1120', borderRight: '1px solid #1e293b', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'profile', label: '👤 My Profile' },
            { id: 'resume', label: '📄 My Resume / CV' },
            { id: 'jobs', label: '🔍 Find Jobs' },
            { id: 'applications', label: `💼 My Applications (${applications.length})` },
            { id: 'saved', label: `⭐ Saved Jobs (${savedJobIds.size})` },
            { id: 'ai-tools', label: '⚡ AI Career Suite' },
            { id: 'pro', label: '👑 Shanora Pro' },
            { id: 'settings', label: '⚙️ Settings & Privacy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setStatusMsg({ text: '', type: '' }); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: activeTab === tab.id ? '700' : '500',
                backgroundColor: activeTab === tab.id ? '#0284c7' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main style={{ flex: 1, padding: '1.75rem', maxWidth: '1000px', margin: '0 auto' }}>

          {/* Status Alert Banner */}
          {statusMsg.text && (
            <div style={{
              padding: '0.85rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '1.5rem',
              backgroundColor: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : statusMsg.type === 'info' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${statusMsg.type === 'error' ? '#ef4444' : statusMsg.type === 'info' ? '#38bdf8' : '#22c55e'}`,
              color: statusMsg.type === 'error' ? '#fca5a5' : statusMsg.type === 'info' ? '#7dd3fc' : '#86efac'
            }}>
              {statusMsg.text}
            </div>
          )}

          {/* 1. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.4rem' }}>Welcome back, {profile.full_name || 'Graduate'} 👋</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1rem 0' }}>Here is your active career progression overview.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                  <span>Profile Strength</span>
                  <strong style={{ color: completeness >= 80 ? '#22c55e' : '#fbbf24' }}>{completeness}%</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${completeness}%`, height: '100%', backgroundColor: completeness >= 80 ? '#22c55e' : '#0284c7' }} />
                </div>
              </div>

              {/* Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Applications Sent</span>
                  <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.8rem', color: '#38bdf8' }}>{applications.length}</h3>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Interviews Invited</span>
                  <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.8rem', color: '#22c55e' }}>
                    {applications.filter(a => a.status === 'Interview').length}
                  </h3>
                </div>
  {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <button onClick={() => setActiveTab('jobs')} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.75rem 1.4rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Browse Entry-Level Jobs 🔍
                </button>
                <button onClick={() => setActiveTab('resume')} style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '0.75rem 1.4rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Update Resume (PDF) 📄
                </button>
                <button onClick={() => setActiveTab('ai-tools')} style={{ backgroundColor: '#1e293b', color: '#fbbf24', border: '1px solid #334155', padding: '0.75rem 1.4rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Run Resume ATS Audit ⚡
                </button>
              </div>
            </div>
          )}

          {/* 2. MY PROFILE TAB */}
          {activeTab === 'profile' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.75rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 1.2rem 0', fontSize: '1.3rem' }}>Personal & Academic Profile</h2>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Full Name *</label>
                    <input type="text" required value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>WhatsApp / Phone *</label>
                    <input type="text" required value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="03001234567" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>University / College *</label>
                    <input type="text" required value={profile.university} onChange={e => setProfile({ ...profile, university: e.target.value })} placeholder="e.g. FAST / NUST / UET" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Degree Program *</label>
                    <input type="text" required value={profile.degree} onChange={e => setProfile({ ...profile, degree: e.target.value })} placeholder="e.g. BS Computer Science" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>City</label>
                    <input type="text" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Graduation Year</label>
                    <input type="text" value={profile.graduation_year} onChange={e => setProfile({ ...profile, graduation_year: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Workplace Preference</label>
                    <select value={profile.job_preference} onChange={e => setProfile({ ...profile, job_preference: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}>
                      <option value="remote">Remote Only</option>
                      <option value="onsite">Onsite Only</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Core Skills (Comma separated)</label>
                  <input type="text" value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })} placeholder="React, Python, Communication, Excel" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Professional Bio</label>
                  <textarea rows={3} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Short introduction for potential employers..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>

                {/* Final Year Project */}
                <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', color: '#38bdf8', fontSize: '0.92rem' }}>Final Year Project (FYP)</h4>
                  <input type="text" value={profile.fyp_title} onChange={e => setProfile({ ...profile, fyp_title: e.target.value })} placeholder="Project Title" style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', marginBottom: '0.6rem', boxSizing: 'border-box' }} />
                  <textarea rows={2} value={profile.fyp_details} onChange={e => setProfile({ ...profile, fyp_details: e.target.value })} placeholder="Tools used, problem solved and outcome..." style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>

                {/* Privacy & Relocation Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.8rem', backgroundColor: '#131b2e', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={profile.is_searchable} onChange={e => setProfile({ ...profile, is_searchable: e.target.checked })} />
                    <span>Make my portfolio searchable to verified Pakistani employers</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={profile.relocate_ok} onChange={e => setProfile({ ...profile, relocate_ok: e.target.checked })} />
                    <span>Open to relocate or work remote</span>
                  </label>
                </div>

                <button type="submit" disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.85rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving changes...' : 'Save Profile Details 💾'}
                </button>
              </form>
            </div>
          )}

          {/* 3. MY RESUME TAB */}
          {activeTab === 'resume' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.75rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>Resume & CV Management</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Upload your latest PDF CV. This document is attached when you submit job applications.</p>

              <div style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #334155', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                {profile.resume_url ? (
                  <div>
                    <span style={{ color: '#22c55e', fontWeight: 'bold', display: 'block', marginBottom: '0.8rem' }}>✓ Active CV on file</span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
                      <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        Preview / Download CV
                      </a>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '1rem' }}>No PDF resume uploaded yet.</span>
                )}

                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'inline-block', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                    {actionLoading ? 'Uploading...' : 'Upload / Replace PDF Resume'}
                    <input type="file" accept=".pdf" onChange={e => handleFileUpload(e, 'resume')} style={{ display: 'none' }} />
                  </label>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>Only PDF format, max 5MB</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. FIND JOBS TAB */}
          {activeTab === 'jobs' && (
            <div>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Search by title, company, or city..."
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  style={{ flex: 2, minWidth: '220px', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}
                />
                <select value={jobTypeFilter} onChange={e => setJobTypeFilter(e.target.value)} style={{ flex: 1, minWidth: '130px', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}>
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Trainee">Trainee</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredJobs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No job openings matching your search criteria.</div>
                ) : (
                  filteredJobs.map(job => {
                    const isApplied = applications.some(a => a.job_id === job.id);
                    const isSaved = savedJobIds.has(job.id);
                    return (
                      <div key={job.id} style={{ backgroundColor: '#0f172a', padding: '1.4rem', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>{job.title}</h3>
                            {job.is_verified && <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Verified</span>}
                          </div>
                          <span style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.9rem' }}>{job.company}</span>
                          <span style={{ color: '#64748b', fontSize: '0.85rem' }}> • {job.city} ({job.workplace})</span>
                          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.6rem 0' }}>{job.description}</p>
                          <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 'bold' }}>{job.salary || 'Market Competitive'}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                          <button onClick={() => handleToggleSave(job.id)} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: isSaved ? '#fbbf24' : '#cbd5e1', padding: '0.55rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            {isSaved ? '★ Saved' : '☆ Save'}
                          </button>
                          <button
                            onClick={() => handleApplyJob(job.id)}
                            disabled={isApplied || actionLoading}
                            style={{
                              backgroundColor: isApplied ? '#1e293b' : '#0284c7',
                              color: isApplied ? '#94a3b8' : '#fff',
                              border: 'none',
                              padding: '0.55rem 1.1rem',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              cursor: isApplied ? 'not-allowed' : 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            {isApplied ? 'Applied ✓' : 'Apply Now ⚡'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 5. MY APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.75rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>Application Status Tracker</h2>

              {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  <p>You have not submitted any applications yet.</p>
                  <button onClick={() => setActiveTab('jobs')} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    Browse Jobs
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {applications.map(app => (
                    <div key={app.id} style={{ backgroundColor: '#131b2e', padding: '1.2rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.2rem 0', color: '#fff', fontSize: '1rem' }}>{app.jobs?.title || 'Position Applied'}</h4>
                        <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{app.jobs?.company || 'Company'}</span>
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}> • Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span style={{
                          padding: '0.35rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          backgroundColor: app.status === 'Interview' ? 'rgba(34, 197, 94, 0.2)' : app.status === 'Shortlisted' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                          color: app.status === 'Interview' ? '#22c55e' : app.status === 'Shortlisted' ? '#38bdf8' : '#fbbf24',
                          border: `1px solid ${app.status === 'Interview' ? '#22c55e' : app.status === 'Shortlisted' ? '#38bdf8' : '#fbbf24'}`
                        }}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. SAVED JOBS TAB */}
          {activeTab === 'saved' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.75rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>Saved Jobs</h2>
              {jobs.filter(j => savedJobIds.has(j.id)).length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No saved jobs currently.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {jobs.filter(j => savedJobIds.has(j.id)).map(job => (
                    <div key={job.id} style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#fff' }}>{job.title}</h4>
                        <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{job.company} • {job.city}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleToggleSave(job.id)} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ef4444', padding: '0.4rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Remove
                        </button>
                        <button onClick={() => handleApplyJob(job.id)} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. AI CAREER SUITE */}
          {activeTab === 'ai-tools' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* ATS Audit */}
              <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8' }}>⚡ Resume ATS Keyword & Structure Audit</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Audit your profile against Pakistani entry-level technical standards.</p>

                <button onClick={handleRunAtsAudit} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.65rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
                  Run Instant ATS Audit
                </button>

                {scannerResult && (
                  <div style={{ marginTop: '1.2rem', padding: '1.2rem', backgroundColor: '#131b2e', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#22c55e' }}>{scannerResult.score}/100</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Estimated Profile ATS Readiness</span>
                    </div>
                    {scannerResult.suggestions.length > 0 && (
                      <ul style={{ color: '#fbbf24', fontSize: '0.85rem', paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                        {scannerResult.suggestions.map((s, idx) => <li key={idx} style={{ marginBottom: '0.3rem' }}>{s}</li>)}
                      </ul>
                    )}
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '0.8rem' }}>{scannerResult.disclaimer}</span>
                  </div>
                )}
              </div>

              {/* Cover Letter Assistant */}
              <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8' }}>✍️ Job Cover Letter Generator</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Generate an honest cover letter draft based directly on your verified profile credentials.</p>

                <button onClick={handleGenerateCoverLetter} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
                  Generate Structured Draft
                </button>

                {aiGeneratedLetter && (
                  <div style={{ marginTop: '1.2rem' }}>
                    <textarea rows={10} value={aiGeneratedLetter} onChange={e => setAiGeneratedLetter(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', backgroundColor: '#131b2e', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                    <button onClick={() => { navigator.clipboard.writeText(aiGeneratedLetter); setStatusMsg({ text: 'Cover letter copied to clipboard!', type: 'success' }); }} style={{ marginTop: '0.5rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. PRO PLAN PREVIEW TAB */}
          {activeTab === 'pro' && (
            <div style={{ backgroundColor: '#0f172a', padding: '2rem', borderRadius: '14px', border: '1px solid #fbbf24', textAlign: 'center' }}>
              <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                COMING SOON
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '1rem 0 0.5rem' }}>Shanora Pro for Students</h2>
              <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                All core job applications and searches remain completely free forever. Pro unlocks advanced LLM mock interview simulators and multi-template CV exports.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'left', maxWidth: '600px', margin: '0 auto 2rem' }}>
                <div style={{ padding: '0.8rem', backgroundColor: '#131b2e', borderRadius: '8px' }}>✓ Unlimited AI Cover Letters</div>
                <div style={{ padding: '0.8rem', backgroundColor: '#131b2e', borderRadius: '8px' }}>✓ 1-on-1 Mock Interview AI</div>
                <div style={{ padding: '0.8rem', backgroundColor: '#131b2e', borderRadius: '8px' }}>✓ Priority Recruiter Highlighting</div>
                <div style={{ padding: '0.8rem', backgroundColor: '#131b2e', borderRadius: '8px' }}>✓ 3+ Professional PDF Formats</div>
              </div>
              <button disabled style={{ backgroundColor: '#334155', color: '#94a3b8', padding: '0.8rem 1.8rem', borderRadius: '8px', border: 'none', cursor: 'not-allowed', fontWeight: 'bold' }}>
                Billing Integration In Progress
              </button>
            </div>
          )}

          {/* 9. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.75rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>Account & Privacy Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>Registered Email</span>
                  <span>{user.email}</span>
                </div>
                <div>
                  <span style={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>Password Reset</span>
                  <p style={{ margin: '0.2rem 0 0.6rem 0', fontSize: '0.82rem' }}>You can request a password reset email via Supabase Auth.</p>
                  <button onClick={async () => {
                    await supabase.auth.resetPasswordForEmail(user.email);
                    setStatusMsg({ text: 'Password reset link sent to your email!', type: 'success' });
                  }} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>
                    Send Reset Link
                  </button>
                </div>
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'block' }}>Danger Zone</span>
                  <p style={{ fontSize: '0.82rem', margin: '0.2rem 0 0.6rem' }}>Logging out will end your current session on this device.</p>
                  <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>
                    Sign Out Now
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
                                                              }
