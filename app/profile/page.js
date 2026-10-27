'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  // Basic Profile State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [degree, setDegree] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('50,000 - 80,000');
  const [relocateOk, setRelocateOk] = useState(true);

  // Media
  const [photoUrl, setPhotoUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Final Year Project (FYP)
  const [fypTitle, setFypTitle] = useState('');
  const [fypDetails, setFypDetails] = useState('');

  // Dynamic Lists: Experience, Certifications, Trainings
  const [experienceList, setExperienceList] = useState([]);
  const [newExp, setNewExp] = useState({ role: '', company: '', duration: '', desc: '' });
  const [expError, setExpError] = useState('');

  const [certList, setCertList] = useState([]);
  const [newCert, setNewCert] = useState({ title: '', issuer: '', year: '', link: '' });
  const [certError, setCertError] = useState('');

  const [trainingList, setTrainingList] = useState([]);
  const [newTraining, setNewTraining] = useState({ program: '', institute: '', duration: '' });
  const [trainingError, setTrainingError] = useState('');

  // Calculate Profile Completeness
  const calculateCompleteness = () => {
    let score = 0;
    if (fullName) score += 10;
    if (phone) score += 10;
    if (degree && university) score += 15;
    if (photoUrl) score += 10;
    if (resumeUrl) score += 15;
    if (skills) score += 10;
    if (fypTitle) score += 10;
    if (experienceList.length > 0) score += 10;
    if (certList.length > 0 || trainingList.length > 0) score += 10;
    return Math.min(score, 100);
  };

  // Load existing profile by email lookup
  const loadProfile = async (lookupEmail) => {
    if (!lookupEmail) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', lookupEmail.trim().toLowerCase())
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setCity(data.city || 'Lahore');
        setDegree(data.degree || '');
        setUniversity(data.university || '');
        setGraduationYear(data.graduation_year || '2026');
        setBio(data.bio || '');
        setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || ''));
        setPhotoUrl(data.photo_url || '');
        setResumeUrl(data.resume_url || '');
        setFypTitle(data.fyp_title || '');
        setFypDetails(data.fyp_details || '');
        setExpectedSalary(data.expected_salary || '50,000 - 80,000');
        setRelocateOk(data.relocate_ok !== false);
        setExperienceList(data.experience || []);
        setCertList(data.certifications || []);
        setTrainingList(data.trainings || []);
        setSavedEmail(data.email);
        setMsg('Profile loaded successfully! ✅');
      } else {
        setMsg('No previous profile found. Fill out the form to create yours!');
      }
    } catch (err) {
      setMsg('Error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  // Upload Photo to Supabase Storage
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('resumes').upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setPhotoUrl(publicUrlData.publicUrl);
      setMsg('Profile photo uploaded! 📸');
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Upload Resume PDF to Supabase Storage
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `resume_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('resumes').upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setResumeUrl(publicUrlData.publicUrl);
      setMsg('Resume PDF uploaded! 📄');
    } catch (err) {
      alert('Resume upload failed: ' + err.message);
    } finally {
      setUploadingResume(false);
    }
  };

  // Experience handlers
  const addExperience = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newExp.role.trim() || !newExp.company.trim()) {
      setExpError('Pehle Role aur Company name likhein!');
      return;
    }
    setExperienceList([...experienceList, { ...newExp }]);
    setNewExp({ role: '', company: '', duration: '', desc: '' });
    setExpError('');
  };
  const removeExperience = (index) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };

  // Certification handlers
  const addCertification = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newCert.title.trim() || !newCert.issuer.trim()) {
      setCertError('Pehle Certificate Title aur Issuer likhein!');
      return;
    }
    setCertList([...certList, { ...newCert }]);
    setNewCert({ title: '', issuer: '', year: '', link: '' });
    setCertError('');
  };
  const removeCertification = (index) => {
    setCertList(certList.filter((_, i) => i !== index));
  };

  // Training handlers
  const addTraining = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newTraining.program.trim() || !newTraining.institute.trim()) {
      setTrainingError('Pehle Training Program aur Institute likhein!');
      return;
    }
    setTrainingList([...trainingList, { ...newTraining }]);
    setNewTraining({ program: '', institute: '', duration: '' });
    setTrainingError('');
  };
  const removeTraining = (index) => {
    setTrainingList(trainingList.filter((_, i) => i !== index));
  };

  // Save Profile to Supabase
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!email || !fullName) {
      return alert('Full Name and Email are strictly required.');
    }
    setSaving(true);
    setMsg('');

    const formattedEmail = email.trim().toLowerCase();
    const profileData = {
      full_name: fullName,
      email: formattedEmail,
      phone,
      city,
      degree,
      university,
      graduation_year: graduationYear,
      bio,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      photo_url: photoUrl,
      resume_url: resumeUrl,
      fyp_title: fypTitle,
      fyp_details: fypDetails,
      expected_salary: expectedSalary,
      relocate_ok: relocateOk,
      experience: experienceList,
      certifications: certList,
      trainings: trainingList,
      updated_at: new Date().toISOString()
    };

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formattedEmail)
        .maybeSingle();

      let opError;
      if (existing) {
        const { error } = await supabase.from('profiles').update(profileData).eq('id', existing.id);
        opError = error;
      } else {
        const { error } = await supabase.from('profiles').insert([profileData]);
        opError = error;
      }

      if (opError) throw opError;
      setSavedEmail(formattedEmail);
      setMsg('Profile successfully saved! Niche se apna public link copy karein 🎉');
    } catch (err) {
      setMsg('Save error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const completeness = calculateCompleteness();

  return (
    <main style={{ minHeight: '100vh', padding: '1.25rem 1rem', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif', color: '#f8fafc' }}>
      
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
          ← Back to Homepage
        </Link>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Student Digital Career Hub</span>
      </div>

      {/* Profile Header & Completeness */}
      <section style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          
          {/* Avatar Photo */}
          <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#0a0f1d', border: '2px solid #38bdf8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2.2rem' }}>🎓</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>
                {fullName || 'Your Full Name'}
              </h1>
              <span style={{ backgroundColor: '#22c55e', color: '#090d16', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '20px', fontWeight: 'bold' }}>
                Verified Graduate
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0' }}>
              {degree || 'Degree Program'} • {university || 'University'} ({city})
            </p>

            {/* Completeness Bar */}
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#cbd5e1' }}>Profile Completeness</span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{completeness}%</span>
              </div>
              <div style={{ width: '100%', height: '7px', backgroundColor: '#0a0f1d', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${completeness}%`, height: '100%', backgroundColor: completeness > 70 ? '#22c55e' : '#38bdf8', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Existing Profile Email Search Bar */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1e293b', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="Enter your registered email to load profile..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem' }}
          />
          <button
            type="button"
            onClick={() => loadProfile(email)}
            disabled={loading}
            style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {loading ? 'Searching...' : 'Load Profile 🔍'}
          </button>
        </div>

        {/* Public Profile Share Card (When saved or loaded) */}
        {savedEmail && (
          <div style={{ marginTop: '1rem', padding: '0.85rem', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
            <span style={{ color: '#86efac', fontSize: '0.82rem', fontWeight: 'bold' }}>
              Digital Resume Ready:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href={`/profile/view?email=${encodeURIComponent(savedEmail)}`}
                target="_blank"
                style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}
              >
                View Public Profile 👁️
              </Link>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/profile/view?email=${encodeURIComponent(savedEmail)}`;
                  navigator.clipboard.writeText(url);
                  alert('Public link copy ho gaya! Ab HR ya WhatsApp par share karein.');
                }}
                style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Copy Link 🔗
              </button>
            </div>
          </div>
        )}

        {msg && <div style={{ marginTop: '0.75rem', color: '#4ade80', fontSize: '0.85rem' }}>{msg}</div>}
      </section>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* 1. Personal & Contact Details */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#38bdf8' }}>1. Basic Information & Photo</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Full Name *</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>WhatsApp / Phone Number *</label>
              <input type="text" required placeholder="03001234567" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Current City *</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Expected Salary (PKR)</label>
              <input type="text" placeholder="e.g. 60,000 - 85,000" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="relocate" checked={relocateOk} onChange={(e) => setRelocateOk(e.target.checked)} />
            <label htmlFor="relocate" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
              Open to relocate to Lahore / Karachi / Islamabad for work
            </label>
          </div>

          {/* Photo & Resume Upload Files */}
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#0a0f1d', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <label style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
                Upload Formal Photo 📸
              </label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              {uploadingPhoto && <span style={{ fontSize: '0.75rem', color: '#facc15' }}> Uploading photo...</span>}
            </div>

            <div style={{ backgroundColor: '#0a0f1d', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <label style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
                Upload PDF Resume 📄
              </label>
              <input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              {uploadingResume && <span style={{ fontSize: '0.75rem', color: '#facc15' }}> Uploading CV...</span>}
            </div>
          </div>
        </div>

          {/* 2. Education & About */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#38bdf8' }}>2. Education & Professional Bio</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Degree Program (e.g. BSCS, BBA, Civil)</label>
              <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>University / Institute</label>
              <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Graduation Year</label>
              <input type="text" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Professional Summary / Bio (2-3 lines)</label>
            <textarea
              rows="3"
              placeholder="e.g. Passionate software graduate specializing in React, Next.js and backend integrations, aiming for an entry-level engineering role..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Core Skills (Comma separated)</label>
            <input
              type="text"
              placeholder="React, Next.js, Python, Financial Modeling, AutoCAD, Git"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* 3. Final Year Project (FYP) Showcase */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#38bdf8' }}>3. Final Year Project (FYP) / Capstone</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>Pakistani recruiters prioritize final year projects for fresh graduates.</p>
          
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Project Title</label>
            <input type="text" placeholder="e.g. Shanora AI Career Intelligence Platform" value={fypTitle} onChange={(e) => setFypTitle(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Project Description & GitHub / Live Demo Link</label>
            <textarea
              rows="2"
              placeholder="Built using Next.js & Supabase. Live Demo: github.com/... or app.vercel.app"
              value={fypDetails}
              onChange={(e) => setFypDetails(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* 4. Experience & Internships (Dynamic) */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.8rem 0', color: '#38bdf8' }}>4. Experience & Internships</h2>

          {experienceList.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {experienceList.map((exp, idx) => (
                <div key={idx} style={{ backgroundColor: '#0a0f1d', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{exp.role}</strong> - <span style={{ color: '#38bdf8' }}>{exp.company}</span>
                    {exp.duration && <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{exp.duration}</div>}
                  </div>
                  <button type="button" onClick={() => removeExperience(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', padding: '0.3rem 0.6rem' }}>✕ Remove</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            <input type="text" placeholder="Role (e.g. Intern)" value={newExp.role} onChange={(e) => { setNewExp({ ...newExp, role: e.target.value }); setExpError(''); }} style={inputStyle} />
            <input type="text" placeholder="Company (e.g. Systems Ltd)" value={newExp.company} onChange={(e) => { setNewExp({ ...newExp, company: e.target.value }); setExpError(''); }} style={inputStyle} />
            <input type="text" placeholder="Duration (e.g. 3 Months)" value={newExp.duration} onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })} style={inputStyle} />
          </div>

          {expError && <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.4rem' }}>{expError}</div>}

          <button type="button" onClick={addExperience} style={{ marginTop: '0.75rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 'bold' }}>
            + Add Experience
          </button>
        </div>

        {/* 5. Certifications & Trainings (Dynamic) */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.8rem 0', color: '#38bdf8' }}>5. Certifications & Technical Trainings</h2>

          <h4 style={{ color: '#cbd5e1', margin: '0.5rem 0', fontSize: '0.85rem' }}>Certifications (Coursera, Google, PEC, etc.):</h4>
          {certList.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              {certList.map((c, idx) => (
                <div key={idx} style={{ backgroundColor: '#0a0f1d', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem' }}><strong>{c.title}</strong> ({c.issuer}) {c.year ? `- ${c.year}` : ''}</span>
                  <button type="button" onClick={() => removeCertification(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕ Remove</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            <input type="text" placeholder="Certificate Name" value={newCert.title} onChange={(e) => { setNewCert({ ...newCert, title: e.target.value }); setCertError(''); }} style={inputStyle} />
            <input type="text" placeholder="Issuer (e.g. Google)" value={newCert.issuer} onChange={(e) => { setNewCert({ ...newCert, issuer: e.target.value }); setCertError(''); }} style={inputStyle} />
            <input type="text" placeholder="Year / Credential Link" value={newCert.year} onChange={(e) => setNewCert({ ...newCert, year: e.target.value })} style={inputStyle} />
          </div>

          {certError && <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.4rem' }}>{certError}</div>}

          <button type="button" onClick={addCertification} style={{ marginTop: '0.6rem', marginBottom: '1.25rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
            + Add Certificate
          </button>

          <h4 style={{ color: '#cbd5e1', margin: '0.5rem 0', fontSize: '0.85rem' }}>Trainings & Bootcamps (NAVTTC, PITB, DigiSkills):</h4>
          {trainingList.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              {trainingList.map((t, idx) => (
                <div key={idx} style={{ backgroundColor: '#0a0f1d', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem' }}><strong>{t.program}</strong> ({t.institute}) {t.duration ? `- ${t.duration}` : ''}</span>
                  <button type="button" onClick={() => removeTraining(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕ Remove</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            <input type="text" placeholder="Training Program" value={newTraining.program} onChange={(e) => { setNewTraining({ ...newTraining, program: e.target.value }); setTrainingError(''); }} style={inputStyle} />
            <input type="text" placeholder="Institute (e.g. NAVTTC)" value={newTraining.institute} onChange={(e) => { setNewTraining({ ...newTraining, institute: e.target.value }); setTrainingError(''); }} style={inputStyle} />
            <input type="text" placeholder="Duration (e.g. 6 Months)" value={newTraining.duration} onChange={(e) => setNewTraining({ ...newTraining, duration: e.target.value })} style={inputStyle} />
          </div>

          {trainingError && <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.4rem' }}>{trainingError}</div>}

          <button type="button" onClick={addTraining} style={{ marginTop: '0.6rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
            + Add Training
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: '#22c55e', color: '#090d16', border: 'none', borderRadius: '10px', padding: '1rem', fontSize: '1rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}
        >
          {saving ? 'Saving Profile...' : 'Save & Publish Digital Profile 🚀'}
        </button>

      </form>

      <footer style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
        Shanora Pakistan • Verified Student Digital Portfolio
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
