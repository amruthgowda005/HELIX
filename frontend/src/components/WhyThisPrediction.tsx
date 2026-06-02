import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface WhyThisPredictionProps {
  endpoint: string;
  payload: any;
}

const WhyThisPrediction: React.FC<WhyThisPredictionProps> = ({ endpoint, payload }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchExplanation = async () => {
    if (data) {
      setOpen(!open);
      return;
    }
    
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch(`http://localhost:8000/api/explain/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border border-gray-800 rounded-lg bg-[#0A0F1E] overflow-hidden">
      <button 
        onClick={fetchExplanation}
        className="w-full px-4 py-2 flex items-center justify-between text-xs text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors"
      >
        <span className="font-bold flex items-center gap-2">
          🧠 Why this prediction? (XAI)
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-4 border-t border-gray-800">
          {loading ? (
            <div className="animate-pulse text-xs text-gray-500">Generating SHAP explanation...</div>
          ) : data ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-300 italic border-l-2 border-[#00D4FF] pl-3">
                "{data.narrative}"
              </div>
              
              {data.top_features && (
                <div className="h-40 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.top_features} layout="vertical" margin={{ left: 50, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                      <XAxis type="number" stroke="#64748B" fontSize={10} />
                      <YAxis dataKey="feature" type="category" stroke="#64748B" fontSize={10} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid #1E293B', fontSize: '12px' }}
                        formatter={(val: any) => [`${val > 0 ? '+' : ''}${val}% impact`, 'Contribution']}
                      />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {data.top_features.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#EF4444' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {data.features && (
                <div className="h-40 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.features} layout="vertical" margin={{ left: 50, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                      <XAxis type="number" stroke="#64748B" fontSize={10} />
                      <YAxis dataKey="feature" type="category" stroke="#64748B" fontSize={10} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid #1E293B', fontSize: '12px' }}
                        formatter={(val: any) => [`${val > 0 ? '+' : ''}${val}% impact`, 'Contribution']}
                      />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {data.features.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#EF4444' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-red-500">Failed to load explanation.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhyThisPrediction;
