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
      <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl flex flex-col justify-center items-center h-full text-center">
        <h2 className="text-lg font-bold text-white mb-2">Personal Risk Profile</h2>
        <p className="text-sm text-gray-500 mb-4">Complete your assessment to see your personal risk prediction for chronic diseases.</p>
        <button 
          onClick={() => navigate('/risk')}
          className="px-4 py-2 bg-[#00D4FF] text-black font-semibold rounded hover:bg-cyan-400 transition"
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
    return 'text-green-400';
  };

  return (
    <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Your Risk Profile</h2>
        <button onClick={() => navigate('/risk')} className="text-xs text-[#00D4FF] hover:underline">View Details</button>
      </div>
      
      <div className="flex-1 flex flex-col justify-around gap-2">
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded border border-gray-800">
          <span className="text-sm text-gray-300">Diabetes</span>
          <span className={`text-lg font-bold ${getColor(diabRisk)}`}>{diabRisk}%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded border border-gray-800">
          <span className="text-sm text-gray-300">Heart Disease</span>
          <span className={`text-lg font-bold ${getColor(heartRisk)}`}>{heartRisk}%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded border border-gray-800">
          <span className="text-sm text-gray-300">Stroke</span>
          <span className={`text-lg font-bold ${getColor(strokeRisk)}`}>{strokeRisk}%</span>
        </div>
      </div>
    </div>
  );
};

export default RiskSummaryCard;
