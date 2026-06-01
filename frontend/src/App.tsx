import React, { useState } from 'react';
import Layout from './components/Layout';
import PredictionChart from './components/PredictionChart';

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
          Predictive Biomedical & Public Health Intelligence
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
      <div className="space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-[#00D4FF]/50 transition-colors">
            <h3 className="text-gray-400 text-sm mb-2">Global Risk Index</h3>
            <p className="text-3xl font-bold text-[#00D4FF]">Moderate</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-red-500/50 transition-colors">
            <h3 className="text-gray-400 text-sm mb-2">Active Alerts</h3>
            <p className="text-3xl font-bold text-red-400">12</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors">
            <h3 className="text-gray-400 text-sm mb-2">System Status</h3>
            <p className="text-3xl font-bold text-green-400">Online</p>
          </div>
        </div>

        {/* Prediction Chart */}
        <PredictionChart />
      </div>
    </Layout>
  );
}

export default App;
