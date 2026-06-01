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
    const interval = setInterval(fetchWearables, 10000); // 10s poll to match simulator
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl animate-pulse h-full">Loading vitals...</div>;
  if (!latest) return null;

  return (
    <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          ⌚ Live Vitals
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </h2>
        <span className="text-[10px] text-gray-500 font-mono">ID: sim_device_1</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Heart Rate */}
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Heart Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black ${latest.heart_rate > 100 ? 'text-red-400' : 'text-green-400'}`}>
                {latest.heart_rate}
              </span>
              <span className="text-[10px] text-gray-500">bpm</span>
            </div>
          </div>
          <div className="h-10 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                <Line type="monotone" dataKey="heart_rate" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Blood Oxygen</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black ${latest.spo2 < 95 ? 'text-orange-400' : 'text-[#00D4FF]'}`}>
                {latest.spo2}
              </span>
              <span className="text-[10px] text-gray-500">%</span>
            </div>
          </div>
          <div className="h-10 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <YAxis domain={[90, 100]} hide />
                <Line type="monotone" dataKey="spo2" stroke="#00D4FF" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Steps */}
        <div className="col-span-2 bg-gray-900 border border-gray-800 p-3 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block">Daily Steps</span>
            <span className="text-lg font-black text-white">{latest.steps.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block">Sleep</span>
            <span className="text-lg font-black text-purple-400">{latest.sleep_hours}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WearableVitalsWidget;
