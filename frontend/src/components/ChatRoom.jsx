import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatRoom = ({ users }) => {
  const { user: currentUser, socket } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for chat message history on connect
    socket.on('message_history', (history) => {
      setMessages(history);
    });

    // Listen for new incoming messages
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for other users typing status
    socket.on('user_typing', (data) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (data.isTyping) {
          updated[data.userId] = data.username;
        } else {
          delete updated[data.userId];
        }
        return updated;
      });
    });

    socket.on('message_error', (data) => {
      setError(data.message || 'Unable to send message.');
    });

    // Re-request history in case socket reconnected
    socket.emit('get_message_history');

    return () => {
      socket.off('message_history');
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('message_error');
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle typing indicator timeout
  const typingTimeoutRef = useRef(null);
  const handleInputChange = (e) => {
    setText(e.target.value);
    if (error) setError('');

    if (!socket) return;

    // Emit typing true
    socket.emit('typing', true);

    // Debounce typing false
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    // Stop typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', false);

    // Send message via socket
    socket.emit('send_message', { text });
    setText('');
  };

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  const activeTypingList = Object.values(typingUsers);

  return (
    <div className="animate-fade" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 240px',
      gap: '20px',
      padding: '24px',
      width: '100%',
      height: 'calc(100vh - 40px)',
      boxSizing: 'border-box'
    }}>
      {/* Left Pane: Chat Stream */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px',
        overflow: 'hidden'
      }}>
        <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Workspace Team Chat</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Collaborate in real-time, share files or discuss tasks.
          </p>
        </div>

        {/* Message History list */}
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          margin: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingRight: '6px'
        }}>
          {messages.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}>
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender && msg.sender._id === currentUser.id;
              
              return (
                <div 
                  key={msg._id} 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    maxWidth: '75%'
                  }}
                >
                  {/* Sender Avatar */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: msg.sender ? msg.sender.avatarColor : 'var(--text-muted)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    boxShadow: msg.sender ? `0 0 8px ${msg.sender.avatarColor}30` : 'none'
                  }}>
                    {msg.sender ? getInitials(msg.sender.username) : '??'}
                  </div>

                  {/* Message Bubble wrapper */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    {/* Sender Username */}
                    {!isMe && msg.sender && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
                        {msg.sender.username}
                      </span>
                    )}

                    {/* Message Bubble content */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      borderTopRightRadius: isMe ? '0px' : '12px',
                      borderTopLeftRadius: isMe ? '12px' : '0px',
                      backgroundColor: isMe ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                      border: isMe ? 'none' : '1px solid var(--border-glow)',
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      boxShadow: isMe ? '0 4px 12px var(--primary-glow)' : 'none'
                    }}>
                      {msg.text}
                    </div>

                    {/* Timestamp */}
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <div style={{ height: '20px', marginBottom: '4px' }}>
          {error ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {error}
            </span>
          ) : activeTypingList.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--info)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ backgroundColor: 'var(--info)', width: '6px', height: '6px' }} />
              {activeTypingList.join(', ')} {activeTypingList.length === 1 ? 'is' : 'are'} typing...
            </span>
          )}
        </div>

        {/* Input Controls Bar */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              placeholder="Type your message here..."
              className="form-input"
              style={{ paddingRight: '40px', height: '46px' }}
              value={text}
              onChange={handleInputChange}
            />
            <button 
              type="button" 
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <Smile size={18} />
            </button>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '46px', height: '46px', padding: 0, borderRadius: '8px', flexShrink: 0 }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Right Pane: Members status listing */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px',
        overflow: 'hidden'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
          Team Members
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flexGrow: 1 }}>
          {users.map((member) => (
            <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: member.avatarColor,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                position: 'relative',
                boxShadow: `0 0 6px ${member.avatarColor}20`
              }}>
                {getInitials(member.username)}
                <span 
                  className={`pulse-dot ${member.isOnline ? '' : 'offline'}`}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '6px',
                    height: '6px',
                    border: '1px solid var(--bg-deep)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{member.username}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {member.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
