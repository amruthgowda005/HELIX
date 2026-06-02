import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOutbreakData } from '../hooks/useOutbreakData';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const links = [
    { label: 'Dashboard',      icon: '🏠', path: '/' },
    { label: 'Outbreak Map',   icon: '🗺️', path: '/map' },
    { label: 'Symptom Checker',icon: '🩺', path: '/symptoms' },
    { label: 'Alerts',         icon: '🔔', path: '/alerts' },
    { label: 'Personal Risk',  icon: '🧬', path: '/risk' },
    { label: 'Health Twin',    icon: '🫀', path: '/twin' },
  ];
  
  const { total, loading, error } = useOutbreakData();
  const today = new Date().toLocaleDateString();

  return (
    <div className="h-screen w-66 bg-[#060B18]/70 backdrop-blur-xl border-r border-white/5 text-white flex flex-col justify-between select-none">
      <div>
        {/* Brand */}
        <div className="p-6 flex flex-col gap-1 border-b border-white/5 bg-[#00D4FF]/5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] pulse-ring-active"></div>
            <span className="text-3xl font-black tracking-widest text-[#00D4FF] neon-glow-cyan font-display">HELIX</span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/50 font-medium">Biomedical Twin Engine</span>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2 mt-6">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-300 transform active:scale-95 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#00D4FF]/20 to-[#00D4FF]/5 text-[#00D4FF] border border-[#00D4FF]/30 shadow-[0_0_15px_rgba(0,212,255,0.15)] font-semibold' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1 border border-transparent'
                }`}
              >
                <span className="text-lg transition-transform duration-300 group-hover:scale-110">{link.icon}</span>
                <span className="text-sm font-medium tracking-wide">{link.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        {/* SET 1 Badge */}
        <div className="mx-4 px-4 py-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">⚡</span>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Set 1 Complete</p>
          </div>
          <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">Core Predictive Models & Personal Health layer ready.</p>
        </div>

        {/* Data Status Footer */}
        <div className="p-5 border-t border-white/5 bg-[#02050D]/40 text-xs text-gray-500 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Database Engine</span>
            <div className="flex items-center space-x-1.5">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              <span className="font-semibold text-gray-300">
                {loading ? 'Polling...' : error ? 'Error' : `${(total ?? 0).toLocaleString()} cells`}
              </span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Last Sync</span>
            <span>{today}</span>
          </div>
          <div className="text-center pt-2 text-[9px] text-[#00D4FF]/30 border-t border-white/5">
            Phase 11 (XAI Standard)
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
