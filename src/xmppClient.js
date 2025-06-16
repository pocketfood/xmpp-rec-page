import { client } from '@xmpp/client';

export function createXmppClient({ username, password, domain }) {
  return client({
    service: `wss://${domain}:5443/ws`,  // 👈 Custom port and WebSocket path
    domain: domain,                      // JID domain (should match server hostname)
    username: username,
    password: password,
    resource: 'rec-app',                 // Resource identifier
  });
}
