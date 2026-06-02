import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RiskSummaryCard: React.FC = () => {
  const [riskData, setRiskData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('helix_personal_risk');
    if (saved) {
      try {
        setRiskData(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (!riskData) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center h-full text-center min-h-[220px]">
        <h2 className="text-base font-bold text-white mb-2">Personal Risk Profile</h2>
        <p className="text-xs text-white/50 mb-5 leading-relaxed max-w-[200px]">Complete your assessment to see your personal risk prediction.</p>
        <button 
          onClick={() => navigate('/risk')}
          className="px-5 py-2.5 bg-gradient-to-r from-[#00D4FF] to-blue-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition shadow-[0_0_15px_rgba(0,212,255,0.3)] transform active:scale-95"
        >
          Start Assessment
        </button>
      </div>
    );
  }

  const diabRisk = Math.round((riskData.diabetes?.risk_probability || 0) * 100);
  const heartRisk = Math.round((riskData.heart_disease?.risk_probability || 0) * 100);
  const strokeRisk = Math.round((riskData.stroke?.risk_probability || 0) * 100);

  const getColor = (risk: number) => {
    if (risk > 66) return 'text-red-400';
    if (risk > 33) return 'text-yellow-400';
    return 'text-emerald-400 neon-glow-emerald';
  };

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white tracking-wide">Personal Risk Profile</h2>
        <button 
          onClick={() => navigate('/risk')} 
          className="text-xs font-bold text-[#00D4FF] hover:underline uppercase tracking-wider"
        >
          View Details
        </button>
      </div>
      
      <div className="flex-1 flex flex-col gap-3.5">
        <div className="flex justify-between items-center p-3.5 bg-gray-950/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
          <span className="text-xs text-white/60 font-semibold tracking-wide">Diabetes Trajectory</span>
          <span className={`text-base font-black tech-num ${getColor(diabRisk)}`}>{diabRisk}%</span>
        </div>
        <div className="flex justify-between items-center p-3.5 bg-gray-950/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
          <span className="text-xs text-white/60 font-semibold tracking-wide">Cardiac Index</span>
          <span className={`text-base font-black tech-num ${getColor(heartRisk)}`}>{heartRisk}%</span>
        </div>
        <div className="flex justify-between items-center p-3.5 bg-gray-950/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
          <span className="text-xs text-white/60 font-semibold tracking-wide">Stroke Probability</span>
          <span className={`text-base font-black tech-num ${getColor(strokeRisk)}`}>{strokeRisk}%</span>
        </div>
      </div>
    </div>
  );
};

export default RiskSummaryCard;
