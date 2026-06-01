import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart
} from 'recharts';

const DISEASES = ['Dengue', 'Malaria', 'Cholera', 'Influenza', 'COVID-19'];
const REGIONS = ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Kerala',
  'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Telangana'];
const MODELS = ['ensemble', 'arima', 'prophet', 'lstm'];

interface ForecastData {
  dates: string[];
  forecast: number[];
  lower: number[];
  upper: number[];
  rmse?: number;
  arima_rmse?: number;
  prophet_rmse?: number;
  lstm_rmse?: number;
  model?: string;
}

interface ChartPoint {
  date: string;
  historical?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}

const PredictionChart: React.FC = () => {
  const [disease, setDisease] = useState('Dengue');
  const [region, setRegion] = useState('Delhi');
  const [model, setModel] = useState('ensemble');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/predictions/outbreak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease, region, model, steps: 12 })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Prediction failed');
      }
      const data: ForecastData = await response.json();
      setForecastData(data);

      // Fetch recent historical data for context
      const histResponse = await fetch(
        `http://localhost:8000/api/data/outbreaks?disease=${disease}&region=${region}&limit=26&offset=0`
      );
      const histResult = await histResponse.json();
      const histPoints: ChartPoint[] = histResult.records.map((r: any) => ({
        date: r.date.slice(0, 10),
        historical: r.cases_anonymized
      }));

      // Combine with forecast
      const forecastPoints: ChartPoint[] = data.dates.map((d, i) => ({
        date: d,
        forecast: data.forecast[i],
        lower: data.lower[i],
        upper: data.upper[i]
      }));

      setChartData([...histPoints.slice(-12), ...forecastPoints]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Alert threshold = 1.5× the max historical value in visible range
  const alertThreshold = chartData.length > 0
    ? Math.max(...chartData.map(d => d.historical ?? 0)) * 1.5
    : 500;

  const getRmseColor = (rmse?: number) => {
    if (!rmse) return 'text-gray-400';
    if (rmse < 30) return 'text-green-400';
    if (rmse < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 w-full">
      <h2 className="text-xl font-semibold text-white mb-4">
        🔬 Outbreak Prediction Engine
      </h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={disease}
          onChange={e => setDisease(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00D4FF]"
        >
          {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00D4FF]"
        >
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00D4FF] uppercase"
        >
          {MODELS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
        </select>

        <button
          onClick={fetchForecast}
          disabled={loading}
          className="px-4 py-2 bg-[#00D4FF] text-black font-semibold rounded-lg text-sm hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Forecasting...' : '▶ Run Forecast'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={v => v.slice(5)}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />

              {/* Confidence band */}
              <Area
                type="monotone"
                dataKey="upper"
                fill="#00D4FF"
                stroke="none"
                fillOpacity={0.08}
                name="Upper Bound"
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="lower"
                fill="#0A0F1E"
                stroke="none"
                fillOpacity={1}
                name="Lower Bound"
                legendType="none"
              />

              {/* Historical line */}
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#00D4FF"
                strokeWidth={2.5}
                dot={false}
                name="Historical Cases"
              />

              {/* Forecast line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#FF9500"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                name="Forecast"
              />

              {/* Alert threshold */}
              <ReferenceLine
                y={alertThreshold}
                stroke="#FF4444"
                strokeDasharray="4 4"
                label={{ value: 'Alert Threshold', fill: '#FF4444', fontSize: 10, position: 'right' }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* RMSE Badges */}
          {forecastData && (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <span className="text-gray-400 text-xs">Model:</span>
                <span className="text-[#00D4FF] text-xs font-semibold uppercase">{forecastData.model}</span>
              </div>
              {forecastData.rmse !== undefined && (
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-xs">RMSE:</span>
                  <span className={`text-xs font-bold ${getRmseColor(forecastData.rmse)}`}>
                    {forecastData.rmse.toFixed(2)}
                  </span>
                </div>
              )}
              {forecastData.arima_rmse !== undefined && (
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-xs">ARIMA RMSE:</span>
                  <span className={`text-xs font-bold ${getRmseColor(forecastData.arima_rmse)}`}>
                    {forecastData.arima_rmse.toFixed(2)}
                  </span>
                </div>
              )}
              {forecastData.prophet_rmse !== undefined && (
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-xs">Prophet RMSE:</span>
                  <span className={`text-xs font-bold ${getRmseColor(forecastData.prophet_rmse)}`}>
                    {forecastData.prophet_rmse.toFixed(2)}
                  </span>
                </div>
              )}
              {forecastData.lstm_rmse !== undefined && (
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-xs">LSTM RMSE:</span>
                  <span className={`text-xs font-bold ${getRmseColor(forecastData.lstm_rmse)}`}>
                    {forecastData.lstm_rmse.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-sm">Select a disease and region, then click <strong className="text-[#00D4FF]">Run Forecast</strong></p>
        </div>
      )}
    </div>
  );
};

export default PredictionChart;
