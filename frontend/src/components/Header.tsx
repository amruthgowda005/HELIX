import NotificationBell from './NotificationBell';

const Header = () => {
  return (
    <header className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-[#060B18]/60 backdrop-blur-xl z-20">
      <div className="text-gray-400 font-medium text-xs tracking-wider uppercase font-sans">
        🔮 Predictive Biomedical &amp; Public Health Intelligence Platform
      </div>
      <div className="flex items-center gap-4">
        {/* Live status indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950/20 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-ring-active" />
          Twin Core Operational
        </div>
        <NotificationBell />
        <div className="w-8 h-8 bg-gradient-to-tr from-[#00D4FF] to-[#BD00FF] rounded-xl flex items-center justify-center text-xs font-black text-black shadow-[0_0_15px_rgba(0,212,255,0.3)] transform hover:rotate-12 transition-transform duration-300 cursor-pointer">
          HX
        </div>
      </div>
    </header>
  );
};

export default Header;
