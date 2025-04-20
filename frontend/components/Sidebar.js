import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Sidebar({ onConversationSelect }) {
  const [conversations, setConversations] = useState([]);
  const [title, setTitle] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response.data);
        setConversations(response.data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    fetchConversations();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/conversations', { title }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations([...conversations, response.data]);
      setTitle('');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    onConversationSelect(id);
  };

  return (
    <div style={{ padding: '10px' }}>
      <h2>Conversations</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {conversations.map((conv) => (
          <li
            key={conv._id}
            onClick={() => handleSelect(conv._id)}
            style={{
              margin: '5px 0',
              backgroundColor: selectedId === conv._id ? '#ccc' : 'transparent',
              cursor: 'pointer',
            }}
          >
            {conv.title}
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} style={{ marginTop: '20px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New conversation title"
          style={{ padding: '5px', width: '100%' }}
        />
        <button type="submit" style={{ marginTop: '10px', padding: '5px' }}>
          Create
        </button>
      </form>
    </div>
  );
}