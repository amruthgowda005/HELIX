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
    <div className="h-screen w-64 bg-[#0A0F1E] border-r border-gray-800 text-white flex flex-col">
      <div className="p-6 flex flex-col gap-1">
        <span className="text-2xl font-black tracking-widest text-[#00D4FF]">HELIX</span>
        <span className="text-[9px] uppercase tracking-[0.4em] text-[#00D4FF]/40 font-semibold">Biomedical Intelligence</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                isActive 
                  ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-l-2 border-[#00D4FF] font-semibold pl-3.5' 
                  : 'hover:bg-gray-800/60 hover:text-gray-200 text-gray-500 border-l-2 border-transparent'
              }`}
            >
              <span className="text-base w-5 text-center">{link.icon}</span>
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* SET 1 Badge */}
      <div className="mx-3 mb-3 px-3 py-2 bg-green-900/20 border border-green-800/40 rounded-lg">
        <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest">✅ Set 1 Complete</p>
        <p className="text-[9px] text-gray-500 mt-0.5">Core Features Built (Phases 1–10)</p>
      </div>

      {/* Data Status Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${loading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className="truncate">
            {loading ? 'Loading data...' : error ? 'Data Error' : `${(total ?? 0).toLocaleString()} records`}
          </span>
        </div>
        <div className="text-gray-600">Updated: {today}</div>
        <div className="text-center mt-1 text-[10px] text-[#00D4FF]/40">v1.0.0 (Phase 10)</div>
      </div>
    </div>
  );
};

export default Sidebar;
