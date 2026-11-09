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
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Session check & client identity
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
          // Fallback guest identity for testing so message is never blocked
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

  // 2. Fetch profiles
  useEffect(() => {
    async function getProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, city')
        .limit(40);

      if (data && !error) {
        setAvailableUsers(data);
      }
    }
    getProfiles();
  }, []);

  // 3. Select Contact
  const handleSelectContact = async (contact) => {
    setSelectedUser(contact);
    setIsMobileChatOpen(true);

    const myId = currentUser?.id || 'anon-user';
    const roomKey = [myId, contact.id].sort().join('_');
    setActiveConversationId(roomKey);
  };

  // 4. Fetch & Subscribe Realtime Messages
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

  // 5. Send Message Action
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const senderId = currentUser?.id || 'anon-sender';

    // Optimistic UI update
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
        // Replace temp message with server record
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

  return (
    <div style={{ padding: '0.5rem', maxWidth: '1280px', margin: '0 auto', color: '#e4e6eb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
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
        {/* Left Sidebar (Messenger Contacts & Active Circles) */}
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
          {/* Top Bar */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #2f3031' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f5f6f7' }}>Chats</h1>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#3a3b3c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e4e6eb"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>
                </div>
              </div>
            </div>

            {/* Messenger Rounded Search Box */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search Messenger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem 0.6rem 2.3rem',
                  backgroundColor: '#3a3b3c',
                  border: 'none',
                  borderRadius: '20px',
                  color: '#e4e6eb',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <svg style={{ position: 'absolute', left: '0.8rem', top: '0.75rem' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Facebook Active Now Stories / Status Circles */}
          <div style={{ padding: '0.85rem 0.75rem 0.4rem', borderBottom: '1px solid #2f3031' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b0b3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Talent</span>
            <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', padding: '0.65rem 0 0.4rem', scrollbarWidth: 'none' }}>
              {displayedUsers.slice(0, 10).map((u) => (
                <div
                  key={'story-' + u.id}
                  onClick={() => handleSelectContact(u)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '56px' }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0084ff, #00c6ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: '#ffffff',
                        border: '2px solid #242526',
                        boxShadow: '0 0 0 2px #0084ff',
                      }}
                    >
                      {(u.full_name || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '1px',
                        right: '1px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#31a24c',
                        border: '2px solid #242526',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#e4e6eb', marginTop: '4px', maxWidth: '56px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(u.full_name || 'User').split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversations / Contact List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem' }}>
            {displayedUsers.map((contact) => {
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
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#3a3b3c' : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#3a3b3c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#2e89ff',
                      }}
                    >
                      {(contact.full_name || contact.email || 'U')[0].toUpperCase()}
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        backgroundColor: '#31a24c',
                        border: '2px solid #242526',
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, margin: 0, color: '#f5f6f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.full_name || contact.email}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#b0b3b8', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.city ? `${contact.city} • Active now` : 'Active on Shanora'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Chat Arena (Facebook Messenger View) */}
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
                        width: '42px',
                        height: '42px',
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
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '1px',
                        right: '1px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#31a24c',
                        border: '2px solid #242526',
                      }}
                    />
                  </div>

                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f5f6f7' }}>
                      {selectedUser.full_name || selectedUser.email}
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: '#31a24c', fontWeight: 500 }}>
                      Active now
                    </span>
                  </div>
                </div>

                {/* Call / Info Action Icons */}
                <div style={{ display: 'flex', gap: '1rem', color: '#0084ff' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
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
                    <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #0084ff, #00c6ff)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, color: '#ffffff' }}>
                      {(selectedUser.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <h3 style={{ margin: '0 0 0.25rem', color: '#f5f6f7' }}>{selectedUser.full_name}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>You're connected on Shanora Messenger</p>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#31a24c' }}>Say hi to start the conversation!</p>
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
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {msg.content}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar (Messenger Dock) */}
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#242526', borderTop: '1px solid #2f3031' }}>
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#3a3b3c',
                      borderRadius: '24px',
                      padding: '0.2rem 0.85rem',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Aa"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#f5f6f7',
                        fontSize: '0.95rem',
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
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b0b3b8',
                gap: '0.5rem',
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#242526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#0084ff"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </div>
              <h3 style={{ margin: 0, color: '#f5f6f7' }}>Select a chat</h3>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Choose from your friends on the left to start messaging</p>
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
