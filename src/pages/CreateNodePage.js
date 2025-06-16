import React, { useState } from 'react';
import { xml } from '@xmpp/client';
import { useXMPP } from '../context/XMPPContext';

export default function CreateNodePage() {
  const { xmpp, connected } = useXMPP();
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState('');

  const createNode = async () => {
    if (!xmpp || !connected) {
      setStatus('no-connection');
      return;
    }

    setStatus('creating');

    const createStanza = xml(
      'iq',
      { type: 'set', id: 'create1', to: 'pubsub.zinc.metapacific.xyz' },
      xml('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' },
        xml('create', { node: 'movies' })
      )
    );

    xmpp.once('stanza', async (response) => {
      if (response.attrs.type === 'result') {
        setLog('✅ Node created, now configuring...');

        const configStanza = xml(
          'iq',
          { type: 'set', id: 'config1', to: 'pubsub.zinc.metapacific.xyz' },
          xml('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub#owner' },
            xml('configure', { node: 'movies' },
              xml('x', { xmlns: 'jabber:x:data', type: 'submit' }, [
                xml('field', { var: 'FORM_TYPE', type: 'hidden' },
                  xml('value', {}, 'http://jabber.org/protocol/pubsub#node_config')
                ),
                xml('field', { var: 'pubsub#persist_items' },
                  xml('value', {}, '1')
                ),
                xml('field', { var: 'pubsub#access_model' },
                  xml('value', {}, 'open')
                ),
                xml('field', { var: 'pubsub#publish_model' },
                  xml('value', {}, 'open')
                ),
                xml('field', { var: 'pubsub#max_items' },
                  xml('value', {}, '100')
                ),
              ])
            )
          )
        );

        xmpp.once('stanza', (configResponse) => {
          if (configResponse.attrs.type === 'result') {
            setStatus('success');
            setLog('✅ Node configured successfully.');
          } else {
            setStatus('config-error');
            setLog('❌ Configuration failed.');
          }
        });

        await xmpp.send(configStanza);
      } else {
        setStatus('create-error');
        setLog('❌ Node creation failed.');
      }
    });

    try {
      await xmpp.send(createStanza);
    } catch (err) {
      console.error('❌ Error sending create stanza:', err);
      setStatus('error');
      setLog('❌ Failed to send create stanza.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Create PubSub Node</h2>
      <p>This will create the <b>movies</b> node and configure it.</p>
      <button onClick={createNode}>Create Node</button>

      <div style={{ marginTop: '1rem' }}>
        {status === 'no-connection' && <p style={{ color: 'red' }}>❌ You must be logged in first.</p>}
        {status === 'creating' && <p>Creating node...</p>}
        {status === 'success' && <p style={{ color: 'green' }}>{log}</p>}
        {status === 'create-error' && <p style={{ color: 'red' }}>{log}</p>}
        {status === 'config-error' && <p style={{ color: 'orange' }}>{log}</p>}
        {status === 'error' && <p style={{ color: 'red' }}>{log}</p>}
        {log && <pre>{log}</pre>}
      </div>
    </div>
  );
}
