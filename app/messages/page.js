'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase direct credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izdtmpowrcimaittuffv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZHRtcG93cmNpbWFpdHR1ZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MjA0NTU3NjAwMH0.dummy'; // Fallback token
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [statusLog, setStatusLog] = useState('Loading talent...');
  const messagesEndRef = useRef(null);

  // 1. Session check
  useEffect(() => {
    async function initSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
    }
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 2. Fetch Profiles DIRECTLY (No session block)
  useEffect(() => {
    async function fetchTalent() {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, city')
          .limit(50);

        if (error) {
          console.error('Supabase Profiles Error:', error);
          setStatusLog(`Error: ${error.message}`);
          return;
        }

        if (profiles && profiles.length > 0) {
          setAvailableUsers(profiles);
          setStatusLog('');
        } else {
          setStatusLog('No talent rows returned from database.');
        }
      } catch (err) {
        console.error('Fetch exception:', err);
        setStatusLog('Network exception loading profiles.');
      }
    }

    fetchTalent();
  }, []);

  // 3. Load active conversations when currentUser is ready
  useEffect(() => {
    if (!currentUser) return;

    async function loadConversations() {
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${currentUser.id},participant_two.eq.${currentUser.id}`);

      if (convData && convData.length > 0) {
        setConversations(convData);
      }
    }
    loadConversations();
  }, [currentUser]);

  // 4. Select contact / start private conversation
  const selectContact = async (contact) => {
    setSelectedUser(contact);
    setIsMobileChatOpen(true);

    if (!currentUser) return;

    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, participant_one, participant_two')
      .or(`participant_one.eq.${currentUser.id},participant_two.eq.${currentUser.id}`);

    const existingConv = existingConvs?.find(
      (c) =>
        (c.participant_one === currentUser.id && c.participant_two === contact.id) ||
        (c.participant_one === contact.id && c.participant_two === currentUser.id)
    );

    if (existingConv) {
      setActiveConversationId(existingConv.id);
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          participant_one: currentUser.id,
          participant_two: contact.id,
        })
        .select()
        .single();

      if (newConv && !error) {
        setActiveConversationId(newConv.id);
        setConversations((prev) => [...prev, newConv]);
      }
    }
  };

  // 5. Load & Subscribe to Messages
  useEffect(() => {
    if (!activeConversationId) return;

    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    }
    fetchMessages();

    const channel = supabase
      .channel(`chat-room-${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 6. Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage('');

    await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      content,
    });
  };

  // Filter contacts (excluding currentUser if logged in)
  const displayedContacts = availableUsers
    .filter((u) => !currentUser || u.id !== currentUser.id)
    .filter((user) =>
      (user.full_name || user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div style={{ padding: '0.75rem', maxWidth: '1300px', margin: '0 auto', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 110px)',
          minHeight: '580px',
          background: 'radial-gradient(ellipse at top left, #0d1527 0%, #060913 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.05)',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          position: 'relative'
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: '100%',
            maxWidth: isMobileChatOpen ? '0px' : '100%',
            display: isMobileChatOpen ? 'none' : 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255, 255, 255, 0.07)',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 29, 0.98) 100%)',
          }}
          className="sidebar-container"
        >
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Direct Chats
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                {displayedContacts.length} Active
              </span>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search candidates or peers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <svg style={{ position: 'absolute', left: '0.75rem', top: '0.8rem' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Contact List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {statusLog && (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', margin: '0.5rem' }}>
                {statusLog}
              </div>
            )}

            {displayedContacts.map((contact) => {
              const isSelected = selectedUser?.id === contact.id;

              return (
                <div
                  key={contact.id}
                  onClick={() => selectContact(contact)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    marginBottom: '0.35rem',
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid rgba(255, 255, 255, 0.1)',
                      fontWeight: 700,
                      color: '#38bdf8'
                    }}
                  >
                    {(contact.full_name || contact.email || 'U')[0].toUpperCase()}
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, margin: 0, color: isSelected ? '#ffffff' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.full_name || contact.email}
                    </p>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
                      {contact.city ? `${contact.city} • Available` : 'Available to chat'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Chat Arena */}
        <div
          style={{
            flex: 1,
            display: !isMobileChatOpen && typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : 'flex',
            flexDirection: 'column',
            background: 'radial-gradient(circle at 50% 20%, rgba(30, 41, 59, 0.35) 0%, rgba(2, 6, 23, 0.75) 100%)',
            height: '100%',
          }}
          className="chat-arena-container"
        >
          {selectedUser ? (
            <>
              {/* Header */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(10, 16, 31, 0.9)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsMobileChatOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  className="mobile-back-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>

                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#ffffff'
                  }}
                >
                  {(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                    {selectedUser.full_name || selectedUser.email}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Private encrypted channel</span>
                </div>
              </div>

              {/* Feed */}
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#e2e8f0' }}>End-to-End Private Channel</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Messages are strictly private between both of you.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isOwn ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          padding: '0.65rem 1rem',
                          borderRadius: '16px',
                          borderBottomRightRadius: isOwn ? '3px' : '16px',
                          borderBottomLeftRadius: isOwn ? '16px' : '3px',
                          background: isOwn ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(30, 41, 59, 0.85)',
                          color: '#ffffff',
                          fontSize: '0.9rem',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(10, 16, 31, 0.9)', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder={currentUser ? "Type a message..." : "Please log in to send message"}
                    disabled={!currentUser}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      padding: '0.65rem 1rem',
                      borderRadius: '25px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !currentUser}
                    style={{
                      background: newMessage.trim() ? '#2563eb' : '#334155',
                      border: 'none',
                      borderRadius: '50%',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: newMessage.trim() ? 'pointer' : 'default',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Select a peer to open chat
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .sidebar-container {
            max-width: 340px !important;
            display: flex !important;
          }
          .chat-arena-container {
            display: flex !important;
          }
          .mobile-back-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
