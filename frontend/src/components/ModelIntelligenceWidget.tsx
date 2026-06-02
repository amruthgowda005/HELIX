import React from 'react';

const ModelIntelligenceWidget: React.FC = () => {
  return (
    <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl flex flex-col justify-between h-full">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🧠 Model Intelligence <span className="text-[9px] uppercase tracking-widest bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-0.5 rounded font-black">XAI</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">Global feature importance across all active predictions.</p>
      </div>

      <div className="mt-4 space-y-3 flex-1 flex flex-col justify-center">
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌧️</span>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Rainfall (7-day lag)</p>
              <p className="text-[10px] text-gray-500">Currently the #1 predictor globally</p>
            </div>
          </div>
          <span className="text-red-400 font-bold text-sm">+32%</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🤒</span>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Symptom Clustering</p>
              <p className="text-[10px] text-gray-500">DBSCAN regional spikes</p>
            </div>
          </div>
          <span className="text-red-400 font-bold text-sm">+24%</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📈</span>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Historical Trend</p>
              <p className="text-[10px] text-gray-500">ARIMA baseline impact</p>
            </div>
          </div>
          <span className="text-red-400 font-bold text-sm">+18%</span>
        </div>
      </div>
      
      <div className="mt-4 text-[10px] text-gray-500 text-center italic border-t border-gray-800 pt-3">
        "Currently, Heavy Rainfall is the primary driver of new Dengue and Malaria outbreak alerts across the country."
      </div>
    </div>
  );
};

export default ModelIntelligenceWidget;
