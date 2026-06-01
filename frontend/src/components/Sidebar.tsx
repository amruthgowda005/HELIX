import React from 'react';
import { useOutbreakData } from '../hooks/useOutbreakData';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const links = ['Dashboard', 'Outbreak Map', 'Alerts', 'Personal Risk', 'Health Twin', 'Symptom Checker'];
  const { total, loading, error } = useOutbreakData();

  const today = new Date().toLocaleDateString();

  return (
    <div className="h-screen w-64 bg-[#0A0F1E] border-r border-gray-800 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold tracking-wider text-[#00D4FF]">
        HELIX
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => (
          <button
            key={link}
            onClick={() => setActiveTab(link)}
            className={`block w-full text-left px-4 py-2 rounded transition-colors ${
              activeTab === link 
                ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-l-2 border-[#00D4FF] font-semibold' 
                : 'hover:bg-gray-800 hover:text-[#00D4FF] text-gray-400'
            }`}
          >
            {link}
          </button>
        ))}
      </nav>
      
      {/* Data Status Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span>
            {loading ? 'Loading data...' : error ? 'Data Error' : `${(total ?? 0).toLocaleString()} records loaded`}
          </span>
        </div>
        <div className="text-gray-600">
          Last updated: {today}
        </div>
        <div className="text-center mt-2 text-[10px]">
          v1.0.0 (Phase 2)
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
