import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';

const WearableVitalsWidget: React.FC = () => {
  const [latest, setLatest] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWearables = async () => {
    try {
      const [resLatest, resTrends] = await Promise.all([
        fetch('http://localhost:8000/api/wearables/latest'),
        fetch('http://localhost:8000/api/wearables/trends?hours=2')
      ]);
      if (resLatest.ok) setLatest(await resLatest.json());
      if (resTrends.ok) {
        const data = await resTrends.json();
        setTrends(data.trends || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWearables();
    const interval = setInterval(fetchWearables, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="glass-panel p-6 rounded-2xl animate-pulse h-full">Loading vitals...</div>;
  if (!latest) return null;

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          ⌚ Live Biometrics
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </h2>
        <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold">sim_device_1</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Heart Rate */}
        <div className="bg-gray-950/50 border border-white/5 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
          <div>
            <span className="text-[9px] uppercase text-white/40 font-bold tracking-widest">Heart Rate</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className={`text-2xl font-black tech-num ${latest.heart_rate > 100 ? 'text-red-400' : 'text-emerald-400 neon-glow-emerald'}`}>
                {latest.heart_rate}
              </span>
              <span className="text-[9px] text-white/30 font-bold uppercase">bpm</span>
            </div>
          </div>
          <div className="h-10 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                <Line type="monotone" dataKey="heart_rate" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-gray-950/50 border border-white/5 p-4 rounded-xl flex flex-col justify-between hover:border-[#00D4FF]/30 transition-colors">
          <div>
            <span className="text-[9px] uppercase text-white/40 font-bold tracking-widest">Oxygenation</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className={`text-2xl font-black tech-num ${latest.spo2 < 95 ? 'text-orange-400' : 'text-[#00D4FF] neon-glow-cyan'}`}>
                {latest.spo2}
              </span>
              <span className="text-[9px] text-white/30 font-bold uppercase">%</span>
            </div>
          </div>
          <div className="h-10 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <YAxis domain={[90, 100]} hide />
                <Line type="monotone" dataKey="spo2" stroke="#00D4FF" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Steps & Sleep */}
        <div className="col-span-2 bg-gray-950/50 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:border-white/10 transition-colors">
          <div>
            <span className="text-[9px] uppercase text-white/40 font-bold tracking-widest block mb-1">Daily Steps</span>
            <span className="text-lg font-black text-white tech-num">{latest.steps.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase text-white/40 font-bold tracking-widest block mb-1">Sleep State</span>
            <span className="text-lg font-black text-purple-400 tech-num">{latest.sleep_hours}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WearableVitalsWidget;
