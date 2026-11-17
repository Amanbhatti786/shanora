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

  // Robust Search Execution with error console logging
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
        console.log("Searching for:", q);

        // Fetch profiles safely
        const profilesRes = await supabase
          .from('profiles')
          .select('*')
          .or(`name.ilike.%${q}%,full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(10);

        if (profilesRes.error) console.error("Profiles search error:", profilesRes.error);

        // Fetch posts safely
        const postsRes = await supabase
          .from('user_posts')
          .select('*')
          .ilike('content', `%${q}%`)
          .limit(10);

        if (postsRes.error) console.error("Posts search error:", postsRes.error);

        // Fetch jobs safely
        const jobsRes = await supabase
          .from('jobs')
          .select('*')
          .ilike('title', `%${q}%`)
          .limit(10);

        if (jobsRes.error) console.error("Jobs search error:", jobsRes.error);

        // Fetch pages safely
        const pagesRes = await supabase
          .from('pages')
          .select('*')
          .ilike('name', `%${q}%`)
          .limit(10);

        if (pagesRes.error) console.error("Pages search error:", pagesRes.error);

        setResults({
          people: profilesRes.data || [],
          posts: postsRes.data || [],
          jobs: jobsRes.data || [],
          pages: pagesRes.data || [],
          groups: []
        });
      } catch (err) {
        console.error('Search execution crash:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResultsCount = results.people.length + results.posts.length + results.jobs.length + results.pages.length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      
      {/* Search Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
          title="Back"
        >
          ←
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.4rem 0.9rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem', marginRight: '0.5rem' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search profiles, posts, jobs..."
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

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem' }}>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#38bdf8', fontSize: '0.88rem', fontWeight: '700' }}>
            Searching...
          </div>
        )}

        {query.trim() && !loading && (
          <div>
            {totalResultsCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>No results found for "{query}"</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>Check browser Console (F12) to see if Supabase returned any error.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {results.people.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>People</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {results.people.map(person => {
                        const displayName = person.name || person.full_name || person.username || person.email || 'User';
                        return (
                          <div 
                            key={person.id || person.email} 
                            onClick={() => router.push(`/view-profile?email=${encodeURIComponent(person.email || '')}`)}
                            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0284c7', backgroundImage: person.avatar_url ? `url(${person.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                                {!person.avatar_url && displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#fff' }}>{displayName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{person.email || `@${person.username}`}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {results.posts.length > 0 && (
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

              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
