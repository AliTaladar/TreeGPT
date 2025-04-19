import React, { useState } from 'react';

export default function Sidebar() {
  const [conversations, setConversations] = useState([
    { _id: '1', title: 'Conversation 1' },
    { _id: '2', title: 'Conversation 2' },
    { _id: '3', title: 'Conversation 3' },
  ]);
  const [newTitle, setNewTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return; // Prevent empty submissions
    const newId = (conversations.length + 1).toString();
    const newConversation = { _id: newId, title: newTitle };
    setConversations([...conversations, newConversation]);
    setNewTitle('');
  };

  return (
    <div style={{ padding: '10px' }}>
      <h2>Conversations</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {conversations.map((conv) => (
          <li key={conv._id} style={{ margin: '5px 0' }}>{conv.title}</li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
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