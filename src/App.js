import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { XMPPProvider } from './context/XMPPContext';
import LoginPage from './pages/LoginPage';
import RecommendationPage from './pages/RecommendationPage';
import CreateNodePage from './pages/CreateNodePage';

function App() {
  return (
    <XMPPProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/recommend" element={<RecommendationPage />} />
          <Route path="/create-node" element={<CreateNodePage />} />
        </Routes>
      </Router>
    </XMPPProvider>
  );
}

export default App;
