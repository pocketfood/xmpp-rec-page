import React, { useState, useEffect } from 'react';
import { xml } from '@xmpp/client';
import { Link } from 'react-router-dom';
import './RecommendationPage.css';
import { useXMPP } from '../context/XMPPContext';

export default function RecommendationPage() {
  const { xmpp, user, connected } = useXMPP();
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState('');
  const [movies, setMovies] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [userCounts, setUserCounts] = useState({});

  const ADMIN_USERNAMES = ['piff', 'matt', 'kevin'];
  const isAdmin = (username) => ADMIN_USERNAMES.includes(username);

  const handleSubmit = async () => {
    if (!xmpp || !user) {
      setStatus('❌ You must be logged in.');
      return;
    }

    const itemId = `movie-${Date.now()}`;
    const pubsubService = `pubsub.${xmpp.jid.domain}`;

    const stanza = xml(
      'iq',
      { type: 'set', to: pubsubService, id: 'pub1' },
      xml('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' },
        xml('publish', { node: 'movies' },
          xml('item', { id: itemId },
            xml('movie', { xmlns: 'urn:xmpp:movies' }, [
              xml('title', {}, title),
              xml('image', {}, image),
              xml('desc', {}, desc),
              xml('user', {}, user)
            ])
          )
        )
      )
    );

    try {
      await xmpp.send(stanza);
      setStatus('✅ Movie submitted!');
      setTitle('');
      setImage('');
      setDesc('');
    } catch (err) {
      console.error('❌ Publish failed:', err);
      setStatus('❌ Failed to publish. Check console.');
    }
  };

  const deleteMovie = async (itemId) => {
    const pubsubService = `pubsub.${xmpp.jid.domain}`;

    const stanza = xml(
      'iq',
      { type: 'set', to: pubsubService, id: `del-${itemId}` },
      xml('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' },
        xml('retract', { node: 'movies' },
          xml('item', { id: itemId })
        )
      )
    );

    try {
      await xmpp.send(stanza);
      setStatus(`🗑️ Removed ${itemId}`);
      setMovies((prev) => {
        const updated = prev.filter((m) => m.id !== itemId);
        setItemCount(updated.length);
        const counts = {};
        updated.forEach((m) => {
          if (m.user) counts[m.user] = (counts[m.user] || 0) + 1;
        });
        setUserCounts(counts);
        return updated;
      });
    } catch (err) {
      console.error('❌ Failed to delete item:', err);
      setStatus('❌ Delete failed. Check console.');
    }
  };

  useEffect(() => {
    if (!xmpp || !connected) return;

    const pubsubService = `pubsub.${xmpp.jid.domain}`;

    const fetchMovies = async () => {
      const getItemsStanza = xml(
        'iq',
        { type: 'get', to: pubsubService, id: 'get1' },
        xml('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' },
          xml('items', { node: 'movies' })
        )
      );

      xmpp.once('stanza', (response) => {
        const items = response.getChild('pubsub')?.getChild('items')?.getChildren('item') || [];
        const parsed = items.map((item) => {
          const movie = item.getChild('movie', 'urn:xmpp:movies');
          return {
            id: item.attrs.id,
            title: movie?.getChildText('title'),
            image: movie?.getChildText('image'),
            desc: movie?.getChildText('desc'),
            user: movie?.getChildText('user'),
          };
        });
        setMovies(parsed);
        setItemCount(parsed.length);
        const counts = {};
        parsed.forEach((m) => {
          if (m.user) counts[m.user] = (counts[m.user] || 0) + 1;
        });
        setUserCounts(counts);
      });

      try {
        await xmpp.send(getItemsStanza);
      } catch (err) {
        console.error('❌ Failed to fetch items:', err);
      }
    };

    const subscribeToPubSub = async () => {
      const stanza = xml(
        'iq',
        { type: 'set', to: pubsubService, id: 'sub1' },
        xml('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' },
          xml('subscribe', {
            node: 'movies',
            jid: xmpp.jid.toString().split('/')[0]
          })
        )
      );

      try {
        await xmpp.send(stanza);
        console.log(`✅ Subscribed to ${pubsubService}`);
      } catch (err) {
        console.error('❌ Subscription failed:', err);
      }
    };

    fetchMovies();
    subscribeToPubSub();

    const handleMessage = (stanza) => {
      if (!stanza.is('message')) return;

      const event = stanza.getChild('event', 'http://jabber.org/protocol/pubsub#event');
      if (!event) return;

      const items = event.getChild('items')?.getChildren('item') || [];
      const newMovies = items.map((item) => {
        const movie = item.getChild('movie', 'urn:xmpp:movies');
        if (!movie) return null;

        return {
          id: item.attrs.id,
          title: movie.getChildText('title'),
          image: movie.getChildText('image'),
          desc: movie.getChildText('desc'),
          user: movie.getChildText('user'),
        };
      }).filter(Boolean);

      if (newMovies.length > 0) {
        setMovies((prev) => {
          const updated = [...prev, ...newMovies];
          setItemCount(updated.length);
          const counts = {};
          updated.forEach((m) => {
            if (m.user) counts[m.user] = (counts[m.user] || 0) + 1;
          });
          setUserCounts(counts);
          return updated;
        });
      }
    };

    xmpp.on('stanza', handleMessage);
    return () => {
      xmpp.removeListener('stanza', handleMessage);
    };
  }, [xmpp, connected]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Recommend a Movie</h2>
      <p>Logged in as <b>{user}</b></p>
      <p>Total submissions: <b>{itemCount}</b></p>

      {Object.keys(userCounts).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Top Contributors:</h4>
          <ul>
            {Object.entries(userCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <li key={name}>
                  <strong>{name}</strong>: {count} {count === 1 ? 'entry' : 'entries'}
                </li>
              ))}
          </ul>
        </div>
      )}

      <Link to="/create-node">
        <button style={{ marginBottom: '1rem' }}>Create Node</button>
      </Link>

      <div>
        <input
          placeholder="Movie Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
        />
        <input
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
        />
        <textarea
          placeholder="Short Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={{ display: 'block', marginBottom: '0.5rem', width: '100%', height: '100px' }}
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}

      <hr />

      <h3>Submitted Movies:</h3>
      <div>
        {movies.length === 0 ? (
          <p>No movies submitted yet.</p>
        ) : (
          movies.map((movie, i) => (
            <div key={i} className="movie-card">
              <div className="movie-header">
                <span className="movie-title">{movie.title}</span>
                <span className="movie-user">{movie.user}</span>
              </div>
              <div className="movie-desc">{movie.desc}</div>
              <img src={movie.image} alt={movie.title} className="movie-img" />
              {(movie.user === user || isAdmin(user)) && (
                <button className="movie-delete" onClick={() => deleteMovie(movie.id)}>
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
