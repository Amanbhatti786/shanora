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
  const [jobTypeFilter, setJobTypeFilter] = useState('All');

  // AI & Scanner State
  const [aiGeneratedLetter, setAiGeneratedLetter] = useState('');
  const [scannerResult, setScannerResult] = useState(null);

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

        // Fetch Applications
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

  // Profile Completeness
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

      setStatusMsg({ text: `${type === 'photo' ? 'Profile picture' : 'Resume'} updated!`, type: 'success' });
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
        fyp_title: profile.fyp_title || '',
        fyp_details: profile.fyp_details || '',
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
      setStatusMsg({ text: 'Please upload your CV in "My Resume" tab before applying.', type: 'error' });
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
      setStatusMsg({ text: 'Application submitted! Track it under "My Applications".', type: 'success' });
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

  // ATS Keyword Audit
  function handleRunAtsAudit() {
    const skillList = profile.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
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
      suggestions.push('Add your Final Year Project (FYP) to demonstrate practical skills.');
    }

    setScannerResult({
      score: Math.min(detectedScore, 95),
      suggestions,
      disclaimer: 'Notice: This score is a structured estimate based on Pakistani graduate hiring standards. It is not an employment guarantee.'
    });
  }

  // Cover Letter Generator
  function handleGenerateCoverLetter() {
    if (!profile.full_name || !profile.degree) {
      setStatusMsg({ text: 'Please fill Full Name and Degree in My Profile first.', type: 'error' });
      return;
    }

    const text = `Dear Hiring Manager,

I am writing to express my strong interest in an entry-level position with your organization. As a fresh graduate in ${profile.degree} from ${profile.university}, I have developed practical competencies suited for dynamic workplace environments.

During my studies, I focused on core domains including ${profile.skills || 'key skills'}.${profile.fyp_title ? ` For my final year project, I worked on "${profile.fyp_title}".` : ''}

I look forward to discussing how my motivation and technical baseline can contribute to your team.

Sincerely,
${profile.full_name}
${profile.phone} | ${user?.email}
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
        Loading Student Portal...
      </div>
    );
  }

  const completeness = calculateCompleteness();
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
                          job.company?.toLowerCase().includes(jobSearch.toLowerCase()) ||
                          job.city?.toLowerCase().includes(jobSearch.toLowerCase());
    const matchesType = jobTypeFilter === 'All' || job.type === jobTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* TOP NAVBAR */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
          </Link>
          <span style={{ backgroundColor: '#059669', color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
            PORTAL 2.0
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Link href={`/view-profile?email=${encodeURIComponent(user?.email || '')}`} target="_blank" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: '600' }}>
            Public Link 🔗
          </Link>
          <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}>
            Logout 🚪
          </button>
        </div>
      </header>

      {/* PORTAL BODY */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'row' }}>

        {/* SIDEBAR NAVIGATION */}
        <aside style={{ width: '240px', backgroundColor: '#0b1120', borderRight: '1px solid #1e293b', padding: '1.2rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'profile', label: '👤 My Profile' },
            { id: 'resume', label: '📄 My Resume / CV' },
            { id: 'jobs', label: '🔍 Find Jobs' },
            { id: 'applications', label: `💼 My Applications (${applications.length})` },
            { id: 'saved', label: `⭐ Saved Jobs (${savedJobIds.size})` },
            { id: 'ai-tools', label: '⚡ AI Career Suite' },
            { id: 'settings', label: '⚙️ Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setStatusMsg({ text: '', type: '' }); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: activeTab === tab.id ? '700' : '500',
                backgroundColor: activeTab === tab.id ? '#0284c7' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.88rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        {/* WORKSPACE */}
        <main style={{ flex: 1, padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>

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

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.35rem' }}>Welcome, {profile.full_name || 'Graduate'} 👋</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>Manage applications, your CV, and live job opportunities.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                  <span>Profile Strength</span>
                  <strong style={{ color: completeness >= 80 ? '#22c55e' : '#fbbf24' }}>{completeness}%</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${completeness}%`, height: '100%', backgroundColor: completeness >= 80 ? '#22c55e' : '#0284c7' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Applications Sent</span>
                  <h3 style={{ margin: '0.3rem 0 0', fontSize: '1.8rem', color: '#38bdf8' }}>{applications.length}</h3>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Saved Jobs</span>
                  <h3 style={{ margin: '0.3rem 0 0', fontSize: '1.8rem', color: '#fbbf24' }}>{savedJobIds.size}</h3>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Live Openings</span>
                  <h3 style={{ margin: '0.3rem 0 0', fontSize: '1.8rem', color: '#22c55e' }}>{jobs.length}</h3>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setActiveTab('jobs')} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.7rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Browse Jobs 🔍
                </button>
                <button type="button" onClick={() => setActiveTab('resume')} style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '0.7rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Upload Resume 📄
                </button>
              </div>
            </div>

          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Personal & Education Details</h2>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Full Name *</label>
                    <input type="text" required value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>WhatsApp / Phone *</label>
                    <input type="text" required value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="03001234567" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>University *</label>
                    <input type="text" required value={profile.university} onChange={e => setProfile({ ...profile, university: e.target.value })} placeholder="e.g. UET Lahore" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Degree *</label>
                    <input type="text" required value={profile.degree} onChange={e => setProfile({ ...profile, degree: e.target.value })} placeholder="e.g. BS Computer Science" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>City</label>
                    <input type="text" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Graduation Year</label>
                    <input type="text" value={profile.graduation_year} onChange={e => setProfile({ ...profile, graduation_year: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Skills (Comma separated)</label>
                  <input type="text" value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })} placeholder="React, Python, Communication" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Professional Summary</label>
                  <textarea rows={3} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell employers about your goals..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>

                {/* Final Year Project */}
                <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', color: '#38bdf8', fontSize: '0.9rem' }}>Final Year Project (FYP)</h4>
                  <input type="text" value={profile.fyp_title} onChange={e => setProfile({ ...profile, fyp_title: e.target.value })} placeholder="FYP Title" style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
                  <textarea rows={2} value={profile.fyp_details} onChange={e => setProfile({ ...profile, fyp_details: e.target.value })} placeholder="Tools used and problem solved..." style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>

                <button type="submit" disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.8rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Profile Changes 💾'}
                </button>
              </form>
            </div>
          )}
{/* TAB 3: RESUME */}
          {activeTab === 'resume' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Resume / CV Document</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Attach your PDF CV for 1-click job applications.</p>

              <div style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                {profile.resume_url ? (
                  <div>
                    <span style={{ color: '#22c55e', fontWeight: 'bold', display: 'block', marginBottom: '0.8rem' }}>✓ Active PDF Resume</span>
                    <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      View / Download PDF
                    </a>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.88rem', display: 'block', marginBottom: '1rem' }}>No PDF resume uploaded yet.</span>
                )}

                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'inline-block', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                    {actionLoading ? 'Uploading...' : 'Upload / Replace PDF CV'}
                    <input type="file" accept=".pdf" onChange={e => handleFileUpload(e, 'resume')} style={{ display: 'none' }} />
                  </label>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>PDF format only, maximum 5MB</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FIND JOBS */}
          {activeTab === 'jobs' && (
            <div>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or city..."
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  style={{ flex: 2, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}
                />
                <select value={jobTypeFilter} onChange={e => setJobTypeFilter(e.target.value)} style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}>
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Trainee">Trainee</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredJobs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No jobs found matching criteria.</div>
                ) : (
                  filteredJobs.map(job => {
                    const isApplied = applications.some(a => a.job_id === job.id);
                    const isSaved = savedJobIds.has(job.id);
                    return (
                      <div key={job.id} style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{job.title}</h3>
                            {job.is_verified && <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Verified</span>}
                          </div>
                          <span style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.88rem' }}>{job.company}</span>
                          <span style={{ color: '#64748b', fontSize: '0.82rem' }}> • {job.city || 'Pakistan'} ({job.workplace || 'Onsite'})</span>
                          <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.5rem 0' }}>{job.description}</p>
                          <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 'bold' }}>{job.salary || 'Competitive'}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button type="button" onClick={() => handleToggleSave(job.id)} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: isSaved ? '#fbbf24' : '#cbd5e1', padding: '0.5rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
                            {isSaved ? '★ Saved' : '☆ Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyJob(job.id)}
                            disabled={isApplied || actionLoading}
                            style={{
                              backgroundColor: isApplied ? '#1e293b' : '#0284c7',
                              color: isApplied ? '#94a3b8' : '#fff',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              cursor: isApplied ? 'not-allowed' : 'pointer',
                              fontSize: '0.82rem'
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

{/* TAB 5: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>My Job Applications</h2>
              {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No applications submitted yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {applications.map(app => (
                    <div key={app.id} style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.2rem 0', color: '#fff' }}>{app.jobs?.title || 'Job Opening'}</h4>
                        <span style={{ color: '#38bdf8', fontSize: '0.82rem' }}>{app.jobs?.company || 'Company'}</span>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}> • Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                      <span style={{ padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SAVED JOBS */}
          {activeTab === 'saved' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Saved Jobs</h2>
              {jobs.filter(j => savedJobIds.has(j.id)).length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No saved jobs.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {jobs.filter(j => savedJobIds.has(j.id)).map(job => (
                    <div key={job.id} style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#fff' }}>{job.title}</h4>
                        <span style={{ color: '#38bdf8', fontSize: '0.82rem' }}>{job.company} • {job.city || 'Pakistan'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => handleToggleSave(job.id)} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ef4444', padding: '0.4rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>
                          Remove
                        </button>
                        <button type="button" onClick={() => handleApplyJob(job.id)} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}>
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

{/* TAB 7: AI SUITE */}
          {activeTab === 'ai-tools' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 0.4rem 0', color: '#38bdf8' }}>⚡ Resume ATS Keyword & Structure Audit</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Check your profile against Pakistani graduate hiring criteria.</p>

                <button type="button" onClick={handleRunAtsAudit} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
                  Run Instant ATS Audit
                </button>

                {scannerResult && (
                  <div style={{ marginTop: '1.2rem', padding: '1rem', backgroundColor: '#131b2e', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#22c55e' }}>{scannerResult.score}/100</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Profile ATS Readiness</span>
                    </div>
                    {scannerResult.suggestions.length > 0 && (
                      <ul style={{ color: '#fbbf24', fontSize: '0.82rem', margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
                        {scannerResult.suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                      </ul>
                    )}
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: '0.5rem' }}>{scannerResult.disclaimer}</span>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 0.4rem 0', color: '#38bdf8' }}>✍️ Cover Letter Generator</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Generate an honest cover letter draft based on your saved profile credentials.</p>

                <button type="button" onClick={handleGenerateCoverLetter} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
                  Generate Structured Draft
                </button>

                {aiGeneratedLetter && (
                  <div style={{ marginTop: '1rem' }}>
                    <textarea rows={8} value={aiGeneratedLetter} onChange={e => setAiGeneratedLetter(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#131b2e', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.82rem' }} />
                    <button type="button" onClick={() => { navigator.clipboard.writeText(aiGeneratedLetter); setStatusMsg({ text: 'Cover letter copied!', type: 'success' }); }} style={{ marginTop: '0.4rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Settings & Privacy</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>Account Email</span>
                  <span>{user?.email}</span>
                </div>
                <div>
                  <span style={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>Password Reset</span>
                  <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.8rem' }}>Request a password change link sent to your registered email.</p>
                  <button type="button" onClick={async () => {
                    await supabase.auth.resetPasswordForEmail(user.email);
                    setStatusMsg({ text: 'Password reset link sent to your email!', type: 'success' });
                  }} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Send Reset Link
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
