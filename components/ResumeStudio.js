'use client';

import { useState } from 'react';

export default function ResumeStudio({ profile, resumeData, navigateToTab }) {
  const [selectedTemplate, setSelectedTemplate] = useState('free-classic');

  const fullName = profile?.full_name || profile?.first_name || 'Shan Ali';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const headline = profile?.headline || profile?.account_type || 'Senior Project Specialist';
  const location = profile?.country || 'Karachi, Pakistan';
  const email = profile?.email || 'contact@shanora.pk';
  const phone = profile?.phone || '+92 300 0000000';

  const templates = [
    // --- 4 FREE BASIC TEMPLATES (Simple but Distinct Single-Column Layouts) ---
    { id: 'free-classic', name: '1. Basic Standard', type: 'Free', variant: 'free-left', accent: '#334155' },
    { id: 'free-centered', name: '2. Academic Centered', type: 'Free', variant: 'free-center', accent: '#0f172a' },
    { id: 'free-boxed', name: '3. Classic Boxed', type: 'Free', variant: 'free-box', accent: '#475569' },
    { id: 'free-minimal', name: '4. Clean Entry', type: 'Free', variant: 'free-topbar', accent: '#0284c7' },

    // --- 8 PRO TEMPLATES (Each with a 100% Unique Visual Architecture) ---
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

  // Helper function to render unique miniature designs inside each card
  const renderMiniCardDesign = (tmpl) => {
    switch (tmpl.variant) {
      case 'free-left':
        return (
          <div style={{ padding: '14px', height: '100%', backgroundColor: '#fff' }}>
            <div style={{ borderBottom: '2px solid #334155', paddingBottom: '6px', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0f172a' }}>{fullName}</div>
              <div style={{ fontSize: '0.48rem', color: '#64748b' }}>{headline}</div>
            </div>
            <div style={{ fontSize: '0.48rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>EXPERIENCE</div>
            <div style={{ height: '4px', backgroundColor: '#cbd5e1', width: '90%', marginBottom: '4px' }} />
            <div style={{ height: '4px', backgroundColor: '#e2e8f0', width: '75%', marginBottom: '10px' }} />
            <div style={{ fontSize: '0.48rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>EDUCATION</div>
            <div style={{ height: '4px', backgroundColor: '#cbd5e1', width: '80%' }} />
          </div>
        );

      case 'free-center':
        return (
          <div style={{ padding: '14px', height: '100%', backgroundColor: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>{fullName.toUpperCase()}</div>
            <div style={{ fontSize: '0.45rem', color: '#64748b', marginBottom: '6px' }}>{location} • {email}</div>
            <div style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '2px 0', fontSize: '0.45rem', fontWeight: '800', marginBottom: '8px' }}>PROFESSIONAL SUMMARY</div>
            <div style={{ height: '4px', backgroundColor: '#e2e8f0', width: '85%', margin: '0 auto 4px auto' }} />
            <div style={{ height: '4px', backgroundColor: '#e2e8f0', width: '70%', margin: '0 auto 10px auto' }} />
            <div style={{ borderBottom: '1px solid #cbd5e1', fontSize: '0.45rem', fontWeight: '800', marginBottom: '6px' }}>WORK HISTORY</div>
            <div style={{ height: '4px', backgroundColor: '#cbd5e1', width: '80%', margin: '0 auto' }} />
          </div>
        );

      case 'free-box':
        return (
          <div style={{ padding: '12px', height: '100%', backgroundColor: '#f8fafc' }}>
            <div style={{ border: '1px solid #94a3b8', padding: '6px', backgroundColor: '#fff', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#334155' }}>{fullName}</div>
              <div style={{ fontSize: '0.45rem', color: '#64748b' }}>Basic Framed Layout</div>
            </div>
            <div style={{ backgroundColor: '#e2e8f0', padding: '2px 4px', fontSize: '0.45rem', fontWeight: '700', marginBottom: '6px' }}>CAREER DETAILS</div>
            <div style={{ height: '4px', backgroundColor: '#cbd5e1', width: '92%', marginBottom: '4px' }} />
            <div style={{ height: '4px', backgroundColor: '#cbd5e1', width: '65%', marginBottom: '8px' }} />
            <div style={{ backgroundColor: '#e2e8f0', padding: '2px 4px', fontSize: '0.45rem', fontWeight: '700', marginBottom: '6px' }}>QUALIFICATIONS</div>
            <div style={{ height: '4px', backgroundColor: '#cbd5e1', width: '78%' }} />
          </div>
        );

      case 'free-topbar':
        return (
          <div style={{ height: '100%', backgroundColor: '#fff' }}>
            <div style={{ height: '8px', backgroundColor: '#0284c7' }} />
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7' }}>{fullName}</div>
              <div style={{ fontSize: '0.45rem', color: '#64748b', marginBottom: '10px' }}>Clean Entry Level CV</div>
              <div style={{ borderLeft: '2px solid #0284c7', paddingLeft: '6px', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.48rem', fontWeight: '700' }}>Experience</div>
                <div style={{ fontSize: '0.42rem', color: '#64748b' }}>Standard chronological view</div>
              </div>
              <div style={{ borderLeft: '2px solid #cbd5e1', paddingLeft: '6px' }}>
                <div style={{ fontSize: '0.48rem', fontWeight: '700' }}>Education</div>
                <div style={{ fontSize: '0.42rem', color: '#64748b' }}>Academic background</div>
              </div>
            </div>
          </div>
        );

      // 5. Jobseeker Style Left Red Accent + Warm Sidebar + Dots
      case 'pro-left-sidebar':
        return (
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: '38%', backgroundColor: tmpl.subBg, borderLeft: `7px solid ${tmpl.accent}`, padding: '10px 6px', fontSize: '0.44rem' }}>
              <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '4px' }}>Personal details</div>
              <div style={{ marginBottom: '2px', color: '#334155' }}>👤 {fullName}</div>
              <div style={{ marginBottom: '8px', color: '#334155' }}>📍 {location}</div>
              <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '3px' }}>Languages</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>English</span><span style={{ color: tmpl.accent }}>●●●●●</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Urdu</span><span style={{ color: tmpl.accent }}>●●●●○</span></div>
              <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '3px' }}>Skills</div>
              <div style={{ color: '#334155', marginBottom: '2px' }}>■ PRINCE2 / Agile</div>
              <div style={{ color: '#334155' }}>■ Cost Control</div>
            </div>
            <div style={{ width: '62%', padding: '10px 8px', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '900', color: tmpl.accent }}>{fullName}</div>
              <div style={{ fontSize: '0.43rem', color: '#475569', marginBottom: '6px' }}>{headline}</div>
              <div style={{ fontSize: '0.48rem', fontWeight: '800', color: tmpl.accent, borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>Employment</div>
              <div style={{ fontSize: '0.44rem', fontWeight: '700' }}>Construction Project Manager</div>
              <div style={{ fontSize: '0.39rem', color: '#64748b', marginBottom: '5px' }}>• Delivered 5 core projects on time.</div>
              <div style={{ fontSize: '0.44rem', fontWeight: '700' }}>Operations Lead</div>
              <div style={{ fontSize: '0.39rem', color: '#64748b', marginBottom: '6px' }}>• Led a team of 60 specialists.</div>
              <div style={{ fontSize: '0.48rem', fontWeight: '800', color: tmpl.accent, borderBottom: '1px solid #f1f5f9', marginBottom: '3px' }}>Education</div>
              <div style={{ fontSize: '0.42rem', fontWeight: '700' }}>B.Sc. / MSc Management</div>
            </div>
          </div>
        );

      // 6. Full Dark Purple Top Banner + Avatar Circle + 2-Column Split below
      case 'pro-top-banner':
        return (
          <div style={{ height: '100%', backgroundColor: '#fff' }}>
            <div style={{ backgroundColor: tmpl.accent, color: '#fff', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fff', color: tmpl.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.6rem', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: '900' }}>{fullName}</div>
                <div style={{ fontSize: '0.42rem', opacity: 0.85 }}>{headline}</div>
              </div>
            </div>
            <div style={{ display: 'flex', padding: '8px', gap: '8px', height: 'calc(100% - 48px)' }}>
              <div style={{ width: '58%', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                <div style={{ fontSize: '0.46rem', fontWeight: '800', color: tmpl.accent, marginBottom: '4px' }}>WORK EXPERIENCE</div>
                <div style={{ fontSize: '0.43rem', fontWeight: '700' }}>Senior Executive</div>
                <div style={{ fontSize: '0.39rem', color: '#64748b', marginBottom: '6px' }}>• Directed global strategy & growth.</div>
                <div style={{ fontSize: '0.46rem', fontWeight: '800', color: tmpl.accent, marginBottom: '4px' }}>EDUCATION</div>
                <div style={{ fontSize: '0.42rem' }}>University Degree</div>
              </div>
              <div style={{ width: '42%', fontSize: '0.42rem' }}>
                <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '4px' }}>EXPERTISE</div>
                <div style={{ backgroundColor: tmpl.subBg, padding: '2px 4px', borderRadius: '3px', marginBottom: '3px', color: tmpl.accent, fontWeight: '700' }}>Strategy</div>
                <div style={{ backgroundColor: tmpl.subBg, padding: '2px 4px', borderRadius: '3px', marginBottom: '3px', color: tmpl.accent, fontWeight: '700' }}>Leadership</div>
                <div style={{ backgroundColor: tmpl.subBg, padding: '2px 4px', borderRadius: '3px', color: tmpl.accent, fontWeight: '700' }}>Operations</div>
              </div>
            </div>
          </div>
        );

      // 7. Tech Emerald: Skill Pills + Timeline Nodes
      case 'pro-tech-pills':
        return (
          <div style={{ height: '100%', backgroundColor: '#fff', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `3px solid ${tmpl.accent}`, paddingBottom: '6px', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#0f172a' }}>{fullName}</div>
                <div style={{ fontSize: '0.44rem', color: tmpl.accent, fontWeight: '700' }}>Full-Stack & IT Systems</div>
              </div>
              <div style={{ fontSize: '0.38rem', textAlign: 'right', color: '#64748b' }}>GitHub / Portfolio<br/>{location}</div>
            </div>
            <div style={{ fontSize: '0.44rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>TECHNICAL STACK</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px' }}>
              {['Next.js', 'Supabase', 'IT Support', 'Networking', 'React'].map(s => (
                <span key={s} style={{ backgroundColor: tmpl.accent, color: '#fff', fontSize: '0.38rem', padding: '1.5px 5px', borderRadius: '99px', fontWeight: '700' }}>{s}</span>
              ))}
            </div>
            <div style={{ fontSize: '0.44rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>PROJECT TIMELINE</div>
            <div style={{ borderLeft: `2px solid ${tmpl.accent}`, paddingLeft: '6px', marginLeft: '3px', fontSize: '0.4rem' }}>
              <div style={{ fontWeight: '700', color: tmpl.accent }}>● Lead Platform Architect</div>
              <div style={{ color: '#64748b', marginBottom: '4px' }}>Built scalable cloud SaaS portals.</div>
              <div style={{ fontWeight: '700', color: tmpl.accent }}>● IT Technical Specialist</div>
              <div style={{ color: '#64748b' }}>Managed enterprise infrastructure.</div>
            </div>
          </div>
        );

      // 8. Right-Side Solid Dark Navy Sidebar
      case 'pro-right-sidebar':
        return (
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: '62%', padding: '10px 8px', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '900', color: tmpl.accent }}>{fullName.toUpperCase()}</div>
              <div style={{ fontSize: '0.44rem', color: '#64748b', marginBottom: '8px' }}>{headline}</div>
              <div style={{ fontSize: '0.46rem', fontWeight: '800', color: tmpl.accent, backgroundColor: tmpl.subBg, padding: '2px 4px', marginBottom: '4px' }}>PROFESSIONAL EXPERIENCE</div>
              <div style={{ fontSize: '0.43rem', fontWeight: '700' }}>Director of Operations</div>
              <div style={{ fontSize: '0.39rem', color: '#64748b', marginBottom: '6px' }}>• Spearheaded regional KPIs.</div>
              <div style={{ fontSize: '0.46rem', fontWeight: '800', color: tmpl.accent, backgroundColor: tmpl.subBg, padding: '2px 4px', marginBottom: '4px' }}>ACADEMIC CREDENTIALS</div>
              <div style={{ fontSize: '0.42rem', fontWeight: '700' }}>Bachelor of Science (B.Sc.)</div>
            </div>
            <div style={{ width: '38%', backgroundColor: tmpl.accent, color: '#fff', padding: '10px 6px', fontSize: '0.42rem' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', margin: '0 auto 6px auto' }}>{initials}</div>
              <div style={{ fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '2px', marginBottom: '4px' }}>CONTACT</div>
              <div style={{ opacity: 0.9, marginBottom: '6px', fontSize: '0.38rem' }}>{location}<br/>Verified Profile</div>
              <div style={{ fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '2px', marginBottom: '4px' }}>CORE SKILLS</div>
              <div style={{ marginBottom: '2px' }}>✓ Administration</div>
              <div style={{ marginBottom: '2px' }}>✓ Team Leadership</div>
              <div>✓ Strategic Planning</div>
            </div>
          </div>
        );

      // 9. Boardroom Gold: Luxury Crest & Framed Borders
      case 'pro-luxury-crest':
        return (
          <div style={{ height: '100%', backgroundColor: '#fffbeb', padding: '8px' }}>
            <div style={{ border: `2px solid ${tmpl.accent}`, height: '100%', padding: '8px', backgroundColor: '#fff', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
              <div style={{ width: '22px', height: '22px', border: `1.5px solid ${tmpl.accent}`, transform: 'rotate(45deg)', margin: '2px auto 6px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ transform: 'rotate(-45deg)', fontSize: '0.45rem', fontWeight: '900', color: tmpl.accent }}>{initials}</span>
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#0f172a', letterSpacing: '1px' }}>{fullName.toUpperCase()}</div>
              <div style={{ fontSize: '0.42rem', color: tmpl.accent, fontStyle: 'italic', marginBottom: '6px' }}>{headline}</div>
              <div style={{ borderTop: `1px solid ${tmpl.accent}`, borderBottom: `1px solid ${tmpl.accent}`, padding: '2px 0', fontSize: '0.42rem', fontWeight: '700', color: tmpl.accent, marginBottom: '6px' }}>EXECUTIVE DOSSIER</div>
              <div style={{ textAlign: 'left', fontSize: '0.4rem', color: '#334155' }}>
                <div style={{ fontWeight: '700' }}>• Senior Board Advisor & Administrator</div>
                <div style={{ color: '#64748b', marginBottom: '4px' }}>High-impact governance & institutional operations.</div>
                <div style={{ fontWeight: '700' }}>• Honours Graduate & Certified Fellow</div>
              </div>
            </div>
          </div>
        );

      // 10. Modern SaaS Lead: Horizontal Progress Bars
      case 'pro-skill-bars':
        return (
          <div style={{ height: '100%', backgroundColor: '#fff', padding: '10px' }}>
            <div style={{ borderLeft: `5px solid ${tmpl.accent}`, paddingLeft: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#0f172a' }}>{fullName}</div>
              <div style={{ fontSize: '0.44rem', color: tmpl.accent, fontWeight: '700' }}>{headline}</div>
            </div>
            <div style={{ fontSize: '0.44rem', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>COMPETENCY METRICS</div>
            {[
              { label: 'Operations & Management', w: '92%' },
              { label: 'Technical Support & IT', w: '85%' },
              { label: 'Digital Productivity', w: '96%' }
            ].map((bar, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.38rem', marginBottom: '1px' }}>
                  <span>{bar.label}</span><span style={{ fontWeight: '700', color: tmpl.accent }}>{bar.w}</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: bar.w, backgroundColor: tmpl.accent, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
            <div style={{ fontSize: '0.44rem', fontWeight: '800', color: '#334155', marginTop: '6px', marginBottom: '3px' }}>CAREER HIGHLIGHTS</div>
            <div style={{ fontSize: '0.4rem', color: '#475569' }}>✓ Automated workflows & institutional records.</div>
          </div>
        );

      // 11. Creative Portfolio: Floating Pink Card Header + Grid
      case 'pro-creative-card':
        return (
          <div style={{ height: '100%', backgroundColor: tmpl.subBg, padding: '8px' }}>
            <div style={{ backgroundColor: tmpl.accent, color: '#fff', borderRadius: '8px', padding: '8px', marginBottom: '6px', boxShadow: '0 4px 10px rgba(157,23,77,0.25)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '900' }}>{fullName}</div>
              <div style={{ fontSize: '0.42rem', opacity: 0.9 }}>{headline}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <div style={{ backgroundColor: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.4rem' }}>
                <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '2px' }}>EXPERIENCE</div>
                <div style={{ fontWeight: '700' }}>Creative Lead</div>
                <div style={{ color: '#64748b', fontSize: '0.36rem' }}>Digital media & brand execution.</div>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.4rem' }}>
                <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '2px' }}>EDUCATION</div>
                <div style={{ fontWeight: '700' }}>B.Sc. Degree</div>
                <div style={{ color: '#64748b', fontSize: '0.36rem' }}>Certified AI & Media Pro</div>
              </div>
              <div style={{ gridColumn: 'span 2', backgroundColor: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.4rem' }}>
                <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '2px' }}>PORTFOLIO HIGHLIGHTS</div>
                <div style={{ color: '#475569', fontSize: '0.38rem' }}>★ Built interactive web & multimedia projects.</div>
              </div>
            </div>
          </div>
        );

      // 12. Titan Ultimate Pro: Charcoal Dark Header + KPI Strip
      case 'pro-titan-dark':
      default:
        return (
          <div style={{ height: '100%', backgroundColor: '#fff' }}>
            <div style={{ backgroundColor: '#111827', color: '#fff', padding: '10px 8px', borderBottom: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '900', letterSpacing: '0.5px' }}>{fullName.toUpperCase()}</div>
              <div style={{ fontSize: '0.42rem', color: '#38bdf8', fontWeight: '700' }}>{headline}</div>
            </div>
            <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '4px 8px', justifyContent: 'space-between', fontSize: '0.38rem', fontWeight: '800', borderBottom: '1px solid #e5e7eb' }}>
              <span>5+ YRS EXP</span><span>•</span><span>B.SC & DIT</span><span>•</span><span>VERIFIED PRO</span>
            </div>
            <div style={{ padding: '8px', fontSize: '0.42rem' }}>
              <div style={{ fontWeight: '800', color: '#111827', marginBottom: '3px' }}>EXECUTIVE SUMMARY & IMPACT</div>
              <div style={{ color: '#4b5563', fontSize: '0.38rem', marginBottom: '6px' }}>High-performing specialist managing technical infrastructure and administrative excellence.</div>
              <div style={{ fontWeight: '800', color: '#111827', marginBottom: '3px' }}>CORE COMPETENCIES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', fontSize: '0.38rem', color: '#111827' }}>
                <span>▪ System Admin</span><span>▪ IT Support</span>
                <span>▪ Cloud Tools</span><span>▪ Operations</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
      
      {/* Studio Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', backgroundColor: '#0f172a', padding: '1.2rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            ATS Resume Studio 📄
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            Every template below has a unique architecture. Free basic layouts & 8 custom-designed PRO executive CVs.
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

      {/* Horizontal Carousel */}
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Choose Your CV Template (12 Distinct Designs ↔️)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>
            4 Free Basic • 8 Unique PRO Layouts
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.2rem', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }}>
          {templates.map((tmpl) => {
            const isPro = tmpl.type === 'Pro';
            const isLocked = isPro && !profile?.is_pro;
            const isSelected = selectedTemplate === tmpl.id;

            return (
              <div
                key={tmpl.id}
                style={{
                  minWidth: '245px',
                  maxWidth: '245px',
                  height: '340px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: isSelected ? '3px solid #38bdf8' : '1px solid #cbd5e1',
                  boxShadow: isSelected ? '0 0 22px rgba(56, 189, 248, 0.45)' : '0 8px 20px rgba(0,0,0,0.35)',
                  position: 'relative',
                  overflow: 'hidden',
                  scrollSnapAlign: 'start',
                  color: '#0f172a',
                  fontFamily: 'system-ui, sans-serif',
                  flexShrink: 0
                }}
              >
                {/* Badge */}
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
                  borderRadius: '999px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {isPro ? 'PRO 🔒' : 'FREE'}
                </div>

                {/* Render Unique Layout Per Card */}
                {renderMiniCardDesign(tmpl)}

                {/* Bottom Overlay Button */}
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
                    onClick={() => {
                      if (isLocked) {
                        alert(`🔒 "${tmpl.name}" is an exclusive SHANORA PRO design. Upgrade to PRO to unlock and customize this executive template!`);
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
                      padding: '7px 14px',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      width: '90%'
                    }}
                  >
                    {isLocked ? '🔒 Unlock PRO Design' : (isSelected ? '✓ Active Template' : 'Use template')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL-SIZE LIVE A4 CV PREVIEW */}
      <div style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
        textAlign: activeTemplateObj.variant === 'free-center' ? 'center' : 'left'
      }}>
        <div style={{
          padding: '2.2rem',
          borderBottom: `3px solid ${activeTemplateObj.accent}`,
          backgroundColor: activeTemplateObj.variant === 'free-box' ? '#f8fafc' : '#ffffff',
          display: 'flex',
          flexDirection: activeTemplateObj.variant === 'free-center' ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: activeTemplateObj.variant === 'free-center' ? 'center' : 'flex-start',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: activeTemplateObj.accent, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
              {fullName}
            </h1>
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0284c7', margin: 0 }}>
              {headline}
            </p>
          </div>
          <div style={{ textAlign: activeTemplateObj.variant === 'free-center' ? 'center' : 'right', fontSize: '0.82rem', color: '#475569', lineHeight: '1.5' }}>
            <p style={{ margin: 0 }}>{email}</p>
            <p style={{ margin: 0 }}>{phone}</p>
            <p style={{ margin: 0 }}>{location}</p>
          </div>
        </div>

        <div style={{ padding: '2rem 2.2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: activeTemplateObj.accent, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>
              {profile?.bio || 'Add your professional bio and career summary in your profile settings to populate this section automatically.'}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: activeTemplateObj.accent, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
              Experience & Career History
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>
              {resumeData?.experience || '• Update your work experience to display your roles, responsibilities, and key achievements here.'}
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: activeTemplateObj.accent, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
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
