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

  // Pro features modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
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
      }
      setLoading(false);
    }
    loadUserData();
  }, [router]);

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
      alert('Upload fail ho gaya. Supabase storage bucket check karein.');
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
    <main style={{ minHeight: '90vh', padding: '2.5rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Welcome & Tier Banner */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>Student Account</span>
              {profile?.is_premium ? (
                <span style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                  👑 SHANORA PRO
                </span>
              ) : (
                <span style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                  Standard Tier
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
              {profile?.full_name || 'Pakistani Graduate'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              {user?.email} • {profile?.city || 'Pakistan'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!profile?.is_premium && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                style={{ backgroundColor: '#eab308', color: '#090d16', border: 'none', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '800' }}
              >
                Upgrade to Pro ⚡
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{ backgroundColor: '#1e293b', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Upgrade Pro Modal */}
        {showUpgradeModal && (
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #eab308', borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(234, 179, 8, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#facc15', margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>🚀 Unlock Shanora Pro Features</h3>
              <button onClick={() => setShowUpgradeModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Pakistani graduates ke liye tailored premium tools jo interview calls ke chances barha dete hain:
            </p>
            <ul style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '1rem 0', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
              <li><strong style={{ color: '#ffffff' }}>AI Resume Auto-Rewrite:</strong> Top tech aur banking companies ke format ke mutabiq resume optimize karein.</li>
              <li><strong style={{ color: '#ffffff' }}>Custom Cover Letter Builder:</strong> Har job ke liye 1-click tailored cover letter.</li>
              <li><strong style={{ color: '#ffffff' }}>Priority Matching:</strong> Recruiter pool mein aapka CV top par highlight hoga.</li>
            </ul>
            <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pro Access (Launch Offer)</span>
                <div style={{ color: '#4ade80', fontSize: '1.3rem', fontWeight: '900' }}>PKR 999 <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>PKR 2,500</span></div>
              </div>
              <a
                href="https://wa.me/923000000000?text=Hi%20Shanora%20Team%2C%20I%20want%20to%20upgrade%20to%20Shanora%20Pro"
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.65rem 1.25rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '800', fontSize: '0.9rem' }}
              >
                Pay via Easypaisa / JazzCash 📲
              </a>
            </div>
          </div>
        )}

        {/* CV Upload Section */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📄</span> Official Resume / CV
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                Upload your updated PDF for recruiter shortlisting.
              </p>
            </div>
            {resumeUrl && (
              <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #22c55e' }}>
                ✓ CV Uploaded
              </span>
            )}
          </div>

          {uploadMsg && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #22c55e' }}>
              {uploadMsg}
            </div>
          )}

          <div style={{ backgroundColor: '#0a0f1d', padding: '1.25rem', borderRadius: '10px', border: '1px dashed #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center' }}>
            {resumeUrl ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.6rem 1.25rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  View / Download My CV ↗
                </a>

                <label style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                  {uploading ? 'Uploading...' : 'Replace CV (PDF)'}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            ) : (
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Abhi tak koi CV upload nahi hua. Apna updated resume PDF select karein.
                </p>
                <label style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.65rem 1.5rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', display: 'inline-block' }}>
                  {uploading ? 'Uploading PDF...' : 'Select & Upload PDF CV 📤'}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        {/* Profile Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ backgroundColor: '#0a0f1d', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Academic Background</span>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.05rem', marginTop: '0.35rem' }}>
              {profile?.degree || 'Not specified'}
            </div>
            <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>{profile?.university || 'University not set'}</span>
          </div>

          <div style={{ backgroundColor: '#0a0f1d', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Target Specialization</span>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.05rem', marginTop: '0.35rem' }}>
              {profile?.target_role || 'General Tech'}
            </div>
            <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>Active Candidate</span>
          </div>

          <div style={{ backgroundColor: '#0a0f1d', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>WhatsApp Direct</span>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.05rem', marginTop: '0.35rem' }}>
              {profile?.phone || 'No phone added'}
            </div>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Alerts Enabled</span>
          </div>
        </div>

        {/* Tools Section */}
        <div style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 1rem 0' }}>🛠️ Student Career Toolkit</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Link
              href="/ats-checker"
              style={{ backgroundColor: '#0a0f1d', padding: '1.1rem', borderRadius: '10px', border: '1px solid #1e293b', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>⚡</div>
              <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.95rem' }}>ATS CV Scanner</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Check ATS match score & keywords for Pakistani market.</span>
            </Link>

            <div
              onClick={() => setShowUpgradeModal(true)}
              style={{ backgroundColor: '#0a0f1d', padding: '1.1rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer', position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#eab308', color: '#090d16', fontSize: '0.65rem', fontWeight: '800', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>PRO</span>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>✍️</div>
              <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.95rem' }}>AI Cover Letter Builder</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Generate 1-click tailored cover letters for any job.</span>
            </div>

            <Link
              href="/"
              style={{ backgroundColor: '#0a0f1d', padding: '1.1rem', borderRadius: '10px', border: '1px solid #1e293b', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>💼</div>
              <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.95rem' }}>District Jobs Feed</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Browse real-time openings in your home city.</span>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
  }
                 
