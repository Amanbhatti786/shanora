'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Send, User as UserIcon, Search, Sparkles } from 'lucide-react';

export default function MessagesPage() {
  const supabase = createClientComponentClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
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
  }, [supabase]);

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
  }, [currentUser, supabase]);

  // 3. Load user conversations and active profiles
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${currentUser.id},participant_two.eq.${currentUser.id}`);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', currentUser.id)
        .limit(50);

      if (profiles) setAvailableUsers(profiles);

      if (convData && convData.length > 0 && profiles) {
        const mapped = convData.map((conv) => {
          const partnerId = conv.participant_one === currentUser.id ? conv.participant_two : conv.participant_one;
          const partnerProfile = profiles.find((p) => p.id === partnerId) || {
            id: partnerId,
            full_name: `User ${partnerId.slice(0, 5)}`,
            username: partnerId.slice(0, 6)
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
  }, [currentUser, supabase]);

  // 4. Select contact / start conversation (Fixed Query)
  const selectContact = async (contact) => {
    if (!currentUser) return;
    setSelectedUser(contact);

    // Fetch existing conversation safely
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

  // 5. Realtime message synchronization (Fixed Duplicate Handling)
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
      .channel(`room:${activeConversationId}`)
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
            if (prev.some((msg) => msg.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, supabase]);

  // Auto-scroll
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
    (user.full_name || user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1300px', margin: '0 auto', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          height: '82vh',
          background: 'radial-gradient(ellipse at top left, #0d1527 0%, #060913 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.05)',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: '340px',
            borderRight: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(10, 15, 29, 0.95) 100%)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#38bdf8" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Direct Chats
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                {conversations.length} Active
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
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}
              />
              <Search
                size={15}
                style={{ position: 'absolute', left: '0.75rem', top: '0.8rem', color: '#64748b' }}
              />
            </div>
          </div>

          {/* Contact List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {displayedContacts.map((contact) => {
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
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    marginBottom: '0.35rem',
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    boxShadow: isSelected ? '0 4px 15px rgba(37, 99, 235, 0.15)' : 'none',
                    transition: 'all 0.25s ease',
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
                      }}
                    >
                      <UserIcon size={22} color="#94a3b8" />
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
                      {contact.full_name || contact.username || 'Candidate'}
                    </p>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isOnline ? '#34d399' : '#64748b' }}>
                      {isOnline ? 'Online now' : 'Offline'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Chat Arena */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 50% 20%, rgba(30, 41, 59, 0.3) 0%, rgba(2, 6, 23, 0.6) 100%)' }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'rgba(10, 16, 31, 0.85)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)',
                    }}
                  >
                    <UserIcon size={20} color="#ffffff" />
                  </div>
                  {onlineUsers.has(selectedUser.id) && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        border: '2px solid #0a101f',
                        boxShadow: '0 0 8px #10b981',
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    {selectedUser.full_name || selectedUser.username}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: onlineUsers.has(selectedUser.id) ? '#34d399' : '#64748b',
                    }}
                  >
                    {onlineUsers.has(selectedUser.id) ? '● Active in Chat' : 'Last seen recently'}
                  </span>
                </div>
              </div>

              {/* Message Feed */}
              <div
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.08)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                      <Sparkles size={24} color="#38bdf8" />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>End-to-End Direct Message Room</p>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem' }}>Say hello and start collaborating directly.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                          maxWidth: '68%',
                          padding: '0.75rem 1.15rem',
                          borderRadius: '18px',
                          borderBottomRightRadius: isOwnMessage ? '3px' : '18px',
                          borderBottomLeftRadius: isOwnMessage ? '18px' : '3px',
                          background: isOwnMessage
                            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                            : 'rgba(30, 41, 59, 0.75)',
                          color: '#ffffff',
                          fontSize: '0.92rem',
                          lineHeight: '1.45',
                          wordBreak: 'break-word',
                          border: isOwnMessage ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.06)',
                          boxShadow: isOwnMessage
                            ? '0 8px 20px -4px rgba(37, 99, 235, 0.45)'
                            : '0 4px 15px rgba(0, 0, 0, 0.25)',
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
              <div style={{ padding: '1rem 1.5rem', background: 'rgba(10, 16, 31, 0.85)', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '0.4rem 0.5rem 0.4rem 1.15rem',
                    borderRadius: '30px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.92rem',
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
                      width: '42px',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: newMessage.trim() ? 'pointer' : 'default',
                      boxShadow: newMessage.trim() ? '0 0 15px rgba(56, 189, 248, 0.5)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Send size={18} color="#ffffff" />
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
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={28} color="#38bdf8" />
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Select a candidate to open their private channel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
