'use client';

import { useState, useEffect, useRef } from 'react';

export default function ResumeStudio({ profile, resumeData, navigateToTab }) {
  const [selectedTemplate, setSelectedTemplate] = useState('free-classic');
  const [isEditing, setIsEditing] = useState(false);
  const previewRef = useRef(null);

  // Auto-Put Data from Profile State + Editable State
  const [cvData, setCvData] = useState({
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    languages: 'English (Fluent), Urdu (Native)'
  });

  // Automatically sync whenever profile or resumeData loads from Supabase
  useEffect(() => {
    setCvData({
      fullName: profile?.full_name || profile?.first_name || 'Your Full Name',
      headline: profile?.headline || profile?.account_type || 'Professional Specialist',
      email: profile?.email || 'email@example.com',
      phone: profile?.phone || '+92 300 0000000',
      location: profile?.country || 'Karachi, Pakistan',
      summary: profile?.bio || 'Results-driven professional with strong expertise in operations, technical support, and digital workflows. Committed to delivering organizational excellence.',
      experience: resumeData?.experience || profile?.experience || '• Senior Specialist — Managed core daily operations, technical systems, and team workflows.\n• Project Coordinator — Delivered key digital and administrative milestones on schedule.',
      education: resumeData?.education || profile?.education || 'Bachelor of Science (B.Sc.) | Certified IT & Digital Professional',
      skills: profile?.skills || 'Operations Management, IT Technical Support, MS Office, Networking, Digital Productivity',
      languages: 'English, Urdu, Sindhi'
    });
  }, [profile, resumeData]);

  const initials = (cvData.fullName || 'SP')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const skillList = cvData.skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const templates = [
    // --- 4 FREE TEMPLATES (Fully Editable & Downloadable for Everyone) ---
    { id: 'free-classic', name: '1. Basic Standard', type: 'Free', variant: 'free-left', accent: '#334155', subBg: '#f8fafc' },
    { id: 'free-centered', name: '2. Academic Centered', type: 'Free', variant: 'free-center', accent: '#0f172a', subBg: '#f8fafc' },
    { id: 'free-boxed', name: '3. Classic Boxed', type: 'Free', variant: 'free-box', accent: '#475569', subBg: '#f1f5f9' },
    { id: 'free-minimal', name: '4. Clean Entry', type: 'Free', variant: 'free-topbar', accent: '#0284c7', subBg: '#f0f9ff' },

    // --- 8 PRO TEMPLATES (Click to Open Live Preview, PRO Required to Edit/Download) ---
    { id: 'pro-crimson', name: '5. Executive Crimson', type: 'Pro', variant: 'pro-left-sidebar', accent: '#991b1b', subBg: '#fef2f2' },
    { id: 'pro-royal', name: '6. Royal Split Banner', type: 'Pro', variant: 'pro-top-banner', accent: '#4c1d95', subBg: '#f5f3ff' },
    { id: 'pro-emerald', name: '7. Tech Emerald Grid', type: 'Pro', variant: 'pro-tech-pills', accent: '#065f46', subBg: '#ecfdf5' },
    { id: 'pro-navy', name: '8. Global Navy Director', type: 'Pro', variant: 'pro-right-sidebar', accent: '#1e3a8a', subBg: '#eff6ff' },
    { id: 'pro-gold', name: '9. Boardroom Gold', type: 'Pro', variant: 'pro-luxury-crest', accent: '#92400e', subBg: '#fffbeb' },
    { id: 'pro-cyan', name: '10. Modern SaaS Lead', type: 'Pro', variant: 'pro-skill-bars', accent: '#0e7490', subBg: '#ecfeff' },
    { id: 'pro-rose', name: '11. Creative Portfolio', type: 'Pro', variant: 'pro-creative-card', accent: '#9d174d', subBg: '#fdf2f8' },
    { id: 'pro-titan', name: '12. Titan Ultimate Pro', type: 'Pro', variant: 'pro-titan-dark', accent: '#111827', subBg: '#f3f4f6' }
  ];

  const activeTemplateObj = templates.find((t) => t.id === selectedTemplate) || templates[0];
  const isCurrentLocked = activeTemplateObj.type === 'Pro' && !profile?.is_pro;

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl.id);
    if (tmpl.type === 'Pro' && !profile?.is_pro) {
      setIsEditing(false); // Close editor if locked pro template is selected
    }
    // Smooth scroll down to the full A4 CV preview so user sees it open immediately
    setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Miniature Card Preview Renderer
  const renderMiniCardDesign = (tmpl) => {
    const isRight = tmpl.variant === 'pro-right-sidebar';
    if (tmpl.type === 'Free') {
      return (
        <div style={{ padding: '12px', height: '100%', backgroundColor: '#fff', textAlign: tmpl.variant === 'free-center' ? 'center' : 'left' }}>
          {tmpl.variant === 'free-topbar' && <div style={{ height: '6px', backgroundColor: tmpl.accent, margin: '-12px -12px 8px -12px' }} />}
          <div style={{ border: tmpl.variant === 'free-box' ? '1px solid #94a3b8' : 'none', borderBottom: `2px solid ${tmpl.accent}`, padding: tmpl.variant === 'free-box' ? '4px' : '0 0 5px 0', marginBottom: '6px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', color: tmpl.accent }}>{cvData.fullName}</div>
            <div style={{ fontSize: '0.42rem', color: '#64748b' }}>{cvData.headline}</div>
          </div>
          <div style={{ fontSize: '0.44rem', fontWeight: '700', color: '#334155', marginBottom: '2px' }}>SUMMARY</div>
          <div style={{ height: '3px', backgroundColor: '#cbd5e1', width: '90%', margin: tmpl.variant === 'free-center' ? '0 auto 6px auto' : '0 0 6px 0' }} />
          <div style={{ fontSize: '0.44rem', fontWeight: '700', color: '#334155', marginBottom: '2px' }}>EXPERIENCE</div>
          <div style={{ height: '3px', backgroundColor: '#e2e8f0', width: '85%', margin: tmpl.variant === 'free-center' ? '0 auto 3px auto' : '0 0 3px 0' }} />
          <div style={{ height: '3px', backgroundColor: '#e2e8f0', width: '70%', margin: tmpl.variant === 'free-center' ? '0 auto' : '0' }} />
        </div>
      );
    }

    if (tmpl.variant === 'pro-top-banner' || tmpl.variant === 'pro-titan-dark') {
      return (
        <div style={{ height: '100%', backgroundColor: '#fff' }}>
          <div style={{ backgroundColor: tmpl.accent, color: '#fff', padding: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#fff', color: tmpl.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.5rem' }}>{initials}</div>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: '900' }}>{cvData.fullName}</div>
              <div style={{ fontSize: '0.38rem', opacity: 0.85 }}>{cvData.headline}</div>
            </div>
          </div>
          <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '6px', fontSize: '0.38rem' }}>
            <div>
              <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '2px' }}>EXPERIENCE</div>
              <div style={{ color: '#334155' }}>• Senior Role & Operations</div>
              <div style={{ color: '#64748b' }}>• Project Execution</div>
            </div>
            <div style={{ backgroundColor: tmpl.subBg, padding: '4px', borderRadius: '4px' }}>
              <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '2px' }}>SKILLS</div>
              <div>■ Strategy</div>
              <div>■ Systems</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', height: '100%', flexDirection: isRight ? 'row-reverse' : 'row' }}>
        <div style={{ width: '38%', backgroundColor: isRight ? tmpl.accent : tmpl.subBg, color: isRight ? '#fff' : '#0f172a', borderLeft: isRight ? 'none' : `5px solid ${tmpl.accent}`, padding: '8px 5px', fontSize: '0.38rem' }}>
          <div style={{ fontWeight: '800', color: isRight ? '#fff' : tmpl.accent, marginBottom: '3px' }}>DETAILS</div>
          <div style={{ marginBottom: '2px' }}>📍 {cvData.location}</div>
          <div style={{ fontWeight: '800', color: isRight ? '#fff' : tmpl.accent, marginTop: '5px', marginBottom: '2px' }}>LANGUAGES</div>
          <div>English ●●●●●</div>
          <div>Urdu ●●●●○</div>
          <div style={{ fontWeight: '800', color: isRight ? '#fff' : tmpl.accent, marginTop: '5px', marginBottom: '2px' }}>SKILLS</div>
          {skillList.slice(0, 3).map((s, i) => <div key={i}>■ {s}</div>)}
        </div>
        <div style={{ width: '62%', padding: '8px 6px', backgroundColor: '#fff' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: '900', color: tmpl.accent }}>{cvData.fullName}</div>
          <div style={{ fontSize: '0.4rem', color: '#64748b', marginBottom: '5px' }}>{cvData.headline}</div>
          <div style={{ fontSize: '0.42rem', fontWeight: '800', color: tmpl.accent, borderBottom: '1px solid #e2e8f0', marginBottom: '3px' }}>EMPLOYMENT</div>
          <div style={{ fontSize: '0.38rem', color: '#334155', marginBottom: '4px' }}>• {cvData.experience.split('\n')[0]?.replace('•', '')}</div>
          <div style={{ fontSize: '0.42rem', fontWeight: '800', color: tmpl.accent, borderBottom: '1px solid #e2e8f0', marginBottom: '3px' }}>EDUCATION</div>
          <div style={{ fontSize: '0.38rem', color: '#334155' }}>{cvData.education}</div>
        </div>
      </div>
    );
  };

  // FULL-SIZE A4 DYNAMIC TEMPLATE RENDERER (Changes completely based on selected template!)
  const renderFullA4Template = () => {
    const v = activeTemplateObj.variant;
    const accent = activeTemplateObj.accent;
    const subBg = activeTemplateObj.subBg;

    // 1. Jobseeker Two-Column Sidebar Layouts (Left or Right Sidebar)
    if (v === 'pro-left-sidebar' || v === 'pro-right-sidebar') {
      const isRight = v === 'pro-right-sidebar';
      return (
        <div style={{ display: 'flex', flexDirection: isRight ? 'row-reverse' : 'row', minHeight: '680px', backgroundColor: '#ffffff', color: '#0f172a' }}>
          {/* Sidebar Column */}
          <div style={{
            width: '34%',
            backgroundColor: isRight ? accent : subBg,
            color: isRight ? '#ffffff' : '#1e293b',
            borderLeft: isRight ? 'none' : `10px solid ${accent}`,
            padding: '2.2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: isRight ? 'rgba(255,255,255,0.2)' : accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Verified Profile</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>SHANORA CV</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: isRight ? '#93c5fd' : accent, textTransform: 'uppercase', marginBottom: '0.6rem', borderBottom: `1px solid ${isRight ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`, paddingBottom: '0.3rem' }}>
                Personal Details
              </h4>
              <p style={{ fontSize: '0.8rem', margin: '0.35rem 0' }}>👤 {cvData.fullName}</p>
              <p style={{ fontSize: '0.8rem', margin: '0.35rem 0', wordBreak: 'break-all' }}>✉️ {cvData.email}</p>
              <p style={{ fontSize: '0.8rem', margin: '0.35rem 0' }}>📞 {cvData.phone}</p>
              <p style={{ fontSize: '0.8rem', margin: '0.35rem 0' }}>📍 {cvData.location}</p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: isRight ? '#93c5fd' : accent, textTransform: 'uppercase', marginBottom: '0.6rem', borderBottom: `1px solid ${isRight ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`, paddingBottom: '0.3rem' }}>
                Languages
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                <span>English</span><span style={{ color: isRight ? '#fff' : accent, letterSpacing: '2px' }}>●●●●●</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                <span>Urdu</span><span style={{ color: isRight ? '#fff' : accent, letterSpacing: '2px' }}>●●●●●</span>
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.3rem' }}>{cvData.languages}</div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: isRight ? '#93c5fd' : accent, textTransform: 'uppercase', marginBottom: '0.6rem', borderBottom: `1px solid ${isRight ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`, paddingBottom: '0.3rem' }}>
                Core Skills
              </h4>
              {skillList.map((skill, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: isRight ? '#93c5fd' : accent }}>■</span> {skill}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Column */}
          <div style={{ width: '66%', padding: '2.5rem 2.2rem', backgroundColor: '#ffffff' }}>
            <div style={{ marginBottom: '1.8rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '900', color: accent, margin: '0 0 0.3rem 0' }}>{cvData.fullName}</h1>
              <p style={{ fontSize: '1.05rem', fontWeight: '700', color: '#475569', margin: 0 }}>{cvData.headline}</p>
            </div>

            <div style={{ marginBottom: '1.6rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
                Executive Profile
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.65', margin: 0 }}>{cvData.summary}</p>
            </div>

            <div style={{ marginBottom: '1.6rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
                Employment & Experience
              </h3>
              <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-line' }}>{cvData.experience}</div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
                Education & Qualifications
              </h3>
              <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{cvData.education}</div>
            </div>
          </div>
        </div>
      );
    }

    // 2. Top Colored Banner / Dark Titan Executive Layouts
    if (v === 'pro-top-banner' || v === 'pro-titan-dark') {
      return (
        <div style={{ minHeight: '650px', backgroundColor: '#ffffff', color: '#0f172a' }}>
          <div style={{ backgroundColor: accent, color: '#ffffff', padding: '2.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: v === 'pro-titan-dark' ? '4px solid #38bdf8' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ffffff', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '900' }}>
                {initials}
              </div>
              <div>
                <h1 style={{ fontSize: '1.9rem', fontWeight: '900', margin: '0 0 0.2rem 0', letterSpacing: '0.5px' }}>{cvData.fullName.toUpperCase()}</h1>
                <p style={{ fontSize: '1rem', color: v === 'pro-titan-dark' ? '#38bdf8' : '#e2e8f0', fontWeight: '700', margin: 0 }}>{cvData.headline}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.82rem', lineHeight: '1.5', opacity: 0.95 }}>
              <div>✉️ {cvData.email}</div>
              <div>📞 {cvData.phone}</div>
              <div>📍 {cvData.location}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem', padding: '2.2rem' }}>
            <div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: `2px solid ${accent}`, paddingBottom: '0.3rem', marginBottom: '0.7rem' }}>
                Professional Summary
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.65', marginBottom: '1.6rem' }}>{cvData.summary}</p>

              <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: `2px solid ${accent}`, paddingBottom: '0.3rem', marginBottom: '0.7rem' }}>
                Career Experience
              </h3>
              <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-line' }}>{cvData.experience}</div>
            </div>

            <div style={{ backgroundColor: subBg, padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                Core Competencies
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.5rem' }}>
                {skillList.map((s, i) => (
                  <span key={i} style={{ backgroundColor: accent, color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>{s}</span>
                ))}
              </div>

              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Education
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>{cvData.education}</p>

              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Languages
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0 }}>{cvData.languages}</p>
            </div>
          </div>
        </div>
      );
    }

    // 3. Luxury Crest / Skill Bars / Tech Pills / Creative Card PRO Layouts
    if (activeTemplateObj.type === 'Pro') {
      return (
        <div style={{ minHeight: '650px', backgroundColor: v === 'pro-luxury-crest' ? '#fffbeb' : '#ffffff', padding: '2rem', color: '#0f172a' }}>
          <div style={{ border: v === 'pro-luxury-crest' ? `3px double ${accent}` : `2px solid ${subBg}`, backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `3px solid ${accent}`, paddingBottom: '1.2rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ backgroundColor: accent, color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {activeTemplateObj.name}
                </span>
                <h1 style={{ fontSize: '1.9rem', fontWeight: '900', color: accent, margin: '0.4rem 0 0.2rem 0' }}>{cvData.fullName}</h1>
                <p style={{ fontSize: '1rem', fontWeight: '700', color: '#475569', margin: 0 }}>{cvData.headline}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#475569', lineHeight: '1.5' }}>
                <div>{cvData.email}</div>
                <div>{cvData.phone}</div>
                <div>{cvData.location}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Executive Summary</h3>
              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>{cvData.summary}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.8rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Work Experience</h3>
                <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: '1rem', fontSize: '0.88rem', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {cvData.experience}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Skills & Metrics</h3>
                {skillList.map((s, idx) => (
                  <div key={idx} style={{ marginBottom: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: '700', marginBottom: '2px' }}>
                      <span>{s}</span><span style={{ color: accent }}>{95 - idx * 3}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }}>
                      <div style={{ height: '100%', width: `${95 - idx * 3}%`, backgroundColor: accent, borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}

                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', marginTop: '1.2rem', marginBottom: '0.4rem' }}>Education</h3>
                <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, whiteSpace: 'pre-line' }}>{cvData.education}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 4. Default Free Single-Column Templates (Left, Centered, Boxed, Topbar)
    return (
      <div style={{ backgroundColor: '#ffffff', color: '#0f172a', textAlign: v === 'free-center' ? 'center' : 'left' }}>
        {v === 'free-topbar' && <div style={{ height: '12px', backgroundColor: accent }} />}
        <div style={{
          padding: '2.2rem',
          borderBottom: `3px solid ${accent}`,
          backgroundColor: v === 'free-box' ? '#f8fafc' : '#ffffff',
          display: 'flex',
          flexDirection: v === 'free-center' ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: v === 'free-center' ? 'center' : 'flex-start',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: accent, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>{cvData.fullName}</h1>
            <p style={{ fontSize: '0.98rem', fontWeight: '700', color: '#0284c7', margin: 0 }}>{cvData.headline}</p>
          </div>
          <div style={{ textAlign: v === 'free-center' ? 'center' : 'right', fontSize: '0.82rem', color: '#475569', lineHeight: '1.5' }}>
            <p style={{ margin: 0 }}>{cvData.email}</p>
            <p style={{ margin: 0 }}>{cvData.phone}</p>
            <p style={{ margin: 0 }}>{cvData.location}</p>
          </div>
        </div>

        <div style={{ padding: '2rem 2.2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.65', margin: 0 }}>{cvData.summary}</p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Experience & Career History
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' }}>{cvData.experience}</p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Education & Qualifications
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>{cvData.education}</p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: accent, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Skills & Languages
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#334155', margin: '0 0 0.4rem 0' }}><b>Skills:</b> {cvData.skills}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}><b>Languages:</b> {cvData.languages}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
      
      {/* Top Studio Bar with Edit & Download Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            ATS Resume Studio 📄
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            Click any template to open it below. Profile data is auto-filled & ready to edit!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              if (isCurrentLocked) {
                alert('🔒 Editing on PRO Executive Templates is only available for SHANORA PRO members. Switch to a Free template to edit, or Upgrade to PRO!');
                if (typeof navigateToTab === 'function') navigateToTab('pro');
              } else {
                setIsEditing(!isEditing);
              }
            }}
            style={{
              backgroundColor: isEditing ? '#22c55e' : '#1e293b',
              color: '#fff',
              border: '1px solid #38bdf8',
              padding: '0.65rem 1.1rem',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {isCurrentLocked ? '🔒 Edit CV (PRO)' : (isEditing ? '✓ Done Editing' : '✏️ Edit CV Details')}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isCurrentLocked) {
                alert('🔒 Upgrade to SHANORA PRO to download this exclusive PRO Executive template as a PDF!');
                if (typeof navigateToTab === 'function') navigateToTab('pro');
              } else {
                window.print();
              }
            }}
            style={{
              backgroundColor: isCurrentLocked ? '#7c3aed' : '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}
          >
            {isCurrentLocked ? '🔒 Unlock PRO to Download' : '🖨️ Download Official PDF'}
          </button>
        </div>
      </div>

      {/* Horizontal Visual Template Slider */}
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Click Any CV Template to Open It Below (Swipe ↔️)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>
            Active: {activeTemplateObj.name} ({activeTemplateObj.type})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.1rem', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }}>
          {templates.map((tmpl) => {
            const isPro = tmpl.type === 'Pro';
            const isSelected = selectedTemplate === tmpl.id;

            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                style={{
                  minWidth: '235px',
                  maxWidth: '235px',
                  height: '325px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: isSelected ? '3px solid #38bdf8' : '1px solid #cbd5e1',
                  boxShadow: isSelected ? '0 0 22px rgba(56, 189, 248, 0.55)' : '0 8px 20px rgba(0,0,0,0.35)',
                  position: 'relative',
                  overflow: 'hidden',
                  scrollSnapAlign: 'start',
                  color: '#0f172a',
                  fontFamily: 'system-ui, sans-serif',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transform: isSelected ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                  backgroundColor: isPro ? '#7c3aed' : '#0284c7',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '999px'
                }}>
                  {isPro ? 'PRO 🔒' : 'FREE'}
                </div>

                {renderMiniCardDesign(tmpl)}

                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  padding: '10px',
                  background: 'linear-gradient(to top, rgba(15,23,42,0.96) 65%, rgba(15,23,42,0.0))',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#fff', marginBottom: '5px' }}>
                    {tmpl.name}
                  </span>
                  <button
                    type="button"
                    style={{
                      backgroundColor: isSelected ? '#22c55e' : (isPro ? '#4f46e5' : '#0284c7'),
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.73rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      width: '90%'
                    }}
                  >
                    {isSelected ? '✓ Opened Below' : (isPro ? '👁️ Preview PRO Design' : 'Use template')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LIVE INTERACTIVE EDITOR PANEL (Opens when user clicks "Edit CV Details") */}
      {isEditing && !isCurrentLocked && (
        <div style={{ backgroundColor: '#0f172a', border: '2px solid #0284c7', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#38bdf8', margin: 0 }}>
              ✏️ Edit Your Resume Content (Live Auto-Update)
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
            >
              ✓ Save & Close Editor
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Full Name</label>
              <input value={cvData.fullName} onChange={(e) => setCvData({ ...cvData, fullName: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Professional Headline</label>
              <input value={cvData.headline} onChange={(e) => setCvData({ ...cvData, headline: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Email</label>
              <input value={cvData.email} onChange={(e) => setCvData({ ...cvData, email: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone</label>
              <input value={cvData.phone} onChange={(e) => setCvData({ ...cvData, phone: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Location</label>
              <input value={cvData.location} onChange={(e) => setCvData({ ...cvData, location: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Skills (Comma separated)</label>
              <input value={cvData.skills} onChange={(e) => setCvData({ ...cvData, skills: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
            </div>
          </div>

          <div style={{ marginTop: '0.85rem' }}>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Executive Summary</label>
            <textarea rows={2} value={cvData.summary} onChange={(e) => setCvData({ ...cvData, summary: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
          </div>

          <div style={{ marginTop: '0.85rem' }}>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Work Experience</label>
            <textarea rows={3} value={cvData.experience} onChange={(e) => setCvData({ ...cvData, experience: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
          </div>

          <div style={{ marginTop: '0.85rem' }}>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Education & Certifications</label>
            <textarea rows={2} value={cvData.education} onChange={(e) => setCvData({ ...cvData, education: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#070b14', color: '#fff', fontSize: '0.82rem' }} />
          </div>
        </div>
      )}

      {/* FULL-SIZE OPENED TEMPLATE A4 PREVIEW */}
      <div ref={previewRef} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.5)' }}>
        
        {/* PRO Watermark Bar if user is previewing a locked PRO template */}
        {isCurrentLocked && (
          <div style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '0.75rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800' }}>
              🔒 Previewing "{activeTemplateObj.name}" (SHANORA PRO Exclusive Layout) — Editing & PDF Export Locked
            </span>
            <button
              type="button"
              onClick={() => {
                if (typeof navigateToTab === 'function') navigateToTab('pro');
              }}
              style={{ backgroundColor: '#eab308', color: '#000', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '900', cursor: 'pointer' }}
            >
              ⭐ Upgrade to Unlock
            </button>
          </div>
        )}

        {renderFullA4Template()}
      </div>

    </div>
  );
}
