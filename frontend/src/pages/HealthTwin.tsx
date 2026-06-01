import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const HealthTwin: React.FC = () => {
  const [trajectory, setTrajectory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // What-If Interventions
  const [intervention, setIntervention] = useState<string>('baseline');

  useEffect(() => {
    const baseProfile = { age: 40, weight: 75, height: 175, systolic_bp: 120, smoking: false, exercise_daily: false };
    
    const fetchTwin = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/personal/health-twin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseProfile)
        });
        if (res.ok) {
          const data = await res.json();
          setTrajectory(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTwin();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-[#00D4FF] animate-pulse">Initializing Digital Health Twin...</div>;
  }

  if (!trajectory) {
    return <div className="p-10 text-center text-red-500">Failed to load Digital Twin.</div>;
  }

  // Format data for Recharts (merge baseline with current intervention for side-by-side comparison)
  const baselineData = trajectory.baseline;
  const interventionData = intervention === 'baseline' ? trajectory.baseline : trajectory.what_if[intervention];

  const chartData = baselineData.map((b: any, i: number) => ({
    year: b.year,
    age: b.age,
    BaseDiabetes: b.diabetes_risk,
    NewDiabetes: interventionData[i].diabetes_risk,
    BaseHeart: b.heart_risk,
    NewHeart: interventionData[i].heart_risk,
    BaseStroke: b.stroke_risk,
    NewStroke: interventionData[i].stroke_risk,
  }));

  const endBaseStroke = baselineData[baselineData.length - 1].stroke_risk;
  const endNewStroke = interventionData[interventionData.length - 1].stroke_risk;
  const strokeReduction = ((endBaseStroke - endNewStroke) / endBaseStroke * 100).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          🫀 Digital Health Twin
          <span className="text-xs font-bold px-2 py-1 bg-[#00D4FF] text-black rounded-full uppercase tracking-widest">Simulator</span>
        </h1>
        <p className="text-gray-400 mt-2">
          Interactive 5-year physiological projection modeling lifestyle interventions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Panel */}
        <div className="lg:col-span-1 bg-[#0D1421] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">What-If Simulator</h2>
          
          <div className="space-y-4">
            <button 
              onClick={() => setIntervention('baseline')}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${intervention === 'baseline' ? 'bg-[#00D4FF]/10 border-[#00D4FF] text-[#00D4FF]' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
            >
              <div className="font-bold">Current Trajectory</div>
              <div className="text-xs opacity-70 mt-1">No lifestyle changes</div>
            </button>

            <button 
              onClick={() => setIntervention('lose_5kg')}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${intervention === 'lose_5kg' ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
            >
              <div className="font-bold">Weight Management</div>
              <div className="text-xs opacity-70 mt-1">Lose 5kg and maintain</div>
            </button>

            <button 
              onClick={() => setIntervention('exercise_30min_daily')}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${intervention === 'exercise_30min_daily' ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
            >
              <div className="font-bold">Active Lifestyle</div>
              <div className="text-xs opacity-70 mt-1">Exercise 30 mins daily</div>
            </button>

            <button 
              onClick={() => setIntervention('reduce_bp_medication')}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${intervention === 'reduce_bp_medication' ? 'bg-orange-900/30 border-orange-500 text-orange-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
            >
              <div className="font-bold">BP Control</div>
              <div className="text-xs opacity-70 mt-1">Reduce systolic BP by 15mmHg</div>
            </button>
          </div>

          {intervention !== 'baseline' && (
            <div className="mt-8 p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
              <p className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1">Potential Impact</p>
              <p className="text-sm text-gray-300">
                This intervention could reduce your 5-year stroke risk by <span className="font-bold text-green-400">{strokeReduction}%</span> compared to your current trajectory.
              </p>
            </div>
          )}
        </div>

        {/* Charts Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">5-Year Stroke Risk Trajectory</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid #1E293B' }} />
                  <Legend />
                  <Line type="monotone" dataKey="BaseStroke" name="Current Trajectory" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  {intervention !== 'baseline' && (
                    <Line type="monotone" dataKey="NewStroke" name="Improved Trajectory" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">5-Year Diabetes Risk Trajectory</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid #1E293B' }} />
                  <Legend />
                  <Line type="monotone" dataKey="BaseDiabetes" name="Current Trajectory" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  {intervention !== 'baseline' && (
                    <Line type="monotone" dataKey="NewDiabetes" name="Improved Trajectory" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthTwin;
