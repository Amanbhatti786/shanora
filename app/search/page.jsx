'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function FullScreenSearchPage() {
  const router = useRouter();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [peopleResults, setPeopleResults] = useState([]);
  const [postsResults, setPostsResults] = useState([]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Simple, direct search trigger
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPeopleResults([]);
      setPostsResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        // 1. Search profiles table safely
        const { data: profilesData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .ilike('name', `%${q}%`)
          .limit(10);

        if (profileErr) {
          console.log('Profile search error:', profileErr.message);
        }

        // 2. Search user_posts table safely
        const { data: postsData, error: postErr } = await supabase
          .from('user_posts')
          .select('*')
          .ilike('content', `%${q}%`)
          .limit(10);

        if (postErr) {
          console.log('Post search error:', postErr.message);
        }

        setPeopleResults(profilesData || []);
        setPostsResults(postsData || []);
      } catch (err) {
        console.error('Search exception:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
      
      {/* Header with back button & input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '1.25rem', cursor: 'pointer' }}
        >
          ←
        </button>
        <div style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '0.5rem' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type any name or keyword to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>

      {/* Results view */}
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {loading && <div style={{ color: '#38bdf8', textAlign: 'center', padding: '2rem' }}>Searching database...</div>}

        {!loading && query.trim() && peopleResults.length === 0 && postsResults.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
            <h3>No results found for "{query}"</h3>
            <p style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>Please check your Supabase RLS policies or try typing your exact username or email.</p>
          </div>
        )}

        {/* People Found */}
        {peopleResults.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>People Found</h4>
            {peopleResults.map(person => (
              <div 
                key={person.id || person.email}
                onClick={() => router.push(`/view-profile?email=${encodeURIComponent(person.email || '')}`)}
                style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{person.name || person.full_name || person.username || 'User'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{person.email || person.username}</div>
                </div>
                <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>View ↗</span>
              </div>
            ))}
          </div>
        )}

        {/* Posts Found */}
        {postsResults.length > 0 && (
          <div>
            <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Posts Found</h4>
            {postsResults.map(post => (
              <div 
                key={post.id}
                onClick={() => router.push(`/feed?postId=${post.id}`)}
                style={{ backgroundColor: '#0f172a', border: '1px실 solid #1e293b', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '0.5rem', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>{post.user_name || 'Member'}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.3rem' }}>{post.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
