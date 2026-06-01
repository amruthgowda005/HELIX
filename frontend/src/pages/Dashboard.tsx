import React, { useState, useEffect } from 'react';
import PredictionChart from '../components/PredictionChart';
import EnvironmentalPanel from '../components/EnvironmentalPanel';
import SymptomTrends from '../components/SymptomTrends';
import RiskSummaryCard from '../components/RiskSummaryCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SummaryData {
  total_active_cases: number;
  high_risk_regions: string[];
  alerts_today: number;
  prediction_accuracy: number;
  region_risk_matrix: Array<{
    region: string;
    Dengue: number;
    Malaria: number;
    Cholera: number;
    Influenza: number;
    'COVID-19': number;
    risk_score: number;
    estimated_cases: number;
    dominant_disease: string;
    trend: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/dashboard/summary');
      if (!resp.ok) throw new Error('Data Sync Offline');
      const stats = await resp.json();
      setData(stats);
      
      // Generate simulated 30-day case volumes for the Outbreak Trend Chart
      const baseDate = new Date();
      const generatedTrends = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        generatedTrends.push({
          date: d.toISOString().split('T')[0].slice(5),
          Dengue: Math.round(1800 + Math.sin(i / 3) * 400 + Math.random() * 100),
          Malaria: Math.round(900 + Math.cos(i / 2) * 200 + Math.random() * 50),
          Cholera: Math.round(600 + Math.sin(i / 4) * 150 + Math.random() * 80),
          Influenza: Math.round(2200 + Math.cos(i / 4) * 600 + Math.random() * 120),
          'COVID-19': Math.round(1400 + Math.sin(i / 2) * 300 + Math.random() * 80),
        });
      }
      setTrendData(generatedTrends);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // Auto-refresh summary counters and trends every 30 seconds
    const timer = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(timer);
  }, []);

  const getHeatmapColor = (score: number) => {
    if (score < 20) return 'bg-green-950/20 text-green-400 border border-green-900/30';
    if (score < 50) return 'bg-yellow-950/20 text-yellow-400 border border-yellow-900/30';
    if (score < 75) return 'bg-orange-950/20 text-orange-400 border border-orange-900/30';
    return 'bg-red-950/20 text-red-400 border border-red-900/30 font-bold';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* KPI Skeleton Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0D1421] border border-gray-800 h-28 rounded-xl" />
          ))}
        </div>
        {/* Widget Skeleton */}
        <div className="bg-[#0D1421] border border-gray-800 h-96 rounded-xl" />
        <div className="bg-[#0D1421] border border-gray-800 h-80 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-900/50 rounded-xl text-center text-red-400 max-w-md mx-auto mt-12">
        <span className="text-3xl block mb-2">⚠️</span>
        <p className="font-semibold">{error || 'Data synchronization error'}</p>
        <button onClick={fetchDashboardStats} className="mt-4 px-4 py-2 bg-red-900/40 text-white rounded-lg text-sm">
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl hover:border-[#00D4FF]/40 transition duration-300">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">Total Active Cases (Est)</span>
          <p className="text-3xl font-black text-[#00D4FF]">{data.total_active_cases.toLocaleString()}</p>
        </div>
        {/* Card 2 */}
        <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl hover:border-[#00D4FF]/40 transition duration-300">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">High-Risk Zones</span>
          <p className="text-3xl font-black text-red-400">{data.high_risk_regions.length} Regions</p>
        </div>
        {/* Card 3 */}
        <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl hover:border-[#00D4FF]/40 transition duration-300">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">Active Alerts Logged</span>
          <p className="text-3xl font-black text-orange-400">{data.alerts_today} Today</p>
        </div>
        {/* Card 4 */}
        <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl hover:border-[#00D4FF]/40 transition duration-300">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">Prediction Accuracy</span>
          <p className="text-3xl font-black text-green-400">{data.prediction_accuracy}%</p>
        </div>
      </div>

      {/* Outbreak Volume Trends */}
      <div className="bg-[#0D1421] border border-gray-800 p-6 rounded-xl">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">📈 Pathogen Outbreak Waveforms</h2>
          <p className="text-xs text-gray-500 mt-0.5">Aggregated daily positive diagnoses across 5 tracked pathogens.</p>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorDengue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFlu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid #1E293B' }} />
              <Legend iconType="circle" fontSize={11} />
              <Area type="monotone" dataKey="Dengue" stroke="#EF4444" fillOpacity={1} fill="url(#colorDengue)" strokeWidth={2} />
              <Area type="monotone" dataKey="Influenza" stroke="#00D4FF" fillOpacity={1} fill="url(#colorFlu)" strokeWidth={2} />
              <Area type="monotone" dataKey="COVID-19" stroke="#10B981" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="Malaria" stroke="#F59E0B" fill="none" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <RiskSummaryCard />
        </div>
        <div className="xl:col-span-2 bg-[#0D1421] border border-gray-800 p-6 rounded-xl overflow-x-auto">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">⚡ Climate-Driven Pathogen Risk Grid</h2>
            <p className="text-xs text-gray-500 mt-0.5">Calculated relative disease load matrix per region.</p>
          </div>
          <table className="w-full text-left text-xs text-gray-400 border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Dengue</th>
                <th className="py-2.5 px-3">Malaria</th>
                <th className="py-2.5 px-3">Cholera</th>
                <th className="py-2.5 px-3">Influenza</th>
                <th className="py-2.5 px-3">COVID-19</th>
                <th className="py-2.5 px-3 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {data.region_risk_matrix.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-850 hover:bg-gray-800/10">
                  <td className="py-3 px-3 font-semibold text-white">{r.region}</td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] ${getHeatmapColor(r.Dengue)}`}>{r.Dengue}%</span></td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] ${getHeatmapColor(r.Malaria)}`}>{r.Malaria}%</span></td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] ${getHeatmapColor(r.Cholera)}`}>{r.Cholera}%</span></td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] ${getHeatmapColor(r.Influenza)}`}>{r.Influenza}%</span></td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] ${getHeatmapColor(r['COVID-19'])}`}>{r['COVID-19']}%</span></td>
                  <td className="py-3 px-3 text-right font-black text-white">{r.risk_score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Environmental risk */}
        <div className="xl:col-span-3">
          <EnvironmentalPanel />
        </div>
      </div>

      {/* Surveillance and Predictions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SymptomTrends />
        <PredictionChart />
      </div>
    </div>
  );
};

export default Dashboard;
