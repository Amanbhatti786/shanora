'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form states for posting job
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [province, setProvince] = useState('Punjab');
  const [district, setDistrict] = useState('Lahore');
  const [applyUrl, setApplyUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState('');

  // Subscribers list
  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Passcode verification (Default: shanora2026)
  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === 'shanora2026') {
      setIsAuthenticated(true);
      fetchSubscribers();
    } else {
      alert('Ghalat Passcode! Please try again.');
    }
  };

  const fetchSubscribers = async () => {
    setLoadingSubs(true);
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setSubscribers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    setPosting(true);
    setPostMsg('');

    try {
      const fullLocation = `${district}, ${province}`;
      const formattedUrl = applyUrl.trim() !== '' && !applyUrl.startsWith('http') 
        ? `https://${applyUrl.trim()}` 
        : applyUrl.trim();

      const { error } = await supabase.from('opportunities').insert([
        {
          title: title.trim(),
          company: company.trim(),
          location: fullLocation,
          apply_url: formattedUrl
        }
      ]);

      if (error) throw error;

      setPostMsg('🎉 Job successfully posted to Shanora live portal!');
      setTitle('');
      setCompany('');
      setApplyUrl('');
    } catch (err) {
      console.error(err);
      setPostMsg('Error posting job. Check table permissions.');
    } finally {
      setPosting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ backgroundColor: '#131b2e', padding: '2rem', borderRadius: '14px', border: '1px solid #1e293b', width: '100%', maxWidth: '380px' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#ffffff', fontSize: '1.3rem' }}>🔒 Shanora Admin Login</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Enter management passcode to manage opportunities and view leads.</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password"
              placeholder="Admin Passcode (shanora2026)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', marginBottom: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '90vh', padding: '2.5rem 1rem' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>Admin Control Center</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>Post opportunities & review recent WhatsApp lead signups.</p>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Lock Out
          </button>
        </div>

        {/* Post a Job Box */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#38bdf8', margin: '0 0 1rem 0' }}>➕ Add New Job / Internship</h2>
          
          {postMsg && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #22c55e' }}>
              {postMsg}
            </div>
          )}

          <form onSubmit={handleCreateJob} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Job Title</label>
              <input 
                type="text" 
                placeholder="e.g. Associate Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Company Name</label>
              <input 
                type="text" 
                placeholder="e.g. Systems Limited, Jazz, 10Pearls"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Province</label>
              <select 
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none' }}
              >
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="KPK">KPK</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Remote">Remote / Online</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>City / District</label>
              <input 
                type="text" 
                placeholder="e.g. Lahore, Karachi, Peshawar, Remote"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Official Apply URL (LinkedIn / Portal)</label>
              <input 
                type="text" 
                placeholder="https://company.com/careers/job-id"
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0a0f1d', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                disabled={posting}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#22c55e', color: '#090d16', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}
              >
                {posting ? 'Adding to Shanora Portal...' : 'Publish Job Live 🚀'}
              </button>
            </div>
          </form>
        </section>

        {/* Recent Registered Leads Section */}
        <section style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#ffffff', margin: 0 }}>👥 Recent Subscribers ({subscribers.length})</h2>
            <button 
              onClick={fetchSubscribers} 
              style={{ backgroundColor: '#0a0f1d', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>

          {loadingSubs ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading subscribers...</p>
          ) : subscribers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Name</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Phone</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Region</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Target Area</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '0.6rem 0.5rem', color: '#f1f5f9' }}>{s.name}</td>
                      <td style={{ padding: '0.6rem 0.5rem', color: '#38bdf8' }}>{s.phone}</td>
                      <td style={{ padding: '0.6rem 0.5rem', color: '#94a3b8' }}>{s.city}</td>
                      <td style={{ padding: '0.6rem 0.5rem', color: '#cbd5e1' }}>{s.target_role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Abhi tak koi entry nahi aayi.</p>
          )}
        </section>

      </div>
    </main>
  );
        }
                
