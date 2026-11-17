'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function FullScreenSearchPage() {
  const router = useRouter();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const [results, setResults] = useState({
    people: [],
    posts: [],
    jobs: [],
    pages: []
  });

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

    const saved = localStorage.getItem('shanora_recent_searches');
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveRecentSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    const updated = [searchTerm, ...recentSearches.filter(item => item !== searchTerm)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('shanora_recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('shanora_recent_searches');
  };

  // Live Debug Search Execution
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ people: [], posts: [], jobs: [], pages: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        console.log("Searching DB for:", q);

        // 1. Fetch all profiles to check data availability
        const { data: profilesData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .ilike('name', `%${q}%`)
          .limit(10);

        if (profileErr) console.error("Profile error:", profileErr);

        // 2. Fetch pages
        const { data: pagesData, error: pageErr } = await supabase
          .from('pages')
          .select('*')
          .ilike('name', `%${q}%`)
          .limit(10);

        if (pageErr) console.error("Page error:", pageErr);

        // 3. Fetch posts
        const { data: postsData } = await supabase
          .from('user_posts')
          .select('*')
          .ilike('content', `%${q}%`)
          .limit(10);

        // 4. Fetch jobs
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .ilike('title', `%${q}%`)
          .limit(10);

        console.log("Found Profiles:", profilesData);
        console.log("Found Pages:", pagesData);

        setResults({
          people: profilesData || [],
          posts: postsData || [],
          jobs: jobsData || [],
          pages: pagesData || []
        });
      } catch (err) {
        console.error('Search exception:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResultsCount = results.people.length + results.posts.length + results.jobs.length + results.pages.length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
        >
          ←
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.4rem 0.9rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem', marginRight: '0.5rem' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type name to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveRecentSearch(query); }}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}>✕</button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem' }}>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#38bdf8', fontSize: '0.88rem', fontWeight: '700' }}>
            Searching database...
          </div>
        )}

        {query.trim() && !loading && (
          <div>
            {totalResultsCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>No results found for "{query}"</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>Check browser Console (F12) to see database response.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {results.people.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>People</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {results.people.map(person => (
                        <div 
                          key={person.id} 
                          onClick={() => router.push(`/view-profile?email=${encodeURIComponent(person.email || '')}`)}
                          style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#fff' }}>{person.name || person.username || 'User'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{person.email || 'Member'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.pages.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pages</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {results.pages.map(page => (
                        <div 
                          key={page.id} 
                          onClick={() => router.push(`/page/${page.slug}`)}
                          style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#fff' }}>{page.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{page.category || 'Page'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
