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
    <div className="relative h-[calc(100vh-120px)] w-full rounded-2xl overflow-hidden border border-gray-800 bg-[#0A0F1E] shadow-2xl">
      {/* Filters Overlay */}
      <div className="absolute top-4 left-4 z-[999] bg-[#0D1421]/90 border border-gray-800 p-4 rounded-xl shadow-xl flex flex-col gap-3 min-w-[220px] backdrop-blur">
        <span className="text-xs uppercase tracking-widest text-[#00D4FF] font-bold">
          🌍 Spatial Filters
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
        >
          <option value="All">All Pathogens</option>
          <option value="Dengue">Dengue</option>
          <option value="Malaria">Malaria</option>
          <option value="Cholera">Cholera</option>
          <option value="Influenza">Influenza</option>
          <option value="COVID-19">COVID-19</option>
        </select>
        <div className="text-[10px] text-gray-500 space-y-1">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Critical Risk (&gt;80)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" /> High Risk (61-80)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Moderate Risk (31-60)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Low Risk (0-30)</div>
        </div>
      </div>

      {/* Pulsing Live Badge Overlay */}
      <div className="absolute top-4 right-4 z-[999] bg-[#0D1421]/90 border border-gray-800 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 backdrop-blur">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
        <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">LIVE DATA FEED</span>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-[#0A0F1E]/80 backdrop-blur z-[9999] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 font-medium">Resolving geo-spatial projections...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-[#0A0F1E]/80 backdrop-blur z-[9999] flex items-center justify-center">
          <div className="bg-red-900/30 border border-red-800 p-6 rounded-xl max-w-md text-center">
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
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-white min-w-[180px] space-y-2 font-sans">
                  <h3 className="font-bold text-[#00D4FF] text-sm border-b border-gray-800 pb-1">{r.region}</h3>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div className="flex justify-between"><span>Dominant Pathogen:</span> <span className="font-semibold text-white">{r.dominant_disease}</span></div>
                    <div className="flex justify-between"><span>Active Cases (Est):</span> <span className="font-semibold text-white">{r.estimated_cases.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Risk Index:</span> <span className="font-bold" style={{ color: getRiskColor(r.risk_score) }}>{r.risk_score}%</span></div>
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
