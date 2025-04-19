import React, { useState, useRef, useEffect } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([
    { _id: '1', type: 'assistant', content: 'Hello! How can I assist you today?', timestamp: '2023-10-01T12:00:00Z' },
    { _id: '2', type: 'user', content: 'I have a question about TreeGPT.', timestamp: '2023-10-01T12:01:00Z' },
    { _id: '3', type: 'assistant', content: 'Sure, what would you like to know?', timestamp: '2023-10-01T12:02:00Z' },
    { _id: '4', type: 'user', content: 'How does branching work?', timestamp: '2023-10-01T12:03:00Z' },
    { _id: '5', type: 'assistant', content: 'Branching lets you explore multiple paths in a conversation!', timestamp: '2023-10-01T12:04:00Z' },
  ]);
  const [input, setInput] = useState('');
  const messageRef = useRef(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMessage = {
      _id: generateId(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages([...messages, newMessage]);
    setInput('');
  };

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={messageRef} style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', padding: '10px' }}>
        {messages.map((message) => (
          <div
            key={message._id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
              margin: '5px 0',
            }}
          >
            <div
              style={{
                backgroundColor: message.type === 'user' ? '#DCF8C6' : '#FFFFFF',
                padding: '10px',
                borderRadius: '10px',
                maxWidth: '70%',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <p style={{ margin: '0' }}>{message.content}</p>
              <small style={{ color: '#666', fontSize: '0.8em' }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', marginTop: '10px', padding: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            marginLeft: '10px',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}