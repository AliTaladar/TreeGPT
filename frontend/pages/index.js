import React from 'react';
import Sidebar from '../components/Sidebar';

export default function Home() {
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '0 0 25%', borderRight: '1px solid #ccc' }}>
        <Sidebar />
      </div>
      <div style={{ flex: 1, padding: '20px' }}>
        <h1>Welcome to TreeGPT</h1>
      </div>
    </div>
  );
}