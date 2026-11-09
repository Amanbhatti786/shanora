'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Session check
  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Realtime presence tracker
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('online-presence', {
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

  // 3. Load user profiles (Fixed Schema Columns: id, full_name, email, city)
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, city')
        .neq('id', currentUser.id)
        .limit(50);

      if (profiles && !error) {
        setAvailableUsers(profiles);
      }

      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${currentUser.id},participant_two.eq.${currentUser.id}`);

      if (convData && convData.length > 0 && profiles) {
        const mapped = convData.map((conv) => {
          const partnerId = conv.participant_one === currentUser.id ? conv.participant_two : conv.participant_one;
          const partnerProfile = profiles.find((p) => p.id === partnerId) || {
            id: partnerId,
            full_name: `User ${partnerId.slice(0, 5)}`,
            email: ''
          };
          return {
            conversationId: conv.id,
            partner: partnerProfile
          };
        });
        setConversations(mapped);
      }
    }

    loadData();
  }, [currentUser]);

  // 4. Select contact / start private conversation
  const selectContact = async (contact) => {
    if (!currentUser) return;
    setSelectedUser(contact);
    setIsMobileChatOpen(true);

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
        setConversations((prev) => [...prev, { conversationId: newConv.id, partner: contact }]);
      }
    }
  };

  // 5. Strict Private Realtime message room
  useEffect(() => {
    if (!activeConversationId || !currentUser) return;

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
  }, [activeConversationId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 6. Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || !currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      content: messageContent,
    });
  };

  const displayedContacts = availableUsers.filter((user) =>
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
        {/* Left Sidebar (Contacts Directory) */}
        <div
          style={{
            width: '100%',
            maxWidth: isMobileChatOpen ? '0px' : '100%',
            display: isMobileChatOpen ? 'none' : 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255, 255, 255, 0.07)',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 29, 0.98) 100%)',
            transition: 'all 0.3s ease',
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
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Direct Chats
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                {availableUsers.length} Talent
              </span>
            </div>

            {/* Search Input */}
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
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}
              />
              <svg style={{ position: 'absolute', left: '0.75rem', top: '0.8rem' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Contact Directory */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {displayedContacts.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No candidates available.
              </div>
            ) : (
              displayedContacts.map((contact) => {
                const isOnline = onlineUsers.has(contact.id);
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
                      boxShadow: isSelected ? '0 4px 15px rgba(37, 99, 235, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid rgba(255, 255, 255, 0.1)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#38bdf8'
                        }}
                      >
                        {(contact.full_name || contact.email || 'U')[0].toUpperCase()}
                      </div>

                      {isOnline && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '1px',
                            right: '1px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            border: '2px solid #0b1120',
                            boxShadow: '0 0 10px #10b981',
                          }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ fontSize: '0.92rem', fontWeight: 600, margin: 0, color: isSelected ? '#ffffff' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contact.full_name || contact.email}
                      </p>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isOnline ? '#34d399' : '#64748b' }}>
                        {contact.city ? `${contact.city} • ` : ''}{isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
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
              {/* Header with Back Button */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(10, 16, 31, 0.9)',
                  backdropFilter: 'blur(12px)',
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
                    padding: 0
                  }}
                  className="mobile-back-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                      background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 14px rgba(56, 189, 248, 0.3)',
                      fontWeight: 700,
                      color: '#ffffff'
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
                        backgroundColor: '#10b981',
                        border: '2px solid #0a101f',
                        boxShadow: '0 0 8px #10b981',
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                    {selectedUser.full_name || selectedUser.email}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: onlineUsers.has(selectedUser.id) ? '#34d399' : '#64748b',
                    }}
                  >
                    {onlineUsers.has(selectedUser.id) ? '● Active now' : 'Private chat room'}
                  </span>
                </div>
              </div>

              {/* Messages Feed */}
              <div
                style={{
                  flex: 1,
                  padding: '1rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.08)', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#e2e8f0' }}>End-to-End Private Channel</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Messages are strictly private between both of you.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          padding: '0.65rem 1rem',
                          borderRadius: '16px',
                          borderBottomRightRadius: isOwnMessage ? '3px' : '16px',
                          borderBottomLeftRadius: isOwnMessage ? '16px' : '3px',
                          background: isOwnMessage
                            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                            : 'rgba(30, 41, 59, 0.85)',
                          color: '#ffffff',
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                          border: isOwnMessage ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.06)',
                          boxShadow: isOwnMessage
                            ? '0 6px 16px -3px rgba(37, 99, 235, 0.4)'
                            : '0 3px 12px rgba(0, 0, 0, 0.2)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {msg.content}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Dock */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(10, 16, 31, 0.9)', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '0.35rem 0.4rem 0.35rem 1rem',
                    borderRadius: '25px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type a private message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                      background: newMessage.trim() ? 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)' : '#334155',
                      border: 'none',
                      borderRadius: '50%',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: newMessage.trim() ? 'pointer' : 'default',
                      boxShadow: newMessage.trim() ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none',
                      transition: 'all 0.2s ease',
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
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                gap: '0.75rem',
                padding: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#94a3b8' }}>Select a candidate to open their private chat</p>
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
