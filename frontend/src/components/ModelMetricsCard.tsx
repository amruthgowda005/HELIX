import React, { useState, useEffect } from 'react';

interface ModelMetric {
  disease: string;
  region: string;
  arima: number | null;
  prophet: number | null;
  lstm: number | null;
}

const ModelMetricsCard: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/predictions/models/metrics');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const getRmseColor = (rmse: number | null) => {
    if (rmse === null) return 'text-gray-500';
    if (rmse < 50) return 'text-green-400';
    if (rmse <= 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMetricDisplay = (rmse: number | null) => {
    if (rmse === null) return 'N/A';
    return rmse.toFixed(2);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 w-full">
      <h2 className="text-xl font-semibold text-white mb-4">
        📊 Model Accuracy (RMSE)
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-gray-400 animate-pulse text-sm">Loading metrics...</div>
      ) : metrics.length === 0 ? (
        <div className="text-gray-500 text-sm">No models trained yet. Run train_all.py.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-gray-800 text-gray-400">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Disease / Region</th>
                <th className="px-4 py-3">ARIMA</th>
                <th className="px-4 py-3">Prophet</th>
                <th className="px-4 py-3 rounded-tr-lg">LSTM</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={`${m.disease}-${m.region}`} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-200">
                    {m.disease} - {m.region}
                  </td>
                  <td className={`px-4 py-3 font-mono ${getRmseColor(m.arima)}`}>
                    {getMetricDisplay(m.arima)}
                  </td>
                  <td className={`px-4 py-3 font-mono ${getRmseColor(m.prophet)}`}>
                    {getMetricDisplay(m.prophet)}
                  </td>
                  <td className={`px-4 py-3 font-mono ${getRmseColor(m.lstm)}`}>
                    {getMetricDisplay(m.lstm)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ModelMetricsCard;
