'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  // User Session
  const [user, setUser] = useState(null);

  // Profile Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [degree, setDegree] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('50,000 - 80,000');
  const [relocateOk, setRelocateOk] = useState(true);

  // Media (Photo & Resume)
  const [photoUrl, setPhotoUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Final Year Project (FYP)
  const [fypTitle, setFypTitle] = useState('');
  const [fypDetails, setFypDetails] = useState('');

  // Experience Dynamic List
  const [experienceList, setExperienceList] = useState([]);
  const [newExp, setNewExp] = useState({ role: '', company: '', duration: '' });

  // 1. Session Check & Data Fetch
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth');
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (data) {
          setFullName(data.full_name || currentUser.user_metadata?.full_name || '');
          setPhone(data.phone || '');
          setCity(data.city || 'Lahore');
          setDegree(data.degree || '');
          setUniversity(data.university || '');
          setGraduationYear(data.graduation_year || '2026');
          setBio(data.bio || '');
          
          // Skills formatting
          if (Array.isArray(data.skills)) {
            setSkills(data.skills.join(', '));
          } else {
            setSkills(data.skills || '');
          }

          setExpectedSalary(data.expected_salary || '50,000 - 80,000');
          setRelocateOk(data.relocate_ok !== undefined ? data.relocate_ok : true);
          setPhotoUrl(data.photo_url || '');
          setResumeUrl(data.resume_url || '');
          setFypTitle(data.fyp_title || '');
          setFypDetails(data.fyp_details || '');
          setExperienceList(data.experience || []);
        } else {
          setFullName(currentUser.user_metadata?.full_name || '');
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  // Upload Handler (Photo & CV)
  async function handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'photo') setUploadingPhoto(true);
    if (type === 'resume') setUploadingResume(true);
    setMsg({ text: '', type: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Date.now()}.${fileExt}`;
      const bucketName = type === 'photo' ? 'profile-photos' : 'resumes';

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (type === 'photo') {
        setPhotoUrl(publicUrlData.publicUrl);
        setMsg({ text: 'Profile photo uploaded successfully! 📸', type: 'success' });
      } else {
        setResumeUrl(publicUrlData.publicUrl);
        setMsg({ text: 'Resume / CV uploaded successfully! 📄', type: 'success' });
      }
    } catch (err) {
      setMsg({ text: 'Upload failed: ' + (err.message || 'Make sure storage bucket exists'), type: 'error' });
    } finally {
      if (type === 'photo') setUploadingPhoto(false);
      if (type === 'resume') setUploadingResume(false);
    }
  }

  // Add Experience
  function addExperience() {
    if (!newExp.role || !newExp.company) return;
    setExperienceList([...experienceList, newExp]);
    setNewExp({ role: '', company: '', duration: '' });
  }

  // Remove Experience
  function removeExperience(index) {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  }

  // Save All Details
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    try {
      const formattedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        email: user.email.toLowerCase().trim(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        city,
        degree: degree.trim(),
        university: university.trim(),
        graduation_year: graduationYear,
        bio: bio.trim(),
        skills: formattedSkills,
        expected_salary: expectedSalary,
        relocate_ok: relocateOk,
        photo_url: photoUrl,
        resume_url: resumeUrl,
        fyp_title: fypTitle.trim(),
        fyp_details: fypDetails.trim(),
        experience: experienceList,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'email' });

      if (error) throw error;
      setMsg({ text: 'All details updated successfully! 🎉', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'Failed to update details', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading student portal details...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', paddingBottom: '4rem' }}>
      
      {/* Top Header */}
      <header style={{ 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid #1e293b', 
        padding: '0.85rem 1.5rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
        </Link>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Link 
            href={`/view-profile?email=${encodeURIComponent(user?.email || '')}`} 
            target="_blank"
            style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.82rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: 'bold' }}
          >
            Live Profile 🔗
          </Link>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Logout 🚪
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '750px', margin: '2rem auto 0', padding: '0 1rem' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '2rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.3rem 0', color: '#fff' }}>Student Profile Management 🎓</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Logged in as: <strong style={{ color: '#38bdf8' }}>{user?.email}</strong></p>
          </div>

          {msg.text && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              marginBottom: '1.5rem',
              backgroundColor: msg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${msg.type === 'error' ? '#ef4444' : '#22c55e'}`,
              color: msg.type === 'error' ? '#fca5a5' : '#86efac'
            }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            
            {/* 1. MEDIA UPLOADS (PHOTO & CV) */}
            <div style={{ backgroundColor: '#131b2e', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h3 style={{ fontSize: '1rem', color: '#38bdf8', margin: '0 0 1rem 0' }}>📸 Profile Photo & 📄 CV / Resume</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
                {/* Photo Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Profile Picture</label>
                  {photoUrl && (
                    <img src={photoUrl} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem', border: '2px solid #38bdf8' }} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'photo')} 
                    style={{ fontSize: '0.8rem', color: '#94a3b8' }} 
                  />
                  {uploadingPhoto && <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'block', marginTop: '0.2rem' }}>Uploading photo...</span>}
                </div>

                {/* Resume Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Resume / CV (PDF)</label>
                  {resumeUrl && (
                    <a href={resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#38bdf8', display: 'block', marginBottom: '0.5rem' }}>
                      View Current CV 📄
                    </a>
                  )}
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={(e) => handleFileUpload(e, 'resume')} 
                    style={{ fontSize: '0.8rem', color: '#94a3b8' }} 
                  />
                  {uploadingResume && <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'block', marginTop: '0.2rem' }}>Uploading CV...</span>}
                </div>
              </div>
            </div>

            {/* 2. BASIC INFO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>WhatsApp / Phone *</label>
                <input 
                  type="text" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* 3. EDUCATION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>University / College *</label>
                <input 
                  type="text" 
                  required 
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. UET Lahore"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Degree / Field *</label>
                <input 
                  type="text" 
                  required 
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. BS Computer Science"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* 4. CITY, YEAR, SALARY & RELOCATE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>City</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Graduation Year</label>
                <input 
                  type="text" 
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Expected Salary</label>
                <input 
                  type="text" 
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="relocate" 
                checked={relocateOk} 
                onChange={(e) => setRelocateOk(e.target.checked)} 
                style={{ width: '18px', height: '18px' }} 
              />
              <label htmlFor="relocate" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Willing to relocate for work (Other cities / Remote)</label>
            </div>

            {/* 5. SKILLS & BIO */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Core Skills (Comma separated)</label>
              <input 
                type="text" 
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Python, Communication, Graphic Design"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Professional Summary / Bio</label>
              <textarea 
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly tell employers what makes you great..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* 6. FINAL YEAR PROJECT (FYP) */}
            <div style={{ backgroundColor: '#131b2e', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h3 style={{ fontSize: '1rem', color: '#38bdf8', margin: '0 0 0.8rem 0' }}>🚀 Final Year Project (FYP)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input 
                  type="text" 
                  value={fypTitle}
                  onChange={(e) => setFypTitle(e.target.value)}
                  placeholder="FYP Title (e.g. AI-Powered Healthcare System)"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
                <textarea 
                  rows={2}
                  value={fypDetails}
                  onChange={(e) => setFypDetails(e.target.value)}
                  placeholder="Project details, tools used, and problem solved..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* 7. EXPERIENCE LIST */}
            <div style={{ backgroundColor: '#131b2e', padding: '1.2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h3 style={{ fontSize: '1rem', color: '#38bdf8', margin: '0 0 0.8rem 0' }}>💼 Internships / Experience</h3>
              
              {experienceList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {experienceList.map((exp, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem' }}><strong>{exp.role}</strong> at {exp.company} ({exp.duration})</span>
                      <button type="button" onClick={() => removeExperience(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newExp.role}
                  onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                  placeholder="Role (e.g. Intern)" 
                  style={{ padding: '0.55rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} 
                />
                <input 
                  type="text" 
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  placeholder="Company" 
                  style={{ padding: '0.55rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} 
                />
                <input 
                  type="text" 
                  value={newExp.duration}
                  onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                  placeholder="Duration (e.g. 3 mos)" 
                  style={{ padding: '0.55rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} 
                />
              </div>
              <button 
                type="button" 
                onClick={addExperience}
                style={{ marginTop: '0.6rem', backgroundColor: '#334155', color: '#fff', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
              >
                + Add Experience
              </button>
            </div>

            {/* SAVE BUTTON */}
            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                backgroundColor: '#0284c7', 
                color: '#fff', 
                padding: '0.9rem', 
                borderRadius: '8px', 
                border: 'none', 
                fontWeight: '700', 
                fontSize: '1rem', 
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes 💾'}
            </button>

          </form>

        </div>
      </main>

    </div>
  );
                    }
