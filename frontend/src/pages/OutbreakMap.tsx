import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths inside Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RegionData {
  region: string;
  lat: number;
  lng: number;
  Dengue: number;
  Malaria: number;
  Cholera: number;
  Influenza: number;
  'COVID-19': number;
  risk_score: number;
  estimated_cases: number;
  dominant_disease: string;
  trend: string;
}

const OutbreakMap: React.FC = () => {
  const [data, setData] = useState<RegionData[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        const resp = await fetch('http://localhost:8000/api/dashboard/summary');
        if (!resp.ok) throw new Error('Failed to fetch spatial statistics');
        const summary = await resp.json();
        setData(summary.region_risk_matrix || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  const getRiskColor = (score: number) => {
    if (score <= 30) return '#10B981'; // Green
    if (score <= 60) return '#F59E0B'; // Yellow
    if (score <= 80) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getRadius = (cases: number) => {
    return Math.max(8, Math.min(30, cases / 180));
  };

  const getTrendArrow = (trend: string) => {
    if (trend === 'up') return '🔺 Rising';
    if (trend === 'down') return '🔻 Declining';
    return '➡️ Stable';
  };

  const filteredRegions = data.filter(r => {
    if (filter === 'All') return true;
    return r.dominant_disease.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="relative h-[calc(100vh-120px)] w-full rounded-3xl overflow-hidden border border-white/5 bg-[#030712] shadow-2xl">
      {/* Filters Overlay */}
      <div className="absolute top-6 left-6 z-[999] bg-[#060B18]/80 border border-white/5 p-5 rounded-2xl shadow-2xl flex flex-col gap-4 min-w-[240px] backdrop-blur-xl">
        <span className="text-xs uppercase tracking-widest text-[#00D4FF] font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] pulse-ring-active" />
          🌍 Spatial Filters
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00D4FF] transition"
        >
          <option value="All">All Pathogens</option>
          <option value="Dengue">Dengue</option>
          <option value="Malaria">Malaria</option>
          <option value="Cholera">Cholera</option>
          <option value="Influenza">Influenza</option>
          <option value="COVID-19">COVID-19</option>
        </select>
        <div className="text-[10px] text-white/50 space-y-2 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" /> Critical Risk (&gt;80)</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#F97316] shadow-[0_0_8px_#F97316]" /> High Risk (61-80)</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" /> Moderate Risk (31-60)</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" /> Low Risk (0-30)</div>
        </div>
      </div>

      {/* Pulsing Live Badge Overlay */}
      <div className="absolute top-6 right-6 z-[999] bg-[#060B18]/80 border border-white/5 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-xl">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
        <span className="text-[10px] uppercase font-bold text-white tracking-widest">LIVE DATA FEED</span>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur z-[9999] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/60 font-semibold tracking-wider uppercase tech-num">Resolving geo-spatial projections...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur z-[9999] flex items-center justify-center">
          <div className="bg-red-950/30 border border-red-800 p-6 rounded-2xl max-w-md text-center">
            <span className="text-2xl mb-2 block">⚠️</span>
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      {!loading && !error && (
        <MapContainer
          center={[22.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {filteredRegions.map((r, idx) => (
            <CircleMarker
              key={idx}
              center={[r.lat, r.lng]}
              radius={getRadius(r.estimated_cases)}
              fillColor={getRiskColor(r.risk_score)}
              color={getRiskColor(r.risk_score)}
              weight={1}
              fillOpacity={0.4}
              stroke={true}
            >
              <Popup>
                <div className="bg-[#060B18] p-4 rounded-xl border border-white/5 text-white min-w-[200px] space-y-2.5 font-sans">
                  <h3 className="font-bold text-[#00D4FF] text-sm border-b border-white/5 pb-2 tracking-wide">{r.region}</h3>
                  <div className="space-y-1.5 text-xs text-white/70">
                    <div className="flex justify-between"><span>Dominant Pathogen:</span> <span className="font-semibold text-white">{r.dominant_disease}</span></div>
                    <div className="flex justify-between"><span>Active Cases (Est):</span> <span className="font-semibold text-white tech-num">{r.estimated_cases.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Risk Index:</span> <span className="font-bold tech-num" style={{ color: getRiskColor(r.risk_score) }}>{r.risk_score}%</span></div>
                    <div className="flex justify-between"><span>7-Day Trend:</span> <span className="font-semibold">{getTrendArrow(r.trend)}</span></div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default OutbreakMap;
