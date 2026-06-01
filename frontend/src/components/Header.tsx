import NotificationBell from './NotificationBell';

const Header = () => {
  return (
    <header className="h-16 border-b border-gray-800 flex items-center px-6 justify-between bg-[#0A0F1E]">
      <div className="text-gray-400 font-medium text-sm">
        Predictive Biomedical &amp; Public Health Intelligence
      </div>
      <div className="flex items-center gap-3">
        {/* Live status indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          All systems operational
        </div>
        <NotificationBell />
        <div className="w-8 h-8 bg-gradient-to-br from-[#00D4FF] to-blue-600 rounded-full flex items-center justify-center text-xs font-black text-black">
          H
        </div>
      </div>
    </header>
  );
};

export default Header;
