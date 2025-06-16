import React, { createContext, useContext, useState, useEffect } from 'react';
import { client } from '@xmpp/client';

const XMPPContext = createContext();

export function XMPPProvider({ children }) {
  const [xmpp, setXmpp] = useState(null);
  const [user, setUser] = useState('');
  const [connected, setConnected] = useState(false);

  const connect = async ({ username, password, domain }) => {
    const cleanUsername = username.includes('@') ? username.split('@')[0] : username;

    const randomSuffix = Math.floor(Math.random() * 100000);
    const xmppClient = client({
      service: `wss://${domain}:5443/ws`,
      domain: domain,
      username: cleanUsername,
      password: password,
      resource: `rec-app-${randomSuffix}`, // ✅ unique per session
    });

    xmppClient.on('online', (jid) => {
      console.log('✅ XMPP connected as:', jid.toString());
      setUser(cleanUsername);
      setXmpp(xmppClient);
      setConnected(true);

      // Save credentials to localStorage
      localStorage.setItem(
        'xmpp_credentials',
        JSON.stringify({ username: cleanUsername, password, domain })
      );
    });

    xmppClient.on('error', (err) => {
      console.error('❌ XMPP error:', err);
      setConnected(false);
    });

    xmppClient.on('offline', () => {
      console.warn('🔌 XMPP offline');
      setConnected(false);
    });

    try {
      await xmppClient.start();
    } catch (err) {
      console.error('❌ Failed to start XMPP:', err);
      throw err;
    }
  };

  const disconnect = async () => {
    try {
      await xmpp?.stop();
    } catch (err) {
      console.error('❌ Error during disconnect:', err);
    }
    localStorage.removeItem('xmpp_credentials');
    setUser('');
    setXmpp(null);
    setConnected(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem('xmpp_credentials');
    if (!stored) return;

    const creds = JSON.parse(stored);
    if (creds.username && creds.password && creds.domain) {
      connect(creds).catch((err) => {
        console.error('❌ Auto-login failed:', err);
        localStorage.removeItem('xmpp_credentials');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <XMPPContext.Provider value={{ xmpp, user, connected, connect, disconnect }}>
      {children}
    </XMPPContext.Provider>
  );
}

export function useXMPP() {
  return useContext(XMPPContext);
}
