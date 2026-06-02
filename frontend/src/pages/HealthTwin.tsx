import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const HealthTwin: React.FC = () => {
  const [trajectory, setTrajectory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    return <div className="p-10 text-center text-[#00D4FF] animate-pulse tech-num">Initializing Digital Health Twin Simulation Engine...</div>;
  }

  if (!trajectory) {
    return <div className="p-10 text-center text-red-500 font-bold">Failed to load Digital Twin.</div>;
  }

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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            🫀 Digital Health Twin
            <span className="text-xs font-black px-2.5 py-1 bg-[#00D4FF] text-black rounded-xl uppercase tracking-widest">
              Live Twin
            </span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Interactive 5-year physiological projection modeling lifestyle interventions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-6">What-If Simulator</h2>
            
            <div className="space-y-4">
              <button 
                onClick={() => setIntervention('baseline')}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 transform active:scale-95 ${
                  intervention === 'baseline' 
                    ? 'bg-[#00D4FF]/10 border-[#00D4FF] text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.15)] font-bold' 
                    : 'bg-gray-900/50 border-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider">Current Trajectory</div>
                <div className="text-[10px] opacity-70 mt-1">No lifestyle changes</div>
              </button>

              <button 
                onClick={() => setIntervention('lose_5kg')}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 transform active:scale-95 ${
                  intervention === 'lose_5kg' 
                    ? 'bg-emerald-950/30 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-bold' 
                    : 'bg-gray-900/50 border-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider">Weight Management</div>
                <div className="text-[10px] opacity-70 mt-1">Lose 5kg and maintain</div>
              </button>

              <button 
                onClick={() => setIntervention('exercise_30min_daily')}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 transform active:scale-95 ${
                  intervention === 'exercise_30min_daily' 
                    ? 'bg-purple-950/30 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(189,0,255,0.15)] font-bold' 
                    : 'bg-gray-900/50 border-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider">Active Lifestyle</div>
                <div className="text-[10px] opacity-70 mt-1">Exercise 30 mins daily</div>
              </button>

              <button 
                onClick={() => setIntervention('reduce_bp_medication')}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 transform active:scale-95 ${
                  intervention === 'reduce_bp_medication' 
                    ? 'bg-orange-950/30 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-bold' 
                    : 'bg-gray-900/50 border-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider">BP Control</div>
                <div className="text-[10px] opacity-70 mt-1">Reduce systolic BP by 15mmHg</div>
              </button>
            </div>
          </div>

          {intervention !== 'baseline' && (
            <div className="mt-8 p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border border-emerald-500/20 rounded-xl">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1.5">Potential Impact</p>
              <p className="text-xs text-white/80 leading-relaxed">
                This intervention could reduce your 5-year stroke risk by <span className="font-bold text-emerald-400 tech-num text-sm">-{strokeReduction}%</span> compared to your current baseline.
              </p>
            </div>
          )}
        </div>

        {/* Charts Panel */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">5-Year Stroke Risk Trajectory</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                  <XAxis dataKey="year" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="BaseStroke" name="Baseline Trajectory" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  {intervention !== 'baseline' && (
                    <Line type="monotone" dataKey="NewStroke" name="Improved Trajectory" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">5-Year Diabetes Risk Trajectory</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                  <XAxis dataKey="year" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="BaseDiabetes" name="Baseline Trajectory" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
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
