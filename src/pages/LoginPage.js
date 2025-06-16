import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXMPP } from '../context/XMPPContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const navigate = useNavigate();
  const { connect } = useXMPP();

  const handleLogin = async () => {
    try {
      await connect({ username, password, domain: server });
      navigate('/recommend');
    } catch (err) {
      alert('❌ Login failed. Check console.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login with XMPP</h2>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username (without @domain)"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <input
        value={server}
        onChange={(e) => setServer(e.target.value)}
        placeholder="Server (e.g. xmpp.example.com)"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
