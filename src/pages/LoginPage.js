import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXMPP } from '../context/XMPPContext';
import './LoginPage.css'; // 👈 new CSS file

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const { connect } = useXMPP();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await connect({ username, password, domain: server });
      navigate('/recommend');
    } catch (err) {
      alert('❌ Login failed. Check console.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-image">
          {/* You can swap this out with a logo or hero art later */}
          <div className="image-placeholder">🎬</div>
        </div>
        <div className="login-form">
          <h2>Movie Recommender</h2>
          <input
            placeholder="Username (without @domain)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            placeholder="Server (e.g. xmpp.example.com)"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    </div>
  );
}
