import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const FeatureImportanceChart: React.FC = () => {
  const [model, setModel] = useState('Outbreak Engine (Ensemble)');

  const mockData = [
    { feature: 'Rainfall (7d lag)', impact: 32 },
    { feature: 'Symptom Spikes', impact: 24 },
    { feature: 'Historical Baseline', impact: 18 },
    { feature: 'Temperature', impact: 12 },
    { feature: 'Humidity', impact: -8 },
    { feature: 'Interventions', impact: -15 },
  ];

  return (
    <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🧠 Explainable AI (XAI) Matrix
          </h2>
          <p className="text-xs text-gray-500 mt-1">Full-model feature correlation and SHAP waterfall overview.</p>
        </div>
        <select 
          value={model}
          onChange={e => setModel(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-1.5 focus:border-[#00D4FF] outline-none"
        >
          <option>Outbreak Engine (Ensemble)</option>
          <option>Diabetes Risk (Logistic Regression)</option>
          <option>Heart Disease (Random Forest)</option>
          <option>Stroke Guard (Gradient Boosting)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-4">SHAP Waterfall Analysis</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData} layout="vertical" margin={{ left: 100, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="feature" type="category" stroke="#64748B" fontSize={11} width={130} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid #1E293B' }}
                  formatter={(val: any) => [`${val > 0 ? '+' : ''}${val}%`, 'Impact']}
                />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#EF4444' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-300">How it works</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Helix utilizes SHAP (SHapley Additive exPlanations) to crack open the "black box" of our machine learning models.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Each bar represents the exact percentage a specific feature shifted the prediction from the baseline average. Red indicates increased risk, while green indicates protective factors.
          </p>
          <div className="mt-6 border-t border-gray-800 pt-4">
            <h4 className="text-xs font-bold text-white mb-2">Correlation Matrix Summary</h4>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Rainfall ↔ Symptoms</span>
              <span className="text-[#00D4FF]">0.85 (High)</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Temp ↔ Humidity</span>
              <span className="text-yellow-400">0.42 (Moderate)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureImportanceChart;
