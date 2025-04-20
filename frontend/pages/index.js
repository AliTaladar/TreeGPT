import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';

export default function Home() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '25%', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
        <Sidebar onConversationSelect={setSelectedConversationId} />
      </div>
      <div style={{ width: '75%', padding: '20px' }}>
        <Chat conversationId={selectedConversationId} />
      </div>
    </div>
  );
}