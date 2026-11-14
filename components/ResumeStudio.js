'use client';

import { useState } from 'react';

export default function ResumeStudio({ profile, resumeData, navigateToTab }) {
  const [selectedTemplate, setSelectedTemplate] = useState('free-basic-1');

  const templates = [
    // --- 4 FREE BASIC SAMPLE TEMPLATES (Simple 1-Column) ---
    { id: 'free-basic-1', name: 'Basic Standard', type: 'Free', layout: 'simple', accent: '#334155', headerBg: '#ffffff' },
    { id: 'free-basic-2', name: 'Simple Minimal', type: 'Free', layout: 'simple', accent: '#0f172a', headerBg: '#f8fafc' },
    { id: 'free-basic-3', name: 'Classic Text', type: 'Free', layout: 'simple', accent: '#475569', headerBg: '#ffffff' },
    { id: 'free-basic-4', name: 'Clean Entry', type: 'Free', layout: 'simple', accent: '#0284c7', headerBg: '#f0f9ff' },

    // --- 8 PAID / PRO EXECUTIVE TEMPLATES (Jobseeker 2-Column Sidebar & Dots) ---
    { id: 'pro-crimson', name: 'Executive Crimson', type: 'Pro', layout: 'sidebar-left', accent: '#991b1b', sidebarBg: '#fef2f2' },
    { id: 'pro-royal', name: 'Royal Purple Pro', type: 'Pro', layout: 'sidebar-left', accent: '#5b21b6', sidebarBg: '#f5f3ff' },
    { id: 'pro-emerald', name: 'Tech Emerald Elite', type: 'Pro', layout: 'sidebar-left', accent: '#065f46', sidebarBg: '#ecfdf5' },
    { id: 'pro-navy', name: 'Global Navy Director', type: 'Pro', layout: 'sidebar-right', accent: '#1e3a8a', sidebarBg: '#eff6ff' },
    { id: 'pro-gold', name: 'Boardroom Gold', type: 'Pro', layout: 'sidebar-left', accent: '#b45309', sidebarBg: '#fffbeb' },
    { id: 'pro-cyan', name: 'Modern SaaS Lead', type: 'Pro', layout: 'sidebar-left', accent: '#0e7490', sidebarBg: '#ecfeff' },
    { id: 'pro-rose', name: 'Creative Portfolio', type: 'Pro', layout: 'sidebar-right', accent: '#9d174d', sidebarBg: '#fdf2f8' },
    { id: 'pro-charcoal', name: 'Titan Ultimate Pro', type: 'Pro', layout: 'sidebar-left', accent: '#111827', sidebarBg: '#f3f4f6' }
  ];

  const activeTemplateObj = templates.find((t) => t.id === selectedTemplate) || templates[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            ATS Resume Studio 📄
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            Swipe through templates below. Free basic formats & PRO executive two-column designs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)' }}
        >
          🖨️ Download Official PDF
        </button>
      </div>

      {/* Jobseeker-Style Horizontal Visual CV Template Slider */}
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Choose Your CV Template (Swipe Left/Right ↔️)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>
            4 Free Basic • 8 PRO Executive
          </span>
        </div>

        {/* Horizontal Carousel Container */}
        <div style={{ display: 'flex', gap: '1.2rem', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }}>
          {templates.map((tmpl) => {
            const isPro = tmpl.type === 'Pro';
            const isLocked = isPro && !profile?.is_pro;
            const isSelected = selectedTemplate === tmpl.id;

            return (
              <div
                key={tmpl.id}
                style={{
                  minWidth: '240px',
                  maxWidth: '240px',
                  height: '330px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: isSelected ? '3px solid #38bdf8' : '1px solid #cbd5e1',
                  boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.4)' : '0 8px 20px rgba(0,0,0,0.35)',
                  position: 'relative',
                  overflow: 'hidden',
                  scrollSnapAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#0f172a',
                  fontFamily: 'system-ui, sans-serif',
                  flexShrink: 0
                }}
              >
                {/* TOP BADGE (FREE vs PRO) */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                  backgroundColor: isPro ? '#7c3aed' : '#0284c7',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {isPro ? 'PRO 🔒' : 'FREE SAMPLE'}
                </div>

                {/* MINIATURE VISUAL CV SHEET RENDER */}
                {tmpl.layout === 'simple' ? (
                  <div style={{ padding: '14px', height: '100%', backgroundColor: tmpl.headerBg }}>
                    <div style={{ borderBottom: `2px solid ${tmpl.accent}`, paddingBottom: '6px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: tmpl.accent }}>
                        {profile?.full_name || 'Your Name'}
                      </div>
                      <div style={{ fontSize: '0.5rem', color: '#64748b' }}>Basic Simple Format</div>
                    </div>
                    <div style={{ fontSize: '0.52rem', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>SUMMARY</div>
                    <div style={{ height: '4px', backgroundColor: '#cbd5e1', borderRadius: '2px', marginBottom: '3px', width: '95%' }} />
                    <div style={{ height: '4px', backgroundColor: '#cbd5e1', borderRadius: '2px', marginBottom: '8px', width: '75%' }} />

                    <div style={{ fontSize: '0.52rem', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>EXPERIENCE</div>
                    <div style={{ height: '4px', backgroundColor: '#94a3b8', borderRadius: '2px', marginBottom: '3px', width: '60%' }} />
                    <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginBottom: '3px', width: '90%' }} />
                    <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginBottom: '8px', width: '85%' }} />

                    <div style={{ fontSize: '0.52rem', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>EDUCATION</div>
                    <div style={{ height: '4px', backgroundColor: '#cbd5e1', borderRadius: '2px', width: '70%' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', height: '100%', flexDirection: tmpl.layout === 'sidebar-right' ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '38%', backgroundColor: tmpl.sidebarBg, borderLeft: tmpl.layout === 'sidebar-right' ? 'none' : `6px solid ${tmpl.accent}`, padding: '10px 6px', fontSize: '0.45rem' }}>
                      <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '4px', fontSize: '0.5rem' }}>Personal details</div>
                      <div style={{ color: '#475569', marginBottom: '2px' }}>👤 {profile?.full_name?.split(' ')[0] || 'Member'}</div>
                      <div style={{ color: '#475569', marginBottom: '6px' }}>📍 {profile?.country || 'City'}</div>

                      <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '3px', fontSize: '0.5rem' }}>Languages</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>English</span>
                        <span style={{ color: tmpl.accent }}>●●●●●</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>Urdu</span>
                        <span style={{ color: tmpl.accent }}>●●●●○</span>
                      </div>

                      <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '3px', fontSize: '0.5rem' }}>Skills</div>
                      <div style={{ marginBottom: '3px', color: '#334155' }}>■ Project Mgmt</div>
                      <div style={{ marginBottom: '3px', color: '#334155' }}>■ IT & Systems</div>
                      <div style={{ color: '#334155' }}>■ Leadership</div>
                    </div>

                    <div style={{ width: '62%', padding: '10px 8px', backgroundColor: '#ffffff' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '900', color: tmpl.accent, lineHeight: '1.1' }}>
                        {profile?.full_name || 'Executive Name'}
                      </div>
                      <div style={{ fontSize: '0.45rem', color: '#64748b', marginBottom: '6px' }}>
                        {profile?.headline || 'Senior Specialist & Pro'}
                      </div>

                      <div style={{ fontSize: '0.5rem', fontWeight: '800', color: tmpl.accent, borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px' }}>
                        Employment
                      </div>
                      <div style={{ fontSize: '0.45rem', fontWeight: '700', color: '#0f172a' }}>Senior Lead Role</div>
                      <div style={{ fontSize: '0.4rem', color: '#64748b', marginBottom: '4px' }}>• Managed core operations.</div>

                      <div style={{ fontSize: '0.45rem', fontWeight: '700', color: '#0f172a' }}>Technical Specialist</div>
                      <div style={{ fontSize: '0.4rem', color: '#64748b', marginBottom: '6px' }}>• Delivered digital milestones.</div>

                      <div style={{ fontSize: '0.5rem', fontWeight: '800', color: tmpl.accent, borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px' }}>
                        Education
                      </div>
                      <div style={{ fontSize: '0.45rem', fontWeight: '700', color: '#0f172a' }}>Bachelor Degree</div>
                    </div>
                  </div>
                )}

                {/* FLOATING "USE TEMPLATE" BUTTON AT BOTTOM */}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  padding: '10px',
                  background: 'linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.0))',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#fff', marginBottom: '5px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {tmpl.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        alert('🔒 This Professional 2-Column Template is exclusive to SHANORA PRO members. Upgrade to PRO to unlock and edit this template!');
                        if (typeof navigateToTab === 'function') navigateToTab('pro');
                      } else {
                        setSelectedTemplate(tmpl.id);
                      }
                    }}
                    style={{
                      backgroundColor: isLocked ? '#4f46e5' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 16px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      width: '88%',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                    }}
                  >
                    {isLocked ? '🔒 Unlock PRO Template' : (isSelected ? '✓ Active Template' : 'Use template')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL-SIZE A4 LIVE CV PREVIEW BELOW */}
      <div style={{ backgroundColor: activeTemplateObj.headerBg || '#ffffff', color: '#0f172a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '2.2rem', borderBottom: `3px solid ${activeTemplateObj.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: activeTemplateObj.accent, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
              {profile?.full_name || profile?.first_name || 'Your Full Name'}
            </h1>
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0284c7', margin: 0 }}>
              {profile?.headline || profile?.account_type || 'Professional Member on Shanora'}
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#475569', lineHeight: '1.5' }}>
            <p style={{ margin: 0 }}>{profile?.email || 'email@example.com'}</p>
            <p style={{ margin: 0 }}>{profile?.phone || '+92 XXX XXXXXXX'}</p>
            <p style={{ margin: 0 }}>{profile?.country || 'Pakistan'}</p>
          </div>
        </div>

        <div style={{ padding: '2rem 2.2rem', backgroundColor: '#ffffff' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: activeTemplateObj.accent, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>
              {profile?.bio || 'Add your professional bio and career summary in your profile settings to populate this section automatically.'}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: activeTemplateObj.accent, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Experience & Career History
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>
              {resumeData?.experience || '• Update your work experience to display your roles, responsibilities, and key achievements here.'}
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: activeTemplateObj.accent, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Skills & Credentials
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0 }}>
              {profile?.skills || 'Professional Networking • Operations • Digital Productivity • Communication'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
