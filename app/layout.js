'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Resume upload states
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [degree, setDegree] = useState('');
  const [university, setUniversity] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Pro modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [router]);

  async function loadUserData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
      return;
    }
    setUser(session.user);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setProfile(data);
      if (data.resume_url) setResumeUrl(data.resume_url);
      setFullName(data.full_name || '');
      setDegree(data.degree || '');
      setUniversity(data.university || '');
      setCity(data.city || '');
      setPhone(data.phone || '');
      setTargetRole(data.target_role || '');
    }
    setLoading(false);
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim(),
        degree: degree.trim(),
        university: university.trim(),
        city: city.trim(),
        phone: phone.trim(),
        target_role: targetRole.trim(),
      });

      if (error) throw error;
      setIsEditing(false);
      loadUserData();
    } catch (err) {
      alert('Profile update error. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        alert('Baraye mehrbani sirf PDF format mein CV upload karein.');
        return;
      }

      setUploading(true);
      setUploadMsg('');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ resume_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setResumeUrl(publicUrl);
      setUploadMsg('🎉 CV kamyabi se save ho gaya!');
    } catch (err) {
      console.error(err);
      alert('Upload fail ho gaya. Storage check karein.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <main style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading student portal...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '90vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        {/* Top Header Card */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>Candidate Account</span>
                {profile?.is_premium ? (
                  <span style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    👑 PRO
                  </span>
                ) : (
                  <span style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                    Free Tier
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                {profile?.full_name || 'Set Your Full Name'}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                {user?.email} • {profile?.city || 'Pakistan'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.45rem 0.8rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
              >
                {isEditing ? 'Close Edit ✕' : 'Edit Profile ✏️'}
              </button>
              {!profile?.is_premium && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  style={{ backgroundColor: '#eab308', color: '#090d16', border: 'none', borderRadius: '6px', padding: '0.45rem 0.8rem', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  Go Pro ⚡
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{ backgroundColor: '#1e293b', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '0.45rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <form onSubmit={handleUpdateProfile} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #1e293b', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>WhatsApp</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xxxxxxxxx" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Degree (e.g. BSCS, BBA)</label>
                <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>University</label>
                <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Target Specialty</label>
                <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Frontend, Banking" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" disabled={saving} style={{ backgroundColor: '#22c55e', color: '#090d16', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', width: '100%' }}>
                  {saving ? 'Saving...' : 'Save Profile Changes 💾'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Upgrade Pro Modal */}
        {showUpgradeModal && (
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #eab308', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h3 style={{ color: '#facc15', margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>👑 Shanora Pro Membership</h3>
              <button onClick={() => setShowUpgradeModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.4', margin: '0 0 0.8rem 0' }}>
              Unlock AI Resume Re-write, tailored Cover Letters & Top Recruiter Listing for Pakistani graduates.
            </p>
            <div style={{ backgroundColor: '#131b2e', padding: '0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lifetime Access</span>
                <div style={{ color: '#4ade80', fontSize: '1.2rem', fontWeight: '900' }}>PKR 999</div>
              </div>
              <a
                href="https://wa.me/923000000000?text=Hi%20Shanora%20Team%2C%20I%20want%20to%20upgrade%20to%20Shanora%20Pro"
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '800', fontSize: '0.8rem' }}
              >
                Pay via Easypaisa / JazzCash 📲
              </a>
            </div>
          </div>
        )}

        {/* CV Upload Section */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>📄 Official Resume / CV</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>Save PDF CV to your cloud account.</p>
            </div>
            {resumeUrl && (
              <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', border: '1px solid #22c55e' }}>
                ✓ Uploaded
              </span>
            )}
          </div>

          {uploadMsg && (
            <div style={{ padding: '0.6rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '6px', marginBottom: '0.8rem', fontSize: '0.8rem' }}>
              {uploadMsg}
            </div>
          )}

          <div style={{ backgroundColor: '#0a0f1d', padding: '1.2rem', borderRadius: '10px', border: '1px dashed #334155', textAlign: 'center' }}>
            {resumeUrl ? (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.55rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700' }}
                >
                  View My CV ↗
                </a>
                <label style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '0.55rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                  {uploading ? 'Uploading...' : 'Replace PDF'}
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <div>
                <label style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.6rem 1.25rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'inline-block' }}>
                  {uploading ? 'Uploading PDF...' : 'Select & Upload PDF CV 📤'}
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>
        </section>

        {/* Profile Matrix Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: '#0a0f1d', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Academic Background</span>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {profile?.degree || 'Click Edit Profile'}
            </div>
            <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>{profile?.university || 'University not set'}</span>
          </div>

          <div style={{ backgroundColor: '#0a0f1d', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Target Specialization</span>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {profile?.target_role || 'General Tech'}
            </div>
            <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>Active Candidate</span>
          </div>

          <div style={{ backgroundColor: '#0a0f1d', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>WhatsApp Direct</span>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {profile?.phone || 'No phone added'}
            </div>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Direct Alerts</span>
          </div>
        </div>

        {/* Toolkit Section */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.25rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.05rem', color: '#ffffff', margin: '0 0 0.85rem 0' }}>🛠️ Student Career Toolkit</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <Link href="/ats-checker" style={{ backgroundColor: '#0a0f1d', padding: '0.9rem', borderRadius: '8px', border: '1px solid #1e293b', textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>⚡</div>
              <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem' }}>ATS CV Scanner</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Audit resume against Pakistani hiring criteria.</span>
            </Link>

            <div onClick={() => setShowUpgradeModal(true)} style={{ backgroundColor: '#0a0f1d', padding: '0.9rem', borderRadius: '8px', border: '1px solid #1e293b', cursor: 'pointer', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#eab308', color: '#090d16', fontSize: '0.6rem', fontWeight: '800', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>PRO</span>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>✍️</div>
              <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem' }}>AI Cover Letter Builder</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Generate 1-click tailored application letters.</span>
            </div>

            <Link href="/" style={{ backgroundColor: '#0a0f1d', padding: '0.9rem', borderRadius: '8px', border: '1px solid #1e293b', textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>💼</div>
              <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem' }}>District Jobs Feed</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Browse real-time openings in your home city.</span>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
                  }
                  
