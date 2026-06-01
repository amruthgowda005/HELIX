import React, { useState } from 'react';
import Layout from './components/Layout';

function App() {
  const [launched, setLaunched] = useState(false);

  if (!launched) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F1E] text-white font-sans">
        <h1 className="text-6xl font-bold mb-4 tracking-widest text-[#00D4FF]">HELIX</h1>
        <p className="text-xl text-gray-400 mb-12 max-w-lg text-center">
          Predictive Biomedical & Public Health Intelligence
        </p>
        <button 
          onClick={() => setLaunched(true)}
          className="px-8 py-3 bg-[#00D4FF] text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,212,255,0.5)]"
        >
          Launch Dashboard
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-6">Dashboard Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 mb-2">Global Risk Index</h3>
            <p className="text-3xl font-bold text-[#00D4FF]">Moderate</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 mb-2">Active Alerts</h3>
            <p className="text-3xl font-bold text-red-400">12</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 mb-2">System Status</h3>
            <p className="text-3xl font-bold text-green-400">Online</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
