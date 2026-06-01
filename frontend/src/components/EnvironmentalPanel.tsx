import React, { useState, useEffect } from 'react';

interface WeatherData {
  city: string;
  temp: number;
  humidity: number;
  rainfall: number;
  aqi: number;
}

interface Correlation {
  variable: string;
  lag_weeks: number;
  pearson: number;
  spearman: number;
  p_value: number;
}

interface RiskMultiplier {
  multiplier: number;
  weather: WeatherData;
  risk_factors: string[];
}

const CITIES = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Jaipur"];
const DISEASES = ["Dengue", "Malaria", "Cholera", "Influenza", "COVID-19"];

const EnvironmentalPanel: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [selectedDisease, setSelectedDisease] = useState(DISEASES[0]);
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [risk, setRisk] = useState<RiskMultiplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [weatherRes, corrRes, riskRes] = await Promise.all([
          fetch(`http://localhost:8000/api/environment/weather?city=${selectedCity}`),
          fetch(`http://localhost:8000/api/environment/correlations?disease=${selectedDisease}&city=${selectedCity}`),
          fetch(`http://localhost:8000/api/environment/risk-multiplier?disease=${selectedDisease}&city=${selectedCity}`)
        ]);

        if (!weatherRes.ok || !corrRes.ok || !riskRes.ok) {
          throw new Error('Failed to fetch environmental data');
        }

        const weatherData = await weatherRes.json();
        const corrData = await corrRes.json();
        const riskData = await riskRes.json();

        setWeather(weatherData);
        setCorrelations(corrData.correlations || []);
        setRisk(riskData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCity, selectedDisease]);

  const getRiskColor = (multiplier: number) => {
    if (multiplier < 1.0) return 'text-green-400 bg-green-900/20 border-green-700';
    if (multiplier <= 1.2) return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
    return 'text-red-400 bg-red-900/20 border-red-700';
  };

  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return { text: 'Good', color: 'text-green-400' };
    if (aqi <= 100) return { text: 'Moderate', color: 'text-yellow-400' };
    if (aqi <= 200) return { text: 'Poor', color: 'text-orange-400' };
    return { text: 'Severe', color: 'text-red-400' };
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 w-full text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold text-[#00D4FF]">
          🌍 Environmental Correlation Engine
        </h2>
        
        <div className="flex gap-4 mt-4 md:mt-0">
          <select 
            value={selectedDisease} 
            onChange={(e) => setSelectedDisease(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 focus:outline-none focus:border-[#00D4FF]"
          >
            {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 focus:outline-none focus:border-[#00D4FF]"
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="text-gray-400 animate-pulse text-sm">Analyzing environmental factors...</div>}
      
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {!loading && weather && risk && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Current Weather Widget */}
          <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4 uppercase tracking-wider">Current Conditions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Temperature</p>
                <p className="text-2xl font-bold">{weather.temp.toFixed(1)}°C</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Humidity</p>
                <p className="text-2xl font-bold">{weather.humidity.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Rainfall (1h)</p>
                <p className="text-2xl font-bold text-blue-400">{weather.rainfall.toFixed(1)} mm</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">AQI Index</p>
                <p className={`text-2xl font-bold ${getAqiStatus(weather.aqi).color}`}>
                  {weather.aqi} <span className="text-xs font-normal">({getAqiStatus(weather.aqi).text})</span>
                </p>
              </div>
            </div>
          </div>

          {/* Risk Multiplier Badge */}
          <div className={`p-5 rounded-lg border flex flex-col justify-center items-center text-center ${getRiskColor(risk.multiplier)}`}>
            <h3 className="text-sm font-medium mb-2 opacity-80 uppercase tracking-wider">Weather Risk Multiplier</h3>
            <div className="text-5xl font-black mb-2">{risk.multiplier.toFixed(2)}x</div>
            <p className="text-xs opacity-90 max-w-xs">
              Base prediction is multiplied by this factor based on current local weather.
            </p>
            {risk.risk_factors.length > 0 && (
              <div className="mt-3 text-xs text-left w-full">
                <ul className="list-disc pl-4 space-y-1">
                  {risk.risk_factors.map((factor, idx) => (
                    <li key={idx} className="opacity-80">{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Correlation Heatmap (Top 3) */}
          <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wider">Strongest Correlations</h3>
            {correlations.length === 0 ? (
              <p className="text-gray-500 text-sm">Insufficient historical data to compute correlations.</p>
            ) : (
              <div className="space-y-3">
                {correlations.slice(0, 3).map((corr, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300 capitalize">{corr.variable}</p>
                      <p className="text-xs text-gray-500">Lag: {corr.lag_weeks} weeks</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${corr.pearson > 0.5 ? 'text-red-400' : corr.pearson < -0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {corr.pearson > 0 ? '+' : ''}{corr.pearson.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-500">Pearson (p={corr.p_value.toFixed(3)})</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default EnvironmentalPanel;
