import React from 'react';

const Sidebar = () => {
  const links = ['Dashboard', 'Outbreak Map', 'Alerts', 'Personal Risk', 'Health Twin', 'Symptom Checker'];

  return (
    <div className="h-screen w-64 bg-[#0A0F1E] border-r border-gray-800 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold tracking-wider text-[#00D4FF]">
        HELIX
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => (
          <a
            key={link}
            href="#"
            className="block px-4 py-2 rounded transition-colors hover:bg-gray-800 hover:text-[#00D4FF]"
          >
            {link}
          </a>
        ))}
      </nav>
      <div className="p-4 text-xs text-gray-500 text-center">
        v1.0.0 (Phase 1)
      </div>
    </div>
  );
};

export default Sidebar;
