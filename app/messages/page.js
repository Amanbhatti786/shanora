'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izdtmpowrcimaittuffv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZHRtcG93cmNpbWFpdHR1ZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MjA0NTU3NjAwMH0.dummy';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Session check & Identity
  useEffect(() => {
    async function loadIdentity() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
        } else {
          let localId = localStorage.getItem('shanora_device_uid');
          if (!localId) {
            localId = 'anon-' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('shanora_device_uid', localId);
          }
          setCurrentUser({ id: localId, email: 'guest@shanora.pk' });
        }
      }
    }

    loadIdentity();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setCurrentUser(session.user);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 2. Realtime Presence Tracking (Sirf active users track honge)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('shanora-live-presence', {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = new Set();
        for (const id in state) {
          activeIds.add(id);
        }
        setOnlineUsers(activeIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser]);

  // 3. Fetch Shanora Profiles
  useEffect(() => {
    async function getProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, city')
        .limit(50);

      if (data && !error) {
        setAvailableUsers(data);
      }
    }
    getProfiles();
  }, []);

  // 4. Select Contact
  const handleSelectContact = (contact) => {
    setSelectedUser(contact);
    setIsMobileChatOpen(true);

    const myId = currentUser?.id || 'anon-user';
    const roomKey = [myId, contact.id].sort().join('_');
    setActiveConversationId(roomKey);
  };

  // 5. Realtime Messages
  useEffect(() => {
    if (!activeConversationId) return;

    async function loadChatMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    }

    loadChatMessages();

    const channel = supabase
      .channel(`live-room-${activeConversationId}`)
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

  // 6. Send Message Action
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const senderId = currentUser?.id || 'anon-sender';

    const tempId = 'temp-' + Date.now();
    const optimisticMessage = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          sender_id: senderId,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Send error:', error);
      } else if (data) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      }
    } catch (err) {
      console.error('Transmission error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const displayedUsers = availableUsers.filter((u) =>
    (u.full_name || u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sirf online users top bar mein aayenge
  const activeTalentUsers = displayedUsers.filter((u) => onlineUsers.has(u.id));

  return (
    <div style={{ padding: '0.5rem', maxWidth: '1280px', margin: '0 auto', color: '#e4e6eb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 105px)',
          minHeight: '600px',
          backgroundColor: '#18191a',
          borderRadius: '16px',
          border: '1px solid #2f3031',
          overflow: 'hidden',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: '100%',
            maxWidth: isMobileChatOpen ? '0px' : '100%',
            display: isMobileChatOpen ? 'none' : 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #2f3031',
            backgroundColor: '#242526',
          }}
          className="sidebar-container"
        >
          {/* Header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #2f3031' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #0084ff, #00c6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                </div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f5f6f7' }}>Shanora Chats</h1>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'rgba(0, 132, 255, 0.15)', color: '#0084ff', border: '1px solid rgba(0, 132, 255, 0.3)' }}>
                {onlineUsers.size} Online
              </span>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search Shanora talent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem 0.6rem 2.3rem',
                  backgroundColor: '#3a3b3c',
                  border: 'none',
                  borderRadius: '20px',
                  color: '#e4e6eb',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
              <svg style={{ position: 'absolute', left: '0.8rem', top: '0.75rem' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Top Active Talent Row (Sirf tab dikhegi agar koi online ho) */}
          {activeTalentUsers.length > 0 && (
            <div style={{ padding: '0.75rem 0.75rem 0.3rem', borderBottom: '1px solid #2f3031' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#31a24c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Online Now</span>
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.5rem 0 0.3rem', scrollbarWidth: 'none' }}>
                {activeTalentUsers.map((u) => (
                  <div
                    key={'active-' + u.id}
                    onClick={() => handleSelectContact(u)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '52px' }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0084ff, #00c6ff)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#ffffff',
                          border: '2px solid #242526',
                          boxShadow: '0 0 0 2px #31a24c',
                        }}
                      >
                        {(u.full_name || u.email || 'U')[0].toUpperCase()}
                      </div>
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '1px',
                          right: '1px',
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          backgroundColor: '#31a24c',
                          border: '2px solid #242526',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#e4e6eb', marginTop: '4px', maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(u.full_name || 'User').split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts Directory */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem' }}>
            {displayedUsers.map((contact) => {
              const isOnline = onlineUsers.has(contact.id);
              const isSelected = selectedUser?.id === contact.id;

              return (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#3a3b3c' : 'transparent',
                    marginBottom: '2px',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#3a3b3c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#0084ff',
                      }}
                    >
                      {(contact.full_name || contact.email || 'U')[0].toUpperCase()}
                    </div>

                    {/* Green dot sirf online user par show hoga */}
                    {isOnline ? (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '1px',
                          right: '1px',
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          backgroundColor: '#31a24c',
                          border: '2px solid #242526',
                          boxShadow: '0 0 6px #31a24c',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '1px',
                          right: '1px',
                          width: '9px',
                          height: '9px',
                          borderRadius: '50%',
                          backgroundColor: '#65676b',
                          border: '2px solid #242526',
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, margin: 0, color: '#f5f6f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.full_name || contact.email}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: isOnline ? '#31a24c' : '#b0b3b8', margin: '2px 0 0', fontWeight: isOnline ? 600 : 400 }}>
                      {isOnline ? 'Active now' : 'Offline'}
                    </p>
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
            backgroundColor: '#18191a',
            height: '100%',
          }}
          className="chat-arena-container"
        >
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #2f3031',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#242526',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsMobileChatOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'none',
                      border: 'none',
                      color: '#0084ff',
                      cursor: 'pointer',
                      padding: '0 4px',
                    }}
                    className="mobile-back-btn"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                  </button>

                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0084ff, #00c6ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}
                    </div>
                    {onlineUsers.has(selectedUser.id) && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '0px',
                          right: '0px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#31a24c',
                          border: '2px solid #242526',
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f5f6f7' }}>
                      {selectedUser.full_name || selectedUser.email}
                    </h2>
                    <span style={{ fontSize: '0.72rem', color: onlineUsers.has(selectedUser.id) ? '#31a24c' : '#b0b3b8', fontWeight: 500 }}>
                      {onlineUsers.has(selectedUser.id) ? 'Active now' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Secure Badge */}
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                  Encrypted
                </span>
              </div>

              {/* Message Feed */}
              <div
                style={{
                  flex: 1,
                  padding: '1.25rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#b0b3b8' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #0084ff, #00c6ff)', margin: '0 auto 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
                      {(selectedUser.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <h3 style={{ margin: '0 0 0.25rem', color: '#f5f6f7', fontSize: '1.1rem' }}>{selectedUser.full_name}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Direct private channel on Shanora</p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#0084ff' }}>Send a message to start conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === (currentUser?.id || 'anon-sender');
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                          maxWidth: '68%',
                          padding: '0.65rem 0.95rem',
                          borderRadius: '18px',
                          borderBottomRightRadius: isOwnMessage ? '4px' : '18px',
                          borderBottomLeftRadius: isOwnMessage ? '18px' : '4px',
                          backgroundColor: isOwnMessage ? '#0084ff' : '#3e4042',
                          color: '#ffffff',
                          fontSize: '0.92rem',
                          lineHeight: '1.38',
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

              {/* Bottom Input */}
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#242526', borderTop: '1px solid #2f3031' }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ flex: 1, backgroundColor: '#3a3b3c', borderRadius: '24px', padding: '0.2rem 0.85rem' }}>
                    <input
                      type="text"
                      placeholder="Write a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#f5f6f7',
                        fontSize: '0.92rem',
                        padding: '0.45rem 0',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: newMessage.trim() ? '#0084ff' : '#707478',
                      cursor: newMessage.trim() ? 'pointer' : 'default',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#b0b3b8', gap: '0.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#242526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0084ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <h3 style={{ margin: 0, color: '#f5f6f7', fontSize: '1.05rem' }}>Select a conversation</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Choose from the candidate list on the left to start messaging</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .sidebar-container {
            max-width: 360px !important;
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
