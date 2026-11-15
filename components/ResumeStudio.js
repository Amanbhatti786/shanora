'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ResumeStudio({ profile, resumeData, navigateToTab }) {
  // Safe Supabase Client using standard @supabase/supabase-js
  const supabaseRef = useRef(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (url && key) {
          supabaseRef.current = createClient(url, key);
        }
      } catch (e) {
        supabaseRef.current = null;
      }
    }
    return supabaseRef.current;
  };

  // --- CORE STUDIO STATE ---
  const [selectedTemplate, setSelectedTemplate] = useState('free-classic');
  const [cvStandard, setCvStandard] = useState('international'); // 'international' | 'european' | 'ats'
  const [activeStep, setActiveStep] = useState(1);
  const [showWizard, setShowWizard] = useState(false);

  // Saved CVs Management (Supabase + LocalStorage)
  const [savedResumes, setSavedResumes] = useState([]);
  const [currentResumeId, setCurrentResumeId] = useState(null);
  const [cvTitle, setCvTitle] = useState('My Official CV');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // AI & Analysis Modals
  const [atsReport, setAtsReport] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');

  const previewRef = useRef(null);
  const a4SheetRef = useRef(null);

  // Reorderable Section Keys
  const [sectionOrder, setSectionOrder] = useState([
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'achievements',
    'references',
    'additional'
  ]);

  // --- 12 INTERNATIONAL CV SECTIONS STATE ---
  const [cvData, setCvData] = useState({
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    whatsapp: '',
    location: '',
    linkedin: '',
    portfolio: '',
    photoUrl: '',
    showPhoto: false,
    summary: '',
    careerObjective: '',
    experiences: [
      {
        id: 'exp-1',
        jobTitle: 'Office Assistant & IT Technical Support',
        company: 'Organization Name',
        location: 'Karachi, Pakistan',
        startDate: '2019',
        endDate: 'Present',
        responsibilities: 'Managed daily operations, computer systems, and administrative workflows.',
        achievements: 'Streamlined digital documentation and technical support response time.'
      }
    ],
    educations: [
      {
        id: 'edu-1',
        degree: 'Bachelor of Science (B.Sc.)',
        institution: 'University Name',
        location: 'Sindh, Pakistan',
        startYear: '2017',
        gradYear: '2019'
      }
    ],
    technicalSkills: 'IT Technical Support, MS Office Suite, System Troubleshooting, Basic Networking, Full-Stack Web Tools',
    softSkills: 'Problem Solving, Team Collaboration, Time Management, Professional Communication',
    certifications: 'Diploma in Information Technology (DIT) • Google Introduction to AI Certification',
    languagesList: [
      { id: 'lang-1', name: 'English', level: 'Fluent' },
      { id: 'lang-2', name: 'Urdu', level: 'Native' }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Digital Platform Architecture',
        description: 'Developed a modern web portal utilizing cloud database and responsive design.',
        url: 'https://shanora-pk.vercel.app'
      }
    ],
    achievements: 'Recognized for outstanding technical support and digital productivity implementation.',
    references: 'Available upon professional request.',
    drivingLicence: '',
    availability: 'Immediate / 2 Weeks Notice',
    relocate: 'Yes — Open to National & International Relocation',
    otherInfo: ''
  });

  // Sync with SHANORA user profile on initial load
  useEffect(() => {
    setCvData((prev) => ({
      ...prev,
      fullName: profile?.full_name || profile?.first_name || prev.fullName || 'Your Full Name',
      headline: profile?.headline || profile?.account_type || prev.headline || 'Professional Specialist',
      email: profile?.email || prev.email || 'email@example.com',
      phone: profile?.phone || prev.phone || '+92 300 0000000',
      whatsapp: profile?.phone || prev.whatsapp || '+92 300 0000000',
      location: profile?.country || prev.location || 'Karachi, Pakistan',
      photoUrl: profile?.avatar_url || prev.photoUrl || '',
      summary:
        profile?.bio ||
        prev.summary ||
        'Results-driven professional with verified expertise in operations, technical support, and digital workflows.',
      technicalSkills: profile?.skills || prev.technicalSkills
    }));
  }, [profile, resumeData]);

  // Load saved CVs from Supabase if table exists
  useEffect(() => {
    const fetchSavedResumes = async () => {
      if (!profile?.id) return;
      const supabase = getSupabase();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });
      if (!error && data) {
        setSavedResumes(data);
      }
    };
    fetchSavedResumes();
  }, [profile?.id]);

  // --- PRESERVED 12 TEMPLATES (4 FREE + 8 PRO) ---
  const templates = [
    { id: 'free-classic', name: '1. Basic Standard', type: 'Free', variant: 'free-left', accent: '#334155', subBg: '#f8fafc' },
    { id: 'free-centered', name: '2. Academic Centered', type: 'Free', variant: 'free-center', accent: '#0f172a', subBg: '#f8fafc' },
    { id: 'free-boxed', name: '3. Classic Boxed', type: 'Free', variant: 'free-box', accent: '#475569', subBg: '#f1f5f9' },
    { id: 'free-minimal', name: '4. Clean Entry', type: 'Free', variant: 'free-topbar', accent: '#0284c7', subBg: '#f0f9ff' },

    { id: 'pro-crimson', name: '5. Executive Crimson', type: 'Pro', variant: 'pro-left-sidebar', accent: '#991b1b', subBg: '#fef2f2' },
    { id: 'pro-royal', name: '6. Royal Split Banner', type: 'Pro', variant: 'pro-top-banner', accent: '#4c1d95', subBg: '#f5f3ff' },
    { id: 'pro-emerald', name: '7. Tech Emerald Grid', type: 'Pro', variant: 'pro-tech-pills', accent: '#065f46', subBg: '#ecfdf5' },
    { id: 'pro-navy', name: '8. Global Navy Director', type: 'Pro', variant: 'pro-right-sidebar', accent: '#1e3a8a', subBg: '#eff6ff' },
    { id: 'pro-gold', name: '9. Boardroom Gold', type: 'Pro', variant: 'pro-luxury-crest', accent: '#92400e', subBg: '#fffbeb' },
    { id: 'pro-cyan', name: '10. Modern SaaS Lead', type: 'Pro', variant: 'pro-skill-bars', accent: '#0e7490', subBg: '#ecfeff' },
    { id: 'pro-rose', name: '11. Creative Portfolio', type: 'Pro', variant: 'pro-creative-card', accent: '#9d174d', subBg: '#fdf2f8' },
    { id: 'pro-titan', name: '12. Titan Ultimate Pro', type: 'Pro', variant: 'pro-titan-dark', accent: '#111827', subBg: '#f3f4f6' }
  ];

  const isUserPro = Boolean(profile?.is_pro);
  const activeTemplateObj = templates.find((t) => t.id === selectedTemplate) || templates[0];
  const isDownloadLocked = activeTemplateObj.type === 'Pro' && !isUserPro;

  const initials = (cvData.fullName || 'SP')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const techSkillList = (cvData.technicalSkills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const softSkillList = (cvData.softSkills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allSkillsCombined = [...techSkillList, ...softSkillList];

  const steps = [
    { num: 1, label: '1. Template' },
    { num: 2, label: '2. Personal' },
    { num: 3, label: '3. Summary' },
    { num: 4, label: '4. Experience' },
    { num: 5, label: '5. Education' },
    { num: 6, label: '6. Skills & More' },
    { num: 7, label: '7. Preview & Order' },
    { num: 8, label: '8. Save & PDF' }
  ];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCvData((prev) => ({ ...prev, photoUrl: reader.result, showPhoto: true }));
    };
    reader.readAsDataURL(file);
  };

  const moveSection = (index, direction) => {
    const updated = [...sectionOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSectionOrder(updated);
  };

  const handleAiGenerateSummary = () => {
    const role = cvData.headline || 'Professional';
    const topSkills = techSkillList.slice(0, 4).join(', ');
    const expTitles = cvData.experiences.map((e) => e.jobTitle).filter(Boolean).join(' and ');
    const eduDegrees = cvData.educations.map((e) => e.degree).filter(Boolean).join(', ');

    const generated = `Dedicated and detail-oriented ${role}${expTitles ? ` with practical experience as ${expTitles}` : ''}.${eduDegrees ? ` Holds qualifications in ${eduDegrees}.` : ''}${topSkills ? ` Skilled in ${topSkills}, with a proven commitment to operational excellence, problem-solving, and high-standard execution.` : ''}`;

    setCvData((prev) => ({ ...prev, summary: generated }));
    setStatusMsg('✨ AI Summary generated strictly from your entered profile facts.');
  };

  const handleAiPolishExperience = (expIndex) => {
    const exp = cvData.experiences[expIndex];
    if (!exp) return;

    const polishText = (raw) => {
      if (!raw.trim()) return raw;
      return raw
        .split('\n')
        .map((line) => {
          let cl = line.replace(/^[•\-*]\s*/, '').trim();
          if (!cl) return '';
          cl = cl.charAt(0).toUpperCase() + cl.slice(1);
          if (!/[.!?]$/.test(cl)) cl += '.';
          if (!/^(Managed|Led|Developed|Executed|Coordinated|Maintained|Delivered|Implemented|Spearheaded|Supported)/i.test(cl)) {
            cl = `Executed and managed ${cl.charAt(0).toLowerCase() + cl.slice(1)}`;
          }
          return `• ${cl}`;
        })
        .filter(Boolean)
        .join('\n');
    };

    const updated = [...cvData.experiences];
    updated[expIndex] = {
      ...exp,
      responsibilities: polishText(exp.responsibilities),
      achievements: polishText(exp.achievements)
    };
    setCvData((prev) => ({ ...prev, experiences: updated }));
    setStatusMsg('✨ Bullet points formatted into professional action-verb statements.');
  };

  const handleAiSuggestSkills = () => {
    const role = (cvData.headline || '').toLowerCase();
    let suggested = ['Project Coordination', 'Digital Documentation', 'Process Optimization'];
    if (role.includes('it') || role.includes('tech') || role.includes('support') || role.includes('developer')) {
      suggested = ['System Administration', 'Hardware & Software Troubleshooting', 'Network Configuration', 'Cloud Productivity', 'Technical Documentation'];
    } else if (role.includes('manager') || role.includes('director') || role.includes('admin') || role.includes('office')) {
      suggested = ['Office Administration', 'Stakeholder Communication', 'Resource Planning', 'Record Management', 'Operational Reporting'];
    }
    const existingSet = new Set(techSkillList.map((s) => s.toLowerCase()));
    const newOnes = suggested.filter((s) => !existingSet.has(s.toLowerCase()));
    if (newOnes.length > 0) {
      setCvData((prev) => ({
        ...prev,
        technicalSkills: prev.technicalSkills ? `${prev.technicalSkills}, ${newOnes.join(', ')}` : newOnes.join(', ')
      }));
      setStatusMsg(`✨ Added relevant skills for "${cvData.headline}": ${newOnes.join(', ')}`);
    } else {
      setStatusMsg('✓ Your skills list already covers the top recommendations for your title.');
    }
  };

  const handleRunAtsAnalysis = () => {
    if (!isUserPro) {
      alert('🔒 Deep ATS Compatibility Analysis is a SHANORA PRO feature. Upgrade to PRO to unlock full ATS scoring!');
      if (typeof navigateToTab === 'function') navigateToTab('pro');
      return;
    }
    const missing = [];
    let score = 100;
    if (!cvData.email || !cvData.phone) { missing.push('Complete Contact Information (Email & Phone)'); score -= 15; }
    if (!cvData.linkedin) { missing.push('LinkedIn Profile URL (Highly recommended for international recruiters)'); score -= 8; }
    if (!cvData.summary || cvData.summary.length < 60) { missing.push('Expand Professional Summary (Aim for 150–300 characters)'); score -= 15; }
    if (cvData.experiences.length === 0) { missing.push('At least 1 Work Experience entry'); score -= 25; }
    if (cvData.educations.length === 0) { missing.push('At least 1 Education qualification'); score -= 15; }
    if (techSkillList.length < 5) { missing.push('Add at least 5 Technical Skills for keyword matching'); score -= 12; }

    setAtsReport({
      score: Math.max(score, 20),
      missing,
      standardNote:
        cvStandard === 'ats'
          ? 'ATS Standard active: Single-column clean parsing enabled.'
          : 'Tip: Switch CV Standard to "ATS-Friendly Resume" when applying via automated portals.'
    });
  };

  const handleGenerateCoverLetter = () => {
    if (!isUserPro) {
      alert('🔒 AI Cover Letter Generator is an exclusive SHANORA PRO feature. Upgrade to PRO to generate customized cover letters!');
      if (typeof navigateToTab === 'function') navigateToTab('pro');
      return;
    }
    const role = targetRole || cvData.headline || 'the open position';
    const company = targetCompany || 'your esteemed organization';
    const expSummary = cvData.experiences
      .map((e) => `${e.jobTitle} at ${e.company} (${e.startDate} – ${e.endDate})`)
      .join('; ');
    const eduSummary = cvData.educations.map((e) => `${e.degree} from ${e.institution}`).join(', ');

    const letter = `Dear Hiring Manager at ${company},\n\nI am writing to express my strong interest in applying for the ${role} position. With my background as a ${cvData.headline}${expSummary ? `, including experience as ${expSummary}` : ''}, I have developed a solid foundation in ${techSkillList.slice(0, 5).join(', ')}.\n\n${cvData.summary}\n\n${eduSummary ? `My academic credentials include ${eduSummary}. ` : ''}Throughout my work, I have consistently focused on reliability, accuracy, and collaborative execution (${softSkillList.slice(0, 3).join(', ')}).\n\nI would welcome the opportunity to discuss how my existing skills and experience align with the goals of ${company}. Thank you for your time and consideration.\n\nSincerely,\n${cvData.fullName}\n${cvData.email} | ${cvData.phone}\n${cvData.location}`;

    setCoverLetter(letter);
  };

  const handleSaveCvToDatabase = async (asNewVersion = false) => {
    if (activeTemplateObj.type === 'Pro' && !isUserPro) {
      alert('🔒 Cannot save a PRO template on a Free account. Please select a Free template (1–4) or upgrade to SHANORA PRO.');
      return;
    }
    if (!isUserPro && asNewVersion && savedResumes.length >= 1) {
      alert('🔒 Multiple CV version management is a SHANORA PRO feature. Free users can save and update 1 primary CV.');
      if (typeof navigateToTab === 'function') navigateToTab('pro');
      return;
    }

    setIsSaving(true);
    setStatusMsg('');

    try {
      localStorage.setItem('shanora_latest_cv_backup', JSON.stringify({ cvTitle, selectedTemplate, cvStandard, cvData, sectionOrder }));

      const supabase = getSupabase();
      if (!supabase || !profile?.id) {
        setStatusMsg('✓ CV saved to local browser storage!');
        setIsSaving(false);
        return;
      }

      const payload = {
        user_id: profile.id,
        title: cvTitle || 'My Professional CV',
        template_id: selectedTemplate,
        cv_standard: cvStandard,
        cv_data: cvData,
        section_order: sectionOrder,
        updated_at: new Date().toISOString()
      };

      let result;
      if (currentResumeId && !asNewVersion) {
        result = await supabase.from('user_resumes').update(payload).eq('id', currentResumeId).eq('user_id', profile.id).select().single();
      } else {
        result = await supabase.from('user_resumes').insert(payload).select().single();
      }

      if (result.error) {
        setStatusMsg(`✓ Saved locally (${result.error.message})`);
      } else if (result.data) {
        setCurrentResumeId(result.data.id);
        const { data: list } = await supabase.from('user_resumes').select('*').eq('user_id', profile.id).order('updated_at', { ascending: false });
        if (list) setSavedResumes(list);
        setStatusMsg('✓ CV securely saved to your SHANORA account!');
      }
    } catch (err) {
      setStatusMsg('✓ Saved to local browser backup.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedCv = (item) => {
    setCurrentResumeId(item.id);
    setCvTitle(item.title);
    setSelectedTemplate(item.template_id || 'free-classic');
    setCvStandard(item.cv_standard || 'international');
    if (item.cv_data) setCvData((prev) => ({ ...prev, ...item.cv_data }));
    if (Array.isArray(item.section_order)) setSectionOrder(item.section_order);
    setStatusMsg(`✓ Loaded "${item.title}"`);
  };

  const handleDownloadPDF = () => {
    if (isDownloadLocked) {
      alert(`🔒 "${activeTemplateObj.name}" is an exclusive SHANORA PRO template!\n\nYou can preview and edit all fields, but downloading this PRO template requires SHANORA PRO. Switch to a Free template (1-4) to download for free, or upgrade to PRO!`);
      if (typeof navigateToTab === 'function') navigateToTab('pro');
      return;
    }

    if (!a4SheetRef.current) return;
    const cvHtml = a4SheetRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=950,height=1150');

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cvData.fullName} - ${cvTitle}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              color: #0f172a;
              line-height: 1.45;
            }
            a { color: inherit; text-decoration: underline; }
            .cv-sec-block { page-break-inside: avoid; break-inside: avoid; }
          </style>
        </head>
        <body>
          <div>${cvHtml}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderOrderedMainSections = (accent) => {
    return sectionOrder.map((secKey) => {
      switch (secKey) {
        case 'summary':
          if (!cvData.summary && !cvData.careerObjective) return null;
          return (
            <div key="summary" className="cv-sec-block" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                {cvStandard === 'european' ? 'Personal Profile & Career Objective' : 'Executive Summary'}
              </h3>
              {cvData.summary && <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.6', margin: '0 0 0.4rem 0', wordBreak: 'break-word' }}>{cvData.summary}</p>}
              {cvData.careerObjective && <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.55', margin: 0, fontStyle: 'italic' }}><b>Objective:</b> {cvData.careerObjective}</p>}
            </div>
          );

        case 'experience':
          if (!cvData.experiences || cvData.experiences.length === 0) return null;
          return (
            <div key="experience" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.6rem' }}>
                Work Experience
              </h3>
              {cvData.experiences.map((exp) => (
                <div key={exp.id} className="cv-sec-block" style={{ marginBottom: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>{exp.jobTitle}</span>
                    <span style={{ fontSize: '0.76rem', fontWeight: '700', color: accent }}>{exp.startDate} – {exp.endDate || 'Present'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }}>
                    {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                  </div>
                  {exp.responsibilities && (
                    <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.55', whiteSpace: 'pre-line', marginBottom: '0.2rem' }}>
                      {exp.responsibilities}
                    </div>
                  )}
                  {exp.achievements && (
                    <div style={{ fontSize: '0.8rem', color: '#1e293b', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                      <b>Key Achievements:</b> {exp.achievements}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );

        case 'education':
          if (!cvData.educations || cvData.educations.length === 0) return null;
          return (
            <div key="education" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.6rem' }}>
                Education & Academic Qualifications
              </h3>
              {cvData.educations.map((edu) => (
                <div key={edu.id} className="cv-sec-block" style={{ marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#0f172a' }}>{edu.degree}</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>{edu.institution}{edu.location ? `, ${edu.location}` : ''}</div>
                  </div>
                  <div style={{ fontSize: '0.76rem', fontWeight: '700', color: accent }}>
                    {edu.startYear ? `${edu.startYear} – ` : ''}{edu.gradYear}
                  </div>
                </div>
              ))}
            </div>
          );

        case 'skills':
          if (!cvData.technicalSkills && !cvData.softSkills) return null;
          return (
            <div key="skills" className="cv-sec-block" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                Technical & Soft Skills
              </h3>
              {cvData.technicalSkills && (
                <p style={{ fontSize: '0.82rem', color: '#334155', margin: '0 0 0.35rem 0', lineHeight: '1.55' }}>
                  <b>Technical Skills:</b> {cvData.technicalSkills}
                </p>
              )}
              {cvData.softSkills && (
                <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0, lineHeight: '1.55' }}>
                  <b>Soft Skills:</b> {cvData.softSkills}
                </p>
              )}
            </div>
          );

        case 'projects':
          if (!cvData.projects || cvData.projects.length === 0 || !cvData.projects[0]?.name) return null;
          return (
            <div key="projects" className="cv-sec-block" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                Key Projects
              </h3>
              {cvData.projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: '0.55rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a' }}>
                    {proj.name}{' '}
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.76rem', color: accent, fontWeight: '600' }}>
                        ({proj.url})
                      </a>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.5' }}>{proj.description}</div>
                </div>
              ))}
            </div>
          );

        case 'certifications':
          if (!cvData.certifications) return null;
          return (
            <div key="certifications" className="cv-sec-block" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                Certifications & Professional Training
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0, lineHeight: '1.55', whiteSpace: 'pre-line' }}>{cvData.certifications}</p>
            </div>
          );

        case 'languages':
          if (!cvData.languagesList || cvData.languagesList.length === 0) return null;
          return (
            <div key="languages" className="cv-sec-block" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                Languages
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: '#334155' }}>
                {cvData.languagesList.map((l) => (
                  <span key={l.id}><b>{l.name}:</b> {l.level}</span>
                ))}
              </div>
            </div>
          );

        case 'achievements':
          if (!cvData.achievements) return null;
          return (
            <div key="achievements" className="cv-sec-block" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                Achievements & Awards
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0, lineHeight: '1.55', whiteSpace: 'pre-line' }}>{cvData.achievements}</p>
            </div>
          );

        case 'references':
          if (!cvData.references) return null;
          return (
            <div key="references" className="cv-sec-block" style={{ marginBottom: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                Professional References
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0, lineHeight: '1.55', whiteSpace: 'pre-line' }}>{cvData.references}</p>
            </div>
          );

        case 'additional':
          if (!cvData.drivingLicence && !cvData.availability && !cvData.relocate && !cvData.otherInfo) return null;
          return (
            <div key="additional" className="cv-sec-block" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                Additional Information
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.6' }}>
                {cvData.availability && <div><b>Availability:</b> {cvData.availability}</div>}
                {cvData.relocate && <div><b>Willingness to Relocate:</b> {cvData.relocate}</div>}
                {cvData.drivingLicence && <div><b>Driving Licence:</b> {cvData.drivingLicence}</div>}
                {cvData.otherInfo && <div><b>Notes:</b> {cvData.otherInfo}</div>}
              </div>
            </div>
          );

        default:
          return null;
      }
    });
  };

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
              <div style={{ color: '#334155' }}>• {cvData.experiences[0]?.jobTitle || 'Senior Specialist'}</div>
              <div style={{ color: '#64748b' }}>• {cvData.educations[0]?.degree || 'Qualification'}</div>
            </div>
            <div style={{ backgroundColor: tmpl.subBg, padding: '4px', borderRadius: '4px' }}>
              <div style={{ fontWeight: '800', color: tmpl.accent, marginBottom: '2px' }}>SKILLS</div>
              {techSkillList.slice(0, 2).map((s, i) => <div key={i}>■ {s}</div>)}
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
          {cvData.languagesList.slice(0, 2).map((l) => <div key={l.id}>{l.name} ●●●●</div>)}
          <div style={{ fontWeight: '800', color: isRight ? '#fff' : tmpl.accent, marginTop: '5px', marginBottom: '2px' }}>SKILLS</div>
          {techSkillList.slice(0, 3).map((s, i) => <div key={i}>■ {s}</div>)}
        </div>
        <div style={{ width: '62%', padding: '8px 6px', backgroundColor: '#fff' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: '900', color: tmpl.accent }}>{cvData.fullName}</div>
          <div style={{ fontSize: '0.4rem', color: '#64748b', marginBottom: '5px' }}>{cvData.headline}</div>
          <div style={{ fontSize: '0.42rem', fontWeight: '800', color: tmpl.accent, borderBottom: '1px solid #e2e8f0', marginBottom: '3px' }}>EMPLOYMENT</div>
          <div style={{ fontSize: '0.38rem', color: '#334155', marginBottom: '4px' }}>• {cvData.experiences[0]?.jobTitle || 'Role'}</div>
          <div style={{ fontSize: '0.42rem', fontWeight: '800', color: tmpl.accent, borderBottom: '1px solid #e2e8f0', marginBottom: '3px' }}>EDUCATION</div>
          <div style={{ fontSize: '0.38rem', color: '#334155' }}>{cvData.educations[0]?.degree || 'Degree'}</div>
        </div>
      </div>
    );
  };

  const renderFullA4Template = () => {
    const v = activeTemplateObj.variant;
    const accent = activeTemplateObj.accent;
    const subBg = activeTemplateObj.subBg;

    const renderAvatarOrCrest = (darkBg = false) => {
      if (cvData.showPhoto && cvData.photoUrl && cvStandard !== 'ats') {
        return (
          <img
            src={cvData.photoUrl}
            alt={cvData.fullName}
            style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${darkBg ? '#fff' : accent}`, flexShrink: 0 }}
          />
        );
      }
      return (
        <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: darkBg ? 'rgba(255,255,255,0.2)' : accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.15rem', flexShrink: 0 }}>
          {initials}
        </div>
      );
    };

    const renderClickableContactBlock = (alignRight = false, lightText = false) => (
      <div style={{ textAlign: alignRight ? 'right' : 'left', fontSize: '0.8rem', color: lightText ? '#f1f5f9' : '#475569', lineHeight: '1.55' }}>
        {cvData.email && (
          <div>
            ✉️ <a href={`mailto:${cvData.email}`} style={{ color: 'inherit' }}>{cvData.email}</a>
          </div>
        )}
        {cvData.phone && <div>📞 {cvData.phone}{cvData.whatsapp && cvData.whatsapp !== cvData.phone ? ` | WhatsApp: ${cvData.whatsapp}` : ''}</div>}
        {cvData.location && <div>📍 {cvData.location}</div>}
        {cvData.linkedin && (
          <div>
            🔗 <a href={cvData.linkedin.startsWith('http') ? cvData.linkedin : `https://${cvData.linkedin}`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>LinkedIn Profile</a>
          </div>
        )}
        {cvData.portfolio && (
          <div>
            🌐 <a href={cvData.portfolio.startsWith('http') ? cvData.portfolio : `https://${cvData.portfolio}`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>Portfolio / Website</a>
          </div>
        )}
      </div>
    );

    if ((v === 'pro-left-sidebar' || v === 'pro-right-sidebar') && cvStandard !== 'ats') {
      const isRight = v === 'pro-right-sidebar';
      return (
        <div style={{ display: 'flex', flexDirection: isRight ? 'row-reverse' : 'row', minHeight: '842px', backgroundColor: '#ffffff', color: '#0f172a' }}>
          <div style={{
            width: '33%',
            backgroundColor: isRight ? accent : subBg,
            color: isRight ? '#ffffff' : '#1e293b',
            borderLeft: isRight ? 'none' : `10px solid ${accent}`,
            padding: '2rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {renderAvatarOrCrest(isRight)}
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.85 }}>{cvStandard.toUpperCase()} STANDARD</div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800' }}>SHANORA CV</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: isRight ? '#93c5fd' : accent, textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: `1px solid ${isRight ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`, paddingBottom: '0.25rem' }}>
                Contact Details
              </h4>
              {renderClickableContactBlock(false, isRight)}
            </div>

            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: isRight ? '#93c5fd' : accent, textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: `1px solid ${isRight ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`, paddingBottom: '0.25rem' }}>
                Languages
              </h4>
              {cvData.languagesList.map((lang) => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <span>{lang.name}</span>
                  <span style={{ fontWeight: '700', color: isRight ? '#bfdbfe' : accent }}>{lang.level}</span>
                </div>
              ))}
            </div>

            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: isRight ? '#93c5fd' : accent, textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: `1px solid ${isRight ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`, paddingBottom: '0.25rem' }}>
                Core Skills
              </h4>
              {allSkillsCombined.map((skill, idx) => (
                <div key={idx} style={{ fontSize: '0.78rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: isRight ? '#93c5fd' : accent }}>■</span> {skill}
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: '67%', padding: '2.2rem 2rem', backgroundColor: '#ffffff' }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: `2px solid ${accent}`, paddingBottom: '0.9rem' }}>
              <h1 style={{ fontSize: '1.95rem', fontWeight: '900', color: accent, margin: '0 0 0.25rem 0' }}>{cvData.fullName}</h1>
              <p style={{ fontSize: '1.02rem', fontWeight: '700', color: '#475569', margin: 0 }}>{cvData.headline}</p>
            </div>
            {renderOrderedMainSections(accent)}
          </div>
        </div>
      );
    }

    if ((v === 'pro-top-banner' || v === 'pro-titan-dark') && cvStandard !== 'ats') {
      return (
        <div style={{ minHeight: '842px', backgroundColor: '#ffffff', color: '#0f172a' }}>
          <div style={{ backgroundColor: accent, color: '#ffffff', padding: '2rem 2.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: v === 'pro-titan-dark' ? '4px solid #38bdf8' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
              {renderAvatarOrCrest(true)}
              <div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: '900', margin: '0 0 0.2rem 0' }}>{cvData.fullName.toUpperCase()}</h1>
                <p style={{ fontSize: '0.98rem', color: v === 'pro-titan-dark' ? '#38bdf8' : '#e2e8f0', fontWeight: '700', margin: 0 }}>{cvData.headline}</p>
              </div>
            </div>
            {renderClickableContactBlock(true, true)}
          </div>
          <div style={{ padding: '2rem 2.2rem' }}>
            {renderOrderedMainSections(accent)}
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '842px', backgroundColor: v === 'pro-luxury-crest' ? '#fffbeb' : '#ffffff', padding: v === 'pro-luxury-crest' ? '1.5rem' : '0', color: '#0f172a', textAlign: v === 'free-center' ? 'center' : 'left' }}>
        {v === 'free-topbar' && <div style={{ height: '10px', backgroundColor: accent }} />}
        <div style={{ border: v === 'pro-luxury-crest' ? `3px double ${accent}` : 'none', backgroundColor: '#ffffff', minHeight: '810px' }}>
          <div style={{
            padding: '2rem 2.2rem',
            borderBottom: `3px solid ${accent}`,
            backgroundColor: v === 'free-box' ? '#f8fafc' : '#ffffff',
            display: 'flex',
            flexDirection: v === 'free-center' ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: v === 'free-center' ? 'center' : 'flex-start',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: v === 'free-center' ? 'column' : 'row' }}>
              {cvData.showPhoto && cvData.photoUrl && cvStandard !== 'ats' && (
                <img src={cvData.photoUrl} alt={cvData.fullName} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}` }} />
              )}
              <div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: accent, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>{cvData.fullName}</h1>
                <p style={{ fontSize: '0.98rem', fontWeight: '700', color: '#0284c7', margin: 0 }}>{cvData.headline}</p>
              </div>
            </div>
            {renderClickableContactBlock(v !== 'free-center', false)}
          </div>

          <div style={{ padding: '1.8rem 2.2rem', textAlign: 'left' }}>
            {renderOrderedMainSections(accent)}
          </div>
        </div>
      </div>
    );
  };

  const inputStyle = {
    width: '100%',
    padding: '0.55rem 0.7rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#070b14',
    color: '#fff',
    fontSize: '0.82rem',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '0.73rem',
    color: '#94a3b8',
    fontWeight: '700',
    display: 'block',
    marginBottom: '4px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', padding: '0.8rem 0' }}>
      
      {/* 1. EXECUTIVE DASHBOARD HEADER & SAVED CVS BAR */}
      <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '16px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                SHANORA Professional CV Studio 📄
              </h2>
              <span style={{ backgroundColor: isUserPro ? '#eab308' : '#0284c7', color: isUserPro ? '#000' : '#fff', fontSize: '0.68rem', fontWeight: '900', padding: '3px 8px', borderRadius: '999px' }}>
                {isUserPro ? 'PRO UNLOCKED ⭐' : 'FREE TIER'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
              International, European & ATS-Compliant Resume System • 4 Free & 8 PRO Executive Templates
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowWizard(!showWizard)}
              style={{ backgroundColor: showWizard ? '#22c55e' : '#1e293b', color: '#fff', border: '1px solid #38bdf8', padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {showWizard ? '✓ Hide Step-by-Step Builder' : '✏️ Open 8-Step CV Builder'}
            </button>

            <button
              type="button"
              onClick={() => handleSaveCvToDatabase(false)}
              disabled={isSaving}
              style={{ backgroundColor: '#0f766e', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {isSaving ? 'Saving...' : '💾 Save CV'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              style={{ backgroundColor: isDownloadLocked ? '#7c3aed' : '#0284c7', color: '#fff', border: 'none', padding: '0.6rem 1.15rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)' }}
            >
              {isDownloadLocked ? '🔒 Unlock PRO to Download PDF' : '🖨️ Download A4 PDF'}
            </button>
          </div>
        </div>

        {/* CV Version Management & International Standards Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.8rem', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>CV Name:</span>
            <input
              value={cvTitle}
              onChange={(e) => setCvTitle(e.target.value)}
              style={{ ...inputStyle, width: '180px', padding: '0.38rem 0.6rem' }}
              placeholder="e.g. IT Support CV"
            />
            {savedResumes.length > 0 && (
              <select
                onChange={(e) => {
                  const found = savedResumes.find((r) => r.id === e.target.value);
                  if (found) handleLoadSavedCv(found);
                }}
                value={currentResumeId || ''}
                style={{ ...inputStyle, width: '175px', padding: '0.38rem 0.6rem' }}
              >
                <option value="">📂 Saved CVs ({savedResumes.length})</option>
                {savedResumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => handleSaveCvToDatabase(true)}
              style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '0.38rem 0.7rem', borderRadius: '8px', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}
            >
              + Save as New Version {isUserPro ? '' : '(PRO)'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>Standard:</span>
            {[
              { id: 'international', label: '🌐 International CV' },
              { id: 'european', label: '🇪🇺 European CV' },
              { id: 'ats', label: '🤖 ATS-Friendly' }
            ].map((std) => (
              <button
                key={std.id}
                type="button"
                onClick={() => setCvStandard(std.id)}
                style={{
                  backgroundColor: cvStandard === std.id ? '#0284c7' : '#070b14',
                  color: '#fff',
                  border: '1px solid #334155',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.73rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {std.label}
              </button>
            ))}
          </div>
        </div>

        {statusMsg && (
          <div style={{ backgroundColor: '#070b14', border: '1px solid #0284c7', color: '#38bdf8', padding: '0.5rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}>
            {statusMsg}
          </div>
        )}
      </div>

      {/* 2. PRESERVED 12 TEMPLATES HORIZONTAL CAROUSEL */}
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Step 1: Select or Switch CV Template (Preserves All Entered Data ↔️)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>
            Active: {activeTemplateObj.name} ({activeTemplateObj.type})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.1rem', overflowX: 'auto', paddingBottom: '0.9rem', scrollSnapType: 'x mandatory' }}>
          {templates.map((tmpl) => {
            const isPro = tmpl.type === 'Pro';
            const isSelected = selectedTemplate === tmpl.id;

            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                style={{
                  minWidth: '230px',
                  maxWidth: '230px',
                  height: '315px',
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
                  cursor: 'pointer'
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
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      width: '90%'
                    }}
                  >
                    {isSelected ? '✓ Selected' : (isPro ? 'Preview PRO CV' : 'Use Free Template')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. STEP-BY-STEP CV CREATION WIZARD (ALL 12 INTERNATIONAL SECTIONS + AI) */}
      {showWizard && (
        <div style={{ backgroundColor: '#0f172a', border: '2px solid #0284c7', borderRadius: '16px', padding: '1.35rem' }}>
          
          {/* Progress Indicator Bar */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.8rem', marginBottom: '1.1rem', borderBottom: '1px solid #1e293b' }}>
            {steps.map((st) => (
              <button
                key={st.num}
                type="button"
                onClick={() => setActiveStep(st.num)}
                style={{
                  backgroundColor: activeStep === st.num ? '#0284c7' : '#070b14',
                  color: activeStep === st.num ? '#fff' : '#94a3b8',
                  border: '1px solid #334155',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {activeStep === 1 && (
            <div>
              <h4 style={{ color: '#38bdf8', margin: '0 0 0.6rem 0', fontSize: '0.92rem' }}>Step 1: Template & International Formatting Standard</h4>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 0.8rem 0' }}>
                Following international privacy and anti-discrimination standards, fields like CNIC, Father&apos;s Name, Religion, Marital Status, and Passport Number are excluded.
              </p>
              <button type="button" onClick={() => setActiveStep(2)} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>
                Continue to Step 2: Personal Info →
              </button>
            </div>
          )}

          {activeStep === 2 && (
            <div>
              <h4 style={{ color: '#38bdf8', margin: '0 0 0.8rem 0', fontSize: '0.92rem' }}>Step 2: Personal & Contact Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.8rem' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle} value={cvData.fullName} onChange={(e) => setCvData({ ...cvData, fullName: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Professional Job Title *</label>
                  <input style={inputStyle} value={cvData.headline} onChange={(e) => setCvData({ ...cvData, headline: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input style={inputStyle} value={cvData.email} onChange={(e) => setCvData({ ...cvData, email: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input style={inputStyle} value={cvData.phone} onChange={(e) => setCvData({ ...cvData, phone: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp Number</label>
                  <input style={inputStyle} value={cvData.whatsapp} onChange={(e) => setCvData({ ...cvData, whatsapp: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>City and Country *</label>
                  <input style={inputStyle} value={cvData.location} onChange={(e) => setCvData({ ...cvData, location: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>LinkedIn Profile URL</label>
                  <input style={inputStyle} placeholder="linkedin.com/in/username" value={cvData.linkedin} onChange={(e) => setCvData({ ...cvData, linkedin: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Portfolio / Website URL</label>
                  <input style={inputStyle} placeholder="https://yourportfolio.com" value={cvData.portfolio} onChange={(e) => setCvData({ ...cvData, portfolio: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Optional Photograph</label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                  <label style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                    <input type="checkbox" checked={cvData.showPhoto} onChange={(e) => setCvData({ ...cvData, showPhoto: e.target.checked })} />
                    Display photo on CV (Hidden in ATS mode)
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '0.92rem' }}>Step 3: Professional Summary & Career Objective</h4>
                <button
                  type="button"
                  onClick={handleAiGenerateSummary}
                  style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  🤖 AI Generate Summary (From Your Facts)
                </button>
              </div>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={labelStyle}>Professional Introduction / Executive Summary</label>
                <textarea rows={3} style={inputStyle} value={cvData.summary} onChange={(e) => setCvData({ ...cvData, summary: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Career Objective (Optional)</label>
                <textarea rows={2} style={inputStyle} placeholder="Optional targeted career objective..." value={cvData.careerObjective} onChange={(e) => setCvData({ ...cvData, careerObjective: e.target.value })} />
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '0.92rem' }}>Step 4: Work Experience</h4>
                <button
                  type="button"
                  onClick={() =>
                    setCvData((prev) => ({
                      ...prev,
                      experiences: [
                        ...prev.experiences,
                        { id: `exp-${Date.now()}`, jobTitle: '', company: '', location: '', startDate: '', endDate: 'Present', responsibilities: '', achievements: '' }
                      ]
                    }))
                  }
                  style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  + Add Another Experience
                </button>
              </div>

              {cvData.experiences.map((exp, idx) => (
                <div key={exp.id} style={{ backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', marginBottom: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff' }}>Position #{idx + 1}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleAiPolishExperience(idx)}
                        style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '4px 9px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        ✨ AI Polish Bullet Points
                      </button>
                      {cvData.experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCvData((prev) => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== idx) }))}
                          style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 9px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginBottom: '0.65rem' }}>
                    <input style={inputStyle} placeholder="Job Title" value={exp.jobTitle} onChange={(e) => { const list = [...cvData.experiences]; list[idx].jobTitle = e.target.value; setCvData({ ...cvData, experiences: list }); }} />
                    <input style={inputStyle} placeholder="Company Name" value={exp.company} onChange={(e) => { const list = [...cvData.experiences]; list[idx].company = e.target.value; setCvData({ ...cvData, experiences: list }); }} />
                    <input style={inputStyle} placeholder="Location" value={exp.location} onChange={(e) => { const list = [...cvData.experiences]; list[idx].location = e.target.value; setCvData({ ...cvData, experiences: list }); }} />
                    <input style={inputStyle} placeholder="Start Date (e.g. 2021)" value={exp.startDate} onChange={(e) => { const list = [...cvData.experiences]; list[idx].startDate = e.target.value; setCvData({ ...cvData, experiences: list }); }} />
                    <input style={inputStyle} placeholder="End Date (or Present)" value={exp.endDate} onChange={(e) => { const list = [...cvData.experiences]; list[idx].endDate = e.target.value; setCvData({ ...cvData, experiences: list }); }} />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={labelStyle}>Job Responsibilities</label>
                    <textarea rows={2} style={inputStyle} value={exp.responsibilities} onChange={(e) => { const list = [...cvData.experiences]; list[idx].responsibilities = e.target.value; setCvData({ ...cvData, experiences: list }); }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Key Achievements</label>
                    <textarea rows={2} style={inputStyle} value={exp.achievements} onChange={(e) => { const list = [...cvData.experiences]; list[idx].achievements = e.target.value; setCvData({ ...cvData, experiences: list }); }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeStep === 5 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '0.92rem' }}>Step 5: Education & Qualifications</h4>
                <button
                  type="button"
                  onClick={() =>
                    setCvData((prev) => ({
                      ...prev,
                      educations: [...prev.educations, { id: `edu-${Date.now()}`, degree: '', institution: '', location: '', startYear: '', gradYear: '' }]
                    }))
                  }
                  style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  + Add Qualification
                </button>
              </div>

              {cvData.educations.map((edu, idx) => (
                <div key={edu.id} style={{ backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
                    <input style={inputStyle} placeholder="Degree / Qualification" value={edu.degree} onChange={(e) => { const list = [...cvData.educations]; list[idx].degree = e.target.value; setCvData({ ...cvData, educations: list }); }} />
                    <input style={inputStyle} placeholder="Institution Name" value={edu.institution} onChange={(e) => { const list = [...cvData.educations]; list[idx].institution = e.target.value; setCvData({ ...cvData, educations: list }); }} />
                    <input style={inputStyle} placeholder="Location" value={edu.location} onChange={(e) => { const list = [...cvData.educations]; list[idx].location = e.target.value; setCvData({ ...cvData, educations: list }); }} />
                    <input style={inputStyle} placeholder="Start Year" value={edu.startYear} onChange={(e) => { const list = [...cvData.educations]; list[idx].startYear = e.target.value; setCvData({ ...cvData, educations: list }); }} />
                    <input style={inputStyle} placeholder="Graduation Year" value={edu.gradYear} onChange={(e) => { const list = [...cvData.educations]; list[idx].gradYear = e.target.value; setCvData({ ...cvData, educations: list }); }} />
                  </div>
                  {cvData.educations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCvData((prev) => ({ ...prev, educations: prev.educations.filter((_, i) => i !== idx) }))}
                      style={{ marginTop: '0.5rem', backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      Remove Qualification
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '0.92rem' }}>Step 6: Skills, Certifications, Languages, Projects & More</h4>
                <button
                  type="button"
                  onClick={handleAiSuggestSkills}
                  style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  🤖 Suggest Skills for My Title
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem' }}>
                <div>
                  <label style={labelStyle}>5. Technical Skills (Comma separated)</label>
                  <textarea rows={2} style={inputStyle} value={cvData.technicalSkills} onChange={(e) => setCvData({ ...cvData, technicalSkills: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>6. Soft Skills (Comma separated)</label>
                  <textarea rows={2} style={inputStyle} value={cvData.softSkills} onChange={(e) => setCvData({ ...cvData, softSkills: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>7. Certifications & Professional Training</label>
                <textarea rows={2} style={inputStyle} value={cvData.certifications} onChange={(e) => setCvData({ ...cvData, certifications: e.target.value })} />
              </div>

              <div style={{ backgroundColor: '#070b14', padding: '0.85rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={labelStyle}>8. Languages & Proficiency Levels</label>
                  <button
                    type="button"
                    onClick={() => setCvData((prev) => ({ ...prev, languagesList: [...prev.languagesList, { id: `lang-${Date.now()}`, name: '', level: 'Fluent' }] }))}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Add Language
                  </button>
                </div>
                {cvData.languagesList.map((lang, idx) => (
                  <div key={lang.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <input style={inputStyle} placeholder="Language (e.g. English)" value={lang.name} onChange={(e) => { const list = [...cvData.languagesList]; list[idx].name = e.target.value; setCvData({ ...cvData, languagesList: list }); }} />
                    <select style={inputStyle} value={lang.level} onChange={(e) => { const list = [...cvData.languagesList]; list[idx].level = e.target.value; setCvData({ ...cvData, languagesList: list }); }}>
                      {['Basic', 'Intermediate', 'Advanced', 'Fluent', 'Native'].map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                    {cvData.languagesList.length > 1 && (
                      <button type="button" onClick={() => setCvData((prev) => ({ ...prev, languagesList: prev.languagesList.filter((_, i) => i !== idx) }))} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0 10px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: '#070b14', padding: '0.85rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={labelStyle}>9. Key Projects (Name, Description & URL)</label>
                  <button
                    type="button"
                    onClick={() => setCvData((prev) => ({ ...prev, projects: [...prev.projects, { id: `proj-${Date.now()}`, name: '', description: '', url: '' }] }))}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Add Project
                  </button>
                </div>
                {cvData.projects.map((proj, idx) => (
                  <div key={proj.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <input style={inputStyle} placeholder="Project Name" value={proj.name} onChange={(e) => { const list = [...cvData.projects]; list[idx].name = e.target.value; setCvData({ ...cvData, projects: list }); }} />
                    <input style={inputStyle} placeholder="Project URL" value={proj.url} onChange={(e) => { const list = [...cvData.projects]; list[idx].url = e.target.value; setCvData({ ...cvData, projects: list }); }} />
                    <input style={inputStyle} placeholder="Short Description" value={proj.description} onChange={(e) => { const list = [...cvData.projects]; list[idx].description = e.target.value; setCvData({ ...cvData, projects: list }); }} />
                    <button type="button" onClick={() => setCvData((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }))} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0 10px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                <div>
                  <label style={labelStyle}>10. Achievements & Awards</label>
                  <textarea rows={2} style={inputStyle} value={cvData.achievements} onChange={(e) => setCvData({ ...cvData, achievements: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>11. Professional References</label>
                  <textarea rows={2} style={inputStyle} value={cvData.references} onChange={(e) => setCvData({ ...cvData, references: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                <div>
                  <label style={labelStyle}>Availability</label>
                  <input style={inputStyle} value={cvData.availability} onChange={(e) => setCvData({ ...cvData, availability: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Willingness to Relocate</label>
                  <input style={inputStyle} value={cvData.relocate} onChange={(e) => setCvData({ ...cvData, relocate: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Driving Licence (Optional)</label>
                  <input style={inputStyle} value={cvData.drivingLicence} onChange={(e) => setCvData({ ...cvData, drivingLicence: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Other Relevant Notes</label>
                  <input style={inputStyle} value={cvData.otherInfo} onChange={(e) => setCvData({ ...cvData, otherInfo: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {activeStep === 7 && (
            <div>
              <h4 style={{ color: '#38bdf8', margin: '0 0 0.6rem 0', fontSize: '0.92rem' }}>Step 7: Reorder CV Sections & Run ATS Check</h4>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.8rem' }}>
                Use the ↑ and ↓ arrows below to customize the exact order of sections on your live CV:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                {sectionOrder.map((sec, idx) => (
                  <div key={sec} style={{ backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fff', textTransform: 'capitalize' }}>
                      {idx + 1}. {sec}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => moveSection(idx, -1)} style={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>↑</button>
                      <button type="button" onClick={() => moveSection(idx, 1)} style={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>↓</button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRunAtsAnalysis}
                style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}
              >
                🔍 Run ATS Compatibility & Missing Info Analysis {isUserPro ? '' : '(PRO 🔒)'}
              </button>

              {atsReport && (
                <div style={{ marginTop: '0.9rem', backgroundColor: '#070b14', border: '1px solid #7c3aed', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#22c55e', marginBottom: '0.4rem' }}>
                    ATS Compatibility Score: {atsReport.score} / 100
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#38bdf8', margin: '0 0 0.5rem 0' }}>{atsReport.standardNote}</p>
                  {atsReport.missing.length > 0 ? (
                    <ul style={{ fontSize: '0.78rem', color: '#fca5a5', margin: 0, paddingLeft: '1.2rem' }}>
                      {atsReport.missing.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#22c55e' }}>✓ All core international & ATS sections are complete!</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeStep === 8 && (
            <div>
              <h4 style={{ color: '#38bdf8', margin: '0 0 0.8rem 0', fontSize: '0.92rem' }}>Step 8: Download Official PDF, Save CV & Generate Cover Letter</h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                <button type="button" onClick={() => handleSaveCvToDatabase(false)} style={{ backgroundColor: '#0f766e', color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                  💾 Save CV to Account
                </button>
                <button type="button" onClick={handleDownloadPDF} style={{ backgroundColor: isDownloadLocked ? '#7c3aed' : '#0284c7', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                  {isDownloadLocked ? '🔒 Unlock PRO to Download PDF' : '🖨️ Download A4 PDF Now'}
                </button>
              </div>

              <div style={{ backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '12px', padding: '1rem' }}>
                <h5 style={{ color: '#fff', margin: '0 0 0.6rem 0', fontSize: '0.86rem' }}>
                  ✉️ AI Customized Cover Letter Generator {isUserPro ? '(PRO Active)' : '(PRO 🔒)'}
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', marginBottom: '0.6rem' }}>
                  <input style={inputStyle} placeholder="Target Job Title (e.g. IT Specialist)" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
                  <input style={inputStyle} placeholder="Target Company Name" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} />
                  <button type="button" onClick={handleGenerateCoverLetter} style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1rem', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer' }}>
                    🤖 Generate Cover Letter
                  </button>
                </div>
                {coverLetter && (
                  <textarea rows={7} style={{ ...inputStyle, marginTop: '0.5rem' }} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. FULL-SIZE REAL-TIME A4 CV PREVIEW */}
      <div ref={previewRef} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.5)' }}>
        <div style={{
          backgroundColor: isDownloadLocked ? '#7c3aed' : '#0284c7',
          color: '#fff',
          padding: '0.7rem 1.2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>
            {isDownloadLocked
              ? `✨ Live Preview: "${activeTemplateObj.name}" (PRO) — Upgrade to Download PDF`
              : `✅ Live Preview: "${activeTemplateObj.name}" (${cvStandard.toUpperCase()} Standard)`}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowWizard(!showWizard)}
              style={{ backgroundColor: '#ffffff', color: '#0f172a', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '900', cursor: 'pointer' }}
            >
              {showWizard ? 'Hide Editor' : '✏️ Edit All 12 Sections'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              style={{ backgroundColor: isDownloadLocked ? '#eab308' : '#22c55e', color: isDownloadLocked ? '#000' : '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '900', cursor: 'pointer' }}
            >
              {isDownloadLocked ? '🔒 Unlock PRO PDF' : '🖨️ Download PDF'}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', backgroundColor: '#cbd5e1' }}>
          <div ref={a4SheetRef} style={{ minWidth: '720px', maxWidth: '920px', margin: '0 auto', backgroundColor: '#ffffff' }}>
            {renderFullA4Template()}
          </div>
        </div>
      </div>

    </div>
  );
}
