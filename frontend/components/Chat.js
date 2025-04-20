import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Chat({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [currentParentId, setCurrentParentId] = useState(null); // Tracks parentId for next user message
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5000/conversations/${conversationId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMessages(response.data);
          // Set currentParentId to the last user message's _id, if any
          const lastUserMessage = response.data
            .filter((msg) => msg.type === 'user')
            .pop();
          setCurrentParentId(lastUserMessage ? lastUserMessage._id : null);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/conversations/${conversationId}/messages`, {
        content,
        parentId: currentParentId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const [userMessage, assistantMessage] = response.data;
      setMessages([...messages, userMessage, assistantMessage]);
      setCurrentParentId(userMessage._id); // Next user message will use this user message's _id as parentId
      setContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!conversationId) {
    return <p>Select a conversation</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', padding: '10px' }}>
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
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', marginTop: '10px', padding: '10px' }}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
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