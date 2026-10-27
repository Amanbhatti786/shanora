'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');

  // Job Posting States
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Lahore');
  const [type, setType] = useState('Fresh Graduate');
  const [applyLink, setApplyLink] = useState('');
  const [posting, setPosting] = useState(false);
  const [jobMessage, setJobMessage] = useState('');

  useEffect(() => {
    fetchRegisteredStudents();
  }, []);

  async function fetchRegisteredStudents() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching students:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!title || !company || !applyLink) {
      alert('Kripya tamaam fields fill karein.');
      return;
    }

    setPosting(true);
    setJobMessage('');

    try {
      const { error } = await supabase.from('jobs').insert([
        {
          title: title.trim(),
          company: company.trim(),
          location: location.trim(),
          type: type.trim(),
          apply_link: applyLink.trim(),
        }
      ]);

      if (error) throw error;

      setJobMessage('✅ Job kamyabi se Homepage par live ho gayi!');
      setTitle('');
      setCompany('');
      setApplyLink('');
      setTimeout(() => setJobMessage(''), 4000);
    } catch (err) {
      setJobMessage('❌ Error: ' + err.message);
    } finally {
      setPosting(false);
    }
  };

  const filteredStudents = profiles.filter((student) => {
    const q = searchTerm.toLowerCase();
    const matchesQuery =
      (student.full_name && student.full_name.toLowerCase().includes(q)) ||
      (student.degree && student.degree.toLowerCase().includes(q)) ||
      (student.target_role && student.target_role.toLowerCase().includes(q)) ||
      (student.university && student.university.toLowerCase().includes(q));

    const matchesCity =
      selectedCity === 'All' ||
      (student.city && student.city.toLowerCase().includes(selectedCity.toLowerCase()));

    return matchesQuery && matchesCity;
  });

  return (
    <main style={{ minHeight: '90vh', padding: '1.5rem 1rem', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            ADMIN ACCESS
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', margin: '0.4rem 0 0.2rem 0' }}>
            Shanora Operations & Directory
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Students oversight, candidate filtering aur nayi graduate jobs live post karein.
          </p>
        </div>

        <button
          onClick={fetchRegisteredStudents}
          style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Refresh Data 🔄
        </button>
      </div>

      {/* Post a New Job Form */}
      <div style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 0.4rem 0' }}>📢 Post a New Verified Opportunity</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1rem' }}>
          Yahan job add karein, yeh foran Homepage feed par tamam candidates ko nazar aane lagegi.
        </p>

        {jobMessage && (
          <div style={{ padding: '0.75rem', backgroundColor: '#0a0f1d', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
            {jobMessage}
          </div>
        )}

        <form onSubmit={handlePostJob} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Job Title</label>
            <input
              type="text"
              placeholder="e.g. Associate Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Company Name</label>
            <input
              type="text"
              placeholder="e.g. Netsol / Jazz / Meezan Bank"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Location / City</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
            >
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
              <option value="Faisalabad">Faisalabad</option>
              <option value="Peshawar">Peshawar</option>
              <option value="Multan">Multan</option>
              <option value="Sukkur">Sukkur</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Job Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
            >
              <option value="Fresh Graduate">Fresh Graduate</option>
              <option value="Internship">Internship</option>
              <option value="Entry-Level">Entry-Level</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Apply URL / Link</label>
            <input
              type="url"
              placeholder="https://company.com/apply"
              value={applyLink}
              onChange={(e) => setApplyLink(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              disabled={posting}
              style={{ backgroundColor: '#22c55e', color: '#090d16', border: 'none', padding: '0.7rem 1.25rem', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', width: '100%', fontSize: '0.9rem' }}
            >
              {posting ? 'Publishing Job...' : 'Publish Job to Feed 🚀'}
            </button>
          </div>
        </form>
      </div>

      {/* Directory Section Header */}
      <h2 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '0 0 0.8rem 0' }}>🎓 Registered Student Database</h2>

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by student name, degree or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
        />

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#fff', fontSize: '0.85rem' }}
        >
          <option value="All">All Cities</option>
          <option value="Lahore">Lahore</option>
          <option value="Karachi">Karachi</option>
          <option value="Islamabad">Islamabad</option>
          <option value="Rawalpindi">Rawalpindi</option>
          <option value="Peshawar">Peshawar</option>
          <option value="Faisalabad">Faisalabad</option>
          <option value="Multan">Multan</option>
          <option value="Sukkur">Sukkur</option>
        </select>
      </div>

      {/* Table Container */}
      <div style={{ backgroundColor: '#131b2e', borderRadius: '12px', border: '1px solid #1e293b', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading registered candidates...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Koi student profile match nahi hua.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#0a0f1d', color: '#94a3b8' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Student Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Degree / Institute</th>
                <th style={{ padding: '0.85rem 1rem' }}>City</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target Specialty</th>
                <th style={{ padding: '0.85rem 1rem' }}>WhatsApp</th>
                <th style={{ padding: '0.85rem 1rem' }}>Resume (CV)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((stu) => (
                <tr key={stu.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.85rem 1rem', color: '#ffffff', fontWeight: 'bold' }}>
                    {stu.full_name || 'Anonymous Student'}
                    {stu.is_premium && (
                      <span style={{ marginLeft: '0.4rem', backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                        PRO
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                    <div>{stu.degree || 'Not Added'}</div>
                    <small style={{ color: '#94a3b8' }}>{stu.university || 'N/A'}</small>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>{stu.city || 'Pakistan'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#38bdf8' }}>{stu.target_role || 'General'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {stu.phone ? (
                      <a
                        href={`https://wa.me/${stu.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        {stu.phone} 💬
                      </a>
                    ) : (
                      <span style={{ color: '#64748b' }}>No number</span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {stu.resume_url ? (
                      <a
                        href={stu.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 'bold' }}
                      >
                        View CV ↗
                      </a>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>No CV</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Homepage</Link>
      </div>

    </main>
  );
    }
                
