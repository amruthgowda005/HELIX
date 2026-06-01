import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OutbreakMap from './pages/OutbreakMap';
import SymptomChecker from './pages/SymptomChecker';

function App() {
  const [launched, setLaunched] = useState(false);

  if (!launched) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F1E] text-white font-sans">
        <div className="mb-2 text-xs tracking-[0.5em] text-[#00D4FF]/60 uppercase">Helix Platform</div>
        <h1 className="text-7xl font-bold mb-4 tracking-widest text-[#00D4FF] drop-shadow-[0_0_30px_rgba(0,212,255,0.4)]">
          HELIX
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-lg text-center">
          Predictive Biomedical &amp; Public Health Intelligence
        </p>
        <button
          onClick={() => setLaunched(true)}
          className="px-10 py-3 bg-[#00D4FF] text-black font-bold rounded-lg hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_25px_rgba(0,212,255,0.5)] hover:shadow-[0_0_40px_rgba(0,212,255,0.7)] hover:scale-105"
        >
          Launch Dashboard
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<OutbreakMap />} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/alerts" element={<div className="text-gray-400 text-center mt-20 text-lg">🔔 Alert System — Coming in Phase 8</div>} />
        <Route path="/risk" element={<div className="text-gray-400 text-center mt-20 text-lg">🧬 Personal Risk Assessment — Coming Soon</div>} />
        <Route path="/twin" element={<div className="text-gray-400 text-center mt-20 text-lg">🫀 Digital Health Twin — Coming Soon</div>} />
      </Routes>
    </Layout>
  );
}

export default App;
