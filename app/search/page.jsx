'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function FullScreenSearchPage() {
  const router = useRouter();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Search Results State
  const [results, setResults] = useState({
    people: [],
    posts: [],
    jobs: [],
    pages: [],
    groups: []
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

    const saved = localStorage.getItem('shanora_recent_searches');
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch (e) {}
    }

    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_email')
          .eq('follower_email', session.user.email);
        
        if (follows) {
          const map = {};
          follows.forEach(f => { if (f.following_email) map[f.following_email.toLowerCase()] = true; });
          setFollowingMap(map);
        }
      }
    }
    getUser();
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

  // Verified & Tested Search Execution
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ people: [], posts: [], jobs: [], pages: [], groups: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const promises = [
          // 1. Profiles / People search
          supabase.from('profiles').select('*')
            .or(`name.ilike.%${q}%,full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%`)
            .limit(10),
          
          // 2. Posts search
          supabase.from('user_posts').select('*')
            .ilike('content', `%${q}%`)
            .limit(10),
          
          // 3. Jobs search
          supabase.from('jobs').select('*')
            .ilike('title', `%${q}%`)
            .limit(10),
          
          // 4. Pages search (using exact verified columns: name, headline, category)
          supabase.from('pages').select('*')
            .or(`name.ilike.%${q}%,headline.ilike.%${q}%,category.ilike.%${q}%`)
            .limit(10),
          
          // 5. Groups search fallback
          supabase.from('groups').select('*')
            .ilike('name', `%${q}%`)
            .limit(10)
            .catch(() => ({ data: [] }))
        ];

        const [profilesRes, postsRes, jobsRes, pagesRes, groupsRes] = await Promise.all(promises);

        setResults({
          people: profilesRes.data || [],
          posts: postsRes.data || [],
          jobs: jobsRes.data || [],
          pages: pagesRes.data || [],
          groups: groupsRes.data || []
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function handleToggleFollow(targetEmail, e) {
    e.stopPropagation();
    if (!currentUser) return router.push('/auth');
    if (!targetEmail) return;

    const cleanTarget = targetEmail.toLowerCase();
    const cleanCurrent = currentUser.email.toLowerCase();
    if (cleanTarget === cleanCurrent) return;

    const isFollowing = !!followingMap[cleanTarget];
    setFollowingMap(prev => ({ ...prev, [cleanTarget]: !isFollowing }));

    try {
      if (isFollowing) {
        await supabase.from('user_follows').delete().eq('follower_email', cleanCurrent).eq('following_email', cleanTarget);
      } else {
        await supabase.from('user_follows').insert([{ follower_email: cleanCurrent, following_email: cleanTarget }]);
      }
    } catch (err) {
      console.error('Follow error:', err);
      setFollowingMap(prev => ({ ...prev, [cleanTarget]: isFollowing }));
    }
  }

  const totalResultsCount = results.people.length + results.posts.length + results.jobs.length + results.pages.length + results.groups.length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      
      {/* Header */}
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
            placeholder="Search people, posts, jobs, pages..."
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

      {/* Tabs */}
      {query.trim() && (
        <div style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {['all', 'people', 'posts', 'jobs', 'pages'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '16px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'capitalize',
                backgroundColor: activeTab === tab ? '#0284c7' : '#1e293b',
                color: activeTab === tab ? '#fff' : '#94a3b8',
                flexShrink: 0
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem' }}>
        
        {/* Recent Searches */}
        {!query.trim() && (
          <div>
            {recentSearches.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Recent Searches</span>
                <button onClick={clearRecentSearches} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '700' }}>Clear All</button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {recentSearches.map((term, index) => (
                <div
                  key={index}
                  onClick={() => setQuery(term)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #1e293b', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: '#94a3b8' }}>🕒</span>
                    <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: '600' }}>{term}</span>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>↗</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#38bdf8', fontSize: '0.88rem', fontWeight: '700' }}>
            Searching SHANORA network...
          </div>
        )}

        {query.trim() && !loading && (
          <div>
            {totalResultsCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>No results found for "{query}"</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>Try searching with another name or keyword.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {/* PEOPLE */}
                {(activeTab === 'all' || activeTab === 'people') && results.people.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>People</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {results.people.map(person => {
                        const emailClean = (person.email || '').toLowerCase();
                        const isFollowing = !!followingMap[emailClean];
                        const displayName = person.name || person.full_name || person.username || 'User';
                        return (
                          <div 
                            key={person.id} 
                            onClick={() => router.push(`/view-profile?email=${encodeURIComponent(person.email || '')}`)}
                            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0284c7', backgroundImage: person.avatar_url ? `url(${person.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                                {!person.avatar_url && displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#fff' }}>{displayName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>@{person.username || person.email?.split('@')[0]}</div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleToggleFollow(emailClean, e)}
                              style={{
                                backgroundColor: isFollowing ? 'transparent' : 'rgba(2, 132, 199, 0.2)',
                                color: isFollowing ? '#94a3b8' : '#38bdf8',
                                border: isFollowing ? '1px solid #334155' : '1px solid #0284c7',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '14px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {isFollowing ? '✓ Following' : '+ Follow'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PAGES */}
                {(activeTab === 'all' || activeTab === 'pages') && results.pages.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pages & Companies</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {results.pages.map(page => (
                        <div 
                          key={page.id} 
                          onClick={() => router.push(`/page/${page.slug}`)}
                          style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#1e293b', backgroundImage: page.logo_url ? `url(${page.logo_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#38bdf8' }}>
                              {!page.logo_url && page.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                {page.name}
                                {page.monetization_status === 'approved' && <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>✓</span>}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{page.category || 'Official Page'}</div>
                            </div>
                          </div>
                          <span style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: '700' }}>Visit ↗</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* POSTS */}
                {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Posts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {results.posts.map(post => (
                        <div 
                          key={post.id} 
                          onClick={() => router.push(`/feed?postId=${post.id}`)}
                          style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem', cursor: 'pointer' }}
                        >
                          <div style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: '700' }}>{post.user_name || 'Member'}</div>
                          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.3rem' }}>{post.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* JOBS */}
                {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Jobs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {results.jobs.map(job => (
                        <div 
                          key={job.id} 
                          onClick={() => router.push('/jobs')}
                          style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem', cursor: 'pointer' }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>{job.title}</div>
                          <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{job.company} • {job.location}</div>
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
