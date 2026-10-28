'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  // Media
  const [photoUrl, setPhotoUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // FYP
  const [fypTitle, setFypTitle] = useState('');
  const [fypDetails, setFypDetails] = useState('');

  // Dynamic Lists
  const [experienceList, setExperienceList] = useState([]);
  const [newExp, setNewExp] = useState({ role: '', company: '', duration: '', desc: '' });
  const [expError, setExpError] = useState('');

  const [certList, setCertList] = useState([]);
  const [newCert, setNewCert] = useState({ title: '', issuer: '', year: '', link: '' });
  const [certError, setCertError] = useState('');

  const [trainingList, setTrainingList] = useState([]);
  const [newTraining, setNewTraining] = useState({ program: '', institute: '', duration: '' });
  const [trainingError, setTrainingError] = useState('');

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

  // 🔐 Secure Login / Load Profile
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return alert('Email aur Password dono darj karein!');
    }
    setLoading(true);
    setMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data) {
        // User exists -> check password
        if (data.password && data.password !== password) {
          alert('Ghalat Password! Baraye meharbani sahi password likhein.');
          setLoading(false);
          return;
        }
        // Load data
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
        setIsUnlocked(true);
        setMsg('Profile Unlocked! Aap details update kar sakte hain.');
      } else {
        // Naya candidate hai -> allow creation with this password
        setIsUnlocked(true);
        setSavedEmail(cleanEmail);
        setMsg('Naya Account Detected! Profile fill karke save karein, yeh password apka secure login ban jayega.');
      }
    } catch (err) {
      alert('Verification error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload handlers
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('resumes').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setPhotoUrl(data.publicUrl);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cv_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('resumes').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setResumeUrl(data.publicUrl);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingResume(false);
    }
  };

  // Dynamic handlers
  const addExperience = (e) => {
    e.preventDefault();
    if (!newExp.role || !newExp.company) return setExpError('Role aur Company name likhein!');
    setExperienceList([...experienceList, { ...newExp }]);
    setNewExp({ role: '', company: '', duration: '', desc: '' });
    setExpError('');
  };

  const addCertification = (e) => {
    e.preventDefault();
    if (!newCert.title || !newCert.issuer) return setCertError('Title aur Issuer likhein!');
    setCertList([...certList, { ...newCert }]);
    setNewCert({ title: '', issuer: '', year: '', link: '' });
    setCertError('');
  };

  const addTraining = (e) => {
    e.preventDefault();
    if (!newTraining.program || !newTraining.institute) return setTrainingError('Program aur Institute likhein!');
    setTrainingList([...trainingList, { ...newTraining }]);
    setNewTraining({ program: '', institute: '', duration: '' });
    setTrainingError('');
  };

  // 💾 Save / Update Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isUnlocked) return alert('Pehle email aur password daal kar login karein!');
    if (!fullName) return alert('Full Name zaroori hai.');

    setSaving(true);
    setMsg('');

    const profileData = {
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName,
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
      const cleanEmail = email.trim().toLowerCase();
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', cleanEmail).maybeSingle();

      let opError;
      if (existing) {
        const { error } = await supabase.from('profiles').update(profileData).eq('id', existing.id);
        opError = error;
      } else {
        const { error } = await supabase.from('profiles').insert([profileData]);
        opError = error;
      }

      if (opError) throw opError;
      setSavedEmail(cleanEmail);
      setMsg('Profile successfully saved & secured! 🎉');
    } catch (err) {
      setMsg('Save error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const completeness = calculateCompleteness();

  return (
    <main style={{ minHeight: '100vh', padding: '1.25rem 1rem', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif', color: '#f8fafc' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
          ← Back to Shanora Home
        </Link>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Secure Student Digital Resume</span>
      </div>

      {/* 🔐 STEP 1: LOGIN / UNLOCK BOX */}
      {!isUnlocked ? (
        <section style={{ backgroundColor: '#131b2e', padding: '2rem 1.5rem', borderRadius: '16px', border: '1px solid #1e293b', textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#fff' }}>
            Student Security Portal
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Apna Email aur Secret Password darj karein. Agar pehli baar hain, toh naya password set karein.
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <input
              type="email"
              required
              placeholder="Your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              required
              placeholder="Your Secret Password (e.g. Pass@123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              {loading ? 'Checking Security...' : 'Unlock & Edit Profile 🔓'}
            </button>
          </form>
        </section>
      ) : (
        <>
          {/* ✅ UNLOCKED: PROFILE BUILDER */}
          <section style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              
              <div style={{ width: '85px', height: '85px', borderRadius: '50%', backgroundColor: '#0a0f1d', border: '2px solid #38bdf8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {photoUrl ? <img src={photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2.2rem' }}>🎓</span>}
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>
                    {fullName || 'Your Name'}
                  </h1>
                  <span style={{ backgroundColor: '#22c55e', color: '#090d16', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '20px', fontWeight: 'bold' }}>
                    Secured Account 🔒
                  </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.2rem 0' }}>
                  Logged in as: <strong style={{ color: '#38bdf8' }}>{email}</strong>
                </p>

                {/* Completeness */}
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Completeness</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{completeness}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#0a0f1d', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${completeness}%`, height: '100%', backgroundColor: completeness > 70 ? '#22c55e' : '#38bdf8' }} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUnlocked(false)}
                style={{ backgroundColor: '#1e293b', color: '#f87171', border: '1px solid #334155', padding: '0.45rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Lock / Logout 🔒
              </button>
            </div>

            {/* Share Card */}
            {savedEmail && (
              <div style={{ marginTop: '1rem', padding: '0.85rem', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <span style={{ color: '#86efac', fontSize: '0.82rem', fontWeight: 'bold' }}>
                  Digital Resume Ready:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    href={`/view-profile?email=${encodeURIComponent(savedEmail)}`}
                    target="_blank"
                    style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    View Public Profile 👁️
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/view-profile?email=${encodeURIComponent(savedEmail)}`;
                      navigator.clipboard.writeText(url);
                      alert('Public link copy ho gaya!');
                    }}
                    style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Copy Link 🔗
                  </button>
                </div>
              </div>
            )}

            {msg && <div style={{ marginTop: '0.75rem', color: '#4ade80', fontSize: '0.82rem' }}>{msg}</div>}
          </section>

          {/* Form */}
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Basic Info */}
            <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#38bdf8' }}>1. Basic Info & Attachments</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Full Name *</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>WhatsApp Number *</label>
                  <input type="text" required placeholder="03001234567" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Current City *</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Expected Salary (PKR)</label>
                  <input type="text" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#0a0f1d', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <label style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold' }}>Upload Formal Photo 📸</label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '0.8rem', marginTop: '0.3rem' }} />
                  {uploadingPhoto && <div style={{ fontSize: '0.75rem', color: '#facc15' }}>Uploading photo...</div>}
                </div>
                <div style={{ backgroundColor: '#0a0f1d', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <label style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold' }}>Upload PDF CV 📄</label>
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ fontSize: '0.8rem', marginTop: '0.3rem' }} />
                  {uploadingResume && <div style={{ fontSize: '0.75rem', color: '#facc15' }}>Uploading CV...</div>}
                </div>
              </div>
            </div>

            {/* 2. Education */}
            <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#38bdf8' }}>2. Education & Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Degree (e.g. BSCS)</label>
                  <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>University</label>
                  <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Bio / Summary</label>
                <textarea rows="3" value={bio} onChange={(e) => setBio(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Skills (Comma separated)</label>
                <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* 3. FYP */}
            <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.85rem 0', color: '#38bdf8' }}>3. Final Year Project (FYP)</h2>
              <input type="text" placeholder="Project Title" value={fypTitle} onChange={(e) => setFypTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '0.6rem' }} />
              <textarea rows="2" placeholder="Project Details & Link" value={fypDetails} onChange={(e) => setFypDetails(e.target.value)} style={inputStyle} />
            </div>

            {/* 4. Experience */}
            <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.85rem 0', color: '#38bdf8' }}>4. Experience & Internships</h2>
              {experienceList.map((exp, idx) => (
                <div key={idx} style={{ backgroundColor: '#0a0f1d', padding: '0.65rem', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>{exp.role}</strong> at {exp.company}</span>
                  <button type="button" onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <input type="text" placeholder="Role" value={newExp.role} onChange={(e) => setNewExp({ ...newExp, role: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Company" value={newExp.company} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} style={inputStyle} />
              </div>
              {expError && <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{expError}</div>}
              <button type="button" onClick={addExperience} style={{ marginTop: '0.6rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer' }}>+ Add Exp</button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: '#22c55e', color: '#090d16', border: 'none', borderRadius: '10px', padding: '1rem', fontSize: '1rem', fontWeight: '900', cursor: 'pointer' }}
            >
              {saving ? 'Securing & Saving...' : 'Save & Lock Digital Profile 🚀'}
            </button>

          </form>
        </>
      )}

      <footer style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
        Shanora Pakistan • Secure Student Career Ecosystem
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
  boxSizing: 'border-box'
};
