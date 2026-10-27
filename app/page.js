'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [degree, setDegree] = useState('');
  const [interest, setInterest] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [copied, setCopied] = useState(false);

  const [opportunities, setOpportunities] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All');

  // WhatsApp Alert Form States
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subCity, setSubCity] = useState('Karachi');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;
        if (data) setOpportunities(data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoadingJobs(false);
      }
    }
    fetchOpportunities();
  }, []);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!degree.trim() || !interest.trim()) return;

    setLoadingRoadmap(true);

    setTimeout(() => {
      const intr = interest.toLowerCase();

      let targetRoles = [
        `${interest} Specialist`,
        'Associate Solutions Analyst',
        'Junior Technical Consultant'
      ];
      let coreSkills = ['Problem Solving & DSA', 'Modern Frameworks', 'Git & GitHub Workflows', 'Database Design'];
      let targetCompanies = 'Systems Limited, Contour Software, Jazz, Techlogix, 10Pearls, Folio3';
      let entryCertifications = ['AWS Certified Cloud Practitioner', 'Google Professional Certificate'];

      if (intr.includes('ai') || intr.includes('data') || intr.includes('machine learning')) {
        targetRoles = ['Associate Data Scientist', 'AI / ML Engineer Intern', 'Business Intelligence Analyst'];
        coreSkills = ['Python / PyTorch', 'SQL & Data Wrangling', 'Prompt Engineering & LLM APIs', 'Model Deployment'];
        targetCompanies = 'Systems Ltd, Afiniti, Arbisoft, Jazz xplr, VentureDive';
        entryCertifications = ['DeepLearning.AI GenAI', 'IBM Data Science Professional'];
      } else if (intr.includes('web') || intr.includes('frontend') || intr.includes('backend') || intr.includes('full stack')) {
        targetRoles = ['Full-Stack Developer (MERN / Next.js)', 'Frontend Engineer', 'Backend API Specialist'];
        coreSkills = ['React / Next.js', 'Node.js & Supabase', 'REST & GraphQL APIs', 'Tailwind CSS'];
        targetCompanies = 'Contour Software, Devsinc, Educative, Netsol, Remote Startups';
        entryCertifications = ['Meta Front-End / Back-End Professional', 'FreeCodeCamp Full Stack'];
      } else if (intr.includes('cyber') || intr.includes('security') || intr.includes('network')) {
        targetRoles = ['Information Security Analyst', 'SOC Analyst (L1)', 'Network Security Associate'];
        coreSkills = ['TCP/IP & OSI Protocols', 'SIEM & Wireshark Analysis', 'Linux Administration'];
        targetCompanies = 'State Bank of Pakistan, Nayatel, Jazz, Commercial Banks (HBL/UBL IT)';
        entryCertifications = ['CompTIA Security+', 'ISC2 Certified in Cybersecurity'];
      }

      setRoadmap({
        targetRoles,
        coreSkills,
        targetCompanies,
        entryCertifications,
        degreeTitle: degree,
        interestArea: interest
      });

      setLoadingRoadmap(false);
      setCopied(false);
    }, 500);
  };

  const copyRoadmap = () => {
    if (!roadmap) return;
    const text = `SHANORA Career Roadmap\nDegree: ${roadmap.degreeTitle}\nFocus: ${roadmap.interestArea}\n\nTop Roles:\n${roadmap.targetRoles.map(r => `• ${r}`).join('\n')}\n\nSkills to Master:\n${roadmap.coreSkills.join(', ')}\n\nPakistani Employers:\n${roadmap.targetCompanies}\n\nCertifications:\n${roadmap.entryCertifications.join(' | ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subPhone.trim()) return;

    setSubmittingLead(true);
    try {
      const { error } = await supabase.from('subscribers').insert([
        {
          name: subName.trim() || 'Graduate Student',
          phone: subPhone.trim(),
          city: subCity,
          target_role: interest.trim() || degree.trim() || 'General Graduate'
        }
      ]);

      if (error) throw error;
      setLeadSuccess(true);
    } catch (err) {
      alert('Registration mein masla aya. Baraye mehrbani dobara check karein.');
      console.error(err);
    } finally {
      setSubmittingLead(false);
    }
  };

  const cities = ['All', 'Karachi', 'Lahore', 'Islamabad'];

  const filteredOpportunities = opportunities.filter((item) => {
    if (selectedCity === 'All') return true;
    return item.location && item.location.toLowerCase().includes(selectedCity.toLowerCase());
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '2.5rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            Pakistan Talent Accelerator 🇵🇰
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
            SHANORA
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.5', margin: 0 }}>
            Curated Career Blueprints & Real-Time Verified Opportunities for Pakistani Graduates
          </p>
        </header>

        {/* Input Form Card */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎯</span> Build Your Strategic Roadmap
          </h2>
          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.35rem' }}>Your Degree / Background</label>
              <input
                type="text"
                placeholder="e.g. BS Computer Science, BBA, Electrical Engg"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.35rem' }}>Target Specialty / Focus Area</label>
              <input
                type="text"
                placeholder="e.g. Web Development, AI, Cyber Security, Fintech"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                required
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loadingRoadmap}
              style={{ width: '100%', padding: '0.9rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)' }}
            >
              {loadingRoadmap ? 'Generating Blueprint...' : 'Generate Career Roadmap'}
            </button>
          </form>

          {/* Generated Roadmap Result */}
          {roadmap && (
            <div style={{ marginTop: '1.75rem', padding: '1.5rem', backgroundColor: '#0a0f1d', borderRadius: '12px', border: '1px solid #1e293b', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tailored Blueprint</span>
                <button
                  type="button"
                  onClick={copyRoadmap}
                  style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Plan'}
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem', marginBottom: '0.35rem' }}>Primary Career Roles:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  {roadmap.targetRoles.map((role, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{role}</li>)}
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem', marginBottom: '0.35rem' }}>Priority Skill Matrix:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {roadmap.coreSkills.map((sk, idx) => (
                    <span key={idx} style={{ backgroundColor: '#1e293b', color: '#38bdf8', fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>{sk}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Recommended Validations:</strong>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{roadmap.entryCertifications.join(' • ')}</p>
              </div>

              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Pakistani Market Target Employers:</strong>
                <p style={{ margin: 0, color: '#38bdf8', fontSize: '0.85rem' }}>{roadmap.targetCompanies}</p>
              </div>
            </div>
          )}
        </section>

        {/* Real-time Jobs Section */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                💼 Live Opportunities
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified openings in Pakistan tech & banking sectors</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '600' }}>Live Sync</span>
            </div>
          </div>

          {/* City Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  border: selectedCity === city ? '1px solid #38bdf8' : '1px solid #334155',
                  backgroundColor: selectedCity === city ? '#0284c7' : '#0a0f1d',
                  color: selectedCity === city ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.15s ease'
                }}
              >
                {city}
              </button>
            ))}
          </div>

          {loadingJobs ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Connecting to database...</p>
          ) : filteredOpportunities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredOpportunities.map((item) => (
                <div
                  key={item.id}
                  style={{ backgroundColor: '#0a0f1d', padding: '1.1rem 1.25rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: '600', color: '#f1f5f9' }}>{item.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <span style={{ color: '#38bdf8', fontWeight: '500' }}>{item.company}</span>
                      <span>•</span>
                      <span>📍 {item.location || 'Pakistan'}</span>
                    </div>
                  </div>
                  <a
                    href={item.apply_url || 'https://www.google.com/search?q=' + encodeURIComponent(item.company + ' ' + item.title + ' jobs pakistan')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.8rem', padding: '0.45rem 0.9rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)' }}
                  >
                    Apply Now ↗
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Is city mein abhi koi open role nahi mila.</p>
          )}
        </section>

        {/* WhatsApp Channel & Direct Alerts Section */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.75rem', borderRadius: '16px', border: '1px solid #22c55e', boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📲</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Shanora WhatsApp Career Community
            </h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
            Verified entry-level roles, paid internships, test dates (NTS/SBP/Banks), aur roadmap PDF guides foran apne phone par paane ke liye join karein.
          </p>

          {leadSuccess ? (
            <div style={{ backgroundColor: '#0a0f1d', padding: '1.5rem', borderRadius: '12px', border: '1px solid #22c55e', textAlign: 'center' }}>
              <div style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                🎉 Registration Successful!
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Aapka number Shanora alert list mein shamil ho chuka hai. Daily updates ke liye hamara official WhatsApp channel join karein:
              </p>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', backgroundColor: '#22c55e', color: '#090d16', fontWeight: '800', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.95rem' }}
              >
                Join WhatsApp Group / Channel Now ➔
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  style={{ flex: '1 1 200px', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', fontSize: '0.9rem', outline: 'none' }}
                />
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  style={{ flex: '0 1 120px', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', fontSize: '0.9rem', outline: 'none' }}
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Other">Other Cities</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="tel"
                  placeholder="WhatsApp Number (03xxxxxxxxx)"
                  value={subPhone}
                  onChange={(e) => setSubPhone(e.target.value)}
                  required
                  style={{ flex: '1 1 220px', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', fontSize: '0.9rem', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={submittingLead}
                  style={{ backgroundColor: '#22c55e', color: '#090d16', fontWeight: '700', padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {submittingLead ? 'Saving...' : 'Get Instant Alerts ⚡'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '2.5rem', color: '#64748b', fontSize: '0.8re
