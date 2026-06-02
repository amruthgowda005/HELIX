import React, { useState, useEffect, useCallback } from 'react';
import WhyThisPrediction from '../components/WhyThisPrediction';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface Alert {
  id: number;
  date: string;
  region: string;
  disease: string;
  severity: Severity;
  message: string;
  resolved: boolean;
  created_at: string | null;
}

interface AlertsResponse {
  alerts: Alert[];
  count: number;
}

interface HistoryResponse {
  alerts: Alert[];
  total: number;
  page: number;
  pages: number;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  CRITICAL: 'bg-red-950/40 border-red-700 text-red-400',
  HIGH:     'bg-orange-950/40 border-orange-700 text-orange-400',
  MEDIUM:   'bg-yellow-950/40 border-yellow-700 text-yellow-400',
  LOW:      'bg-green-950/40 border-green-700 text-green-400',
};

const SEVERITY_BADGE: Record<Severity, string> = {
  CRITICAL: 'bg-red-900/60 text-red-300 border border-red-700',
  HIGH:     'bg-orange-900/60 text-orange-300 border border-orange-700',
  MEDIUM:   'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  LOW:      'bg-green-900/60 text-green-300 border border-green-700',
};

const SEVERITY_EMOJI: Record<Severity, string> = {
  CRITICAL: '🔴',
  HIGH:     '🟠',
  MEDIUM:   '🟡',
  LOW:      '🟢',
};

const RECOMMENDED_ACTIONS: Record<Severity, string> = {
  CRITICAL: 'Activate Emergency Response Protocol. Notify District Health Officer immediately.',
  HIGH:     'Issue public health advisory. Increase surveillance in affected area.',
  MEDIUM:   'Monitor situation closely. Prepare resource inventory.',
  LOW:      'Continue passive surveillance.',
};

const BASE = 'http://localhost:8000';

const Alerts: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<Alert[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPages, setHistoryPages] = useState(1);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchActive = useCallback(async () => {
    try {
      const params = filter !== 'All' ? `?severity=${filter}` : '';
      const r = await fetch(`${BASE}/api/alerts/active${params}`);
      if (!r.ok) throw new Error('Failed');
      const data: AlertsResponse = await r.json();
      setActiveAlerts(data.alerts);
    } catch {
      // silently fail on polling
    }
  }, [filter]);

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const r = await fetch(`${BASE}/api/alerts/history?page=${page}&page_size=50`);
      if (!r.ok) throw new Error('Failed');
      const data: HistoryResponse = await r.json();
      setHistory(data.alerts);
      setHistoryTotal(data.total);
      setHistoryPages(data.pages);
    } catch {/* ignore */}
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchActive(), fetchHistory(historyPage)]);
    setLoading(false);
  }, [fetchActive, fetchHistory, historyPage]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchActive, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchAll, fetchActive]);

  const handleResolve = async (id: number) => {
    setResolving(id);
    try {
      const r = await fetch(`${BASE}/api/alerts/resolve/${id}`, { method: 'POST' });
      if (!r.ok) throw new Error('Resolve failed');
      showToast('✅ Alert resolved successfully.');
      await fetchAll();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setResolving(null);
    }
  };

  const handleTestAlert = async () => {
    setTestLoading(true);
    try {
      const r = await fetch(`${BASE}/api/alerts/test`, { method: 'POST' });
      if (!r.ok) throw new Error('Test failed');
      showToast('🔴 CRITICAL test alert triggered for Delhi / Dengue.');
      await fetchAll();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleRunCheck = async () => {
    setCheckLoading(true);
    try {
      const r = await fetch(`${BASE}/api/alerts/run-check`, { method: 'POST' });
      if (!r.ok) throw new Error('Check failed');
      const data = await r.json();
      showToast(`🔄 Alert check complete — ${data.alerts_generated} alerts generated.`);
      await fetchAll();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setCheckLoading(false);
    }
  };

  const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 border border-[#00D4FF] text-white px-5 py-3 rounded-xl shadow-xl text-sm animate-pulse">
          {toast}
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">🚨 Early Warning Alert Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time outbreak alerts across 10 regions × 5 pathogens. Auto-refreshes every 10s.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleRunCheck}
            disabled={checkLoading}
            className="px-4 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:border-[#00D4FF] transition disabled:opacity-50"
          >
            {checkLoading ? '⏳ Checking...' : '🔄 Run Alert Check'}
          </button>
          <button
            onClick={handleTestAlert}
            disabled={testLoading}
            className="px-4 py-2 text-sm bg-red-950/40 border border-red-700 text-red-400 font-semibold rounded-lg hover:bg-red-900/50 transition disabled:opacity-50"
          >
            {testLoading ? '⏳ Triggering...' : '🧪 Trigger Test Alert'}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(sev => {
          const cnt = activeAlerts.filter(a => a.severity === sev).length;
          return (
            <div key={sev} className={`p-4 rounded-xl border ${SEVERITY_STYLES[sev]}`}>
              <p className="text-xs uppercase tracking-widest opacity-70 mb-1">{sev}</p>
              <p className="text-3xl font-black">{cnt}</p>
              <p className="text-xs opacity-60 mt-0.5">active alerts</p>
            </div>
          );
        })}
      </div>

      {/* Severity Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
              filter === f
                ? 'bg-[#00D4FF] border-[#00D4FF] text-black'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {f}
            {f !== 'All' && criticalCount > 0 && f === 'CRITICAL' && (
              <span className="ml-1.5 bg-red-600 text-white rounded-full px-1.5 py-0.5 text-[9px]">
                {criticalCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Alerts Feed */}
      <div className="bg-[#0D1421] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">⚡ Active Alerts</h2>
          <span className="text-xs text-gray-500">{activeAlerts.length} unresolved</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800/40 rounded-xl" />
            ))}
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <span className="text-4xl block mb-3">✅</span>
            <p className="text-sm">No active alerts matching the current filter.</p>
            <button onClick={handleRunCheck} className="mt-4 text-xs text-[#00D4FF] underline">
              Run an alert check
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="px-6 py-5 hover:bg-gray-800/10 transition group">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${SEVERITY_BADGE[alert.severity]}`}>
                      {SEVERITY_EMOJI[alert.severity]} {alert.severity}
                    </span>
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {alert.disease} — {alert.region}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-xl">
                        {alert.message}
                      </p>
                      <p className="text-[11px] text-[#00D4FF] mt-2 font-medium">
                        💡 {RECOMMENDED_ACTIONS[alert.severity]}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {alert.created_at ? new Date(alert.created_at).toLocaleString() : alert.date}
                      </p>
                    </div>
                    <div className="w-full mt-4">
                      <WhyThisPrediction endpoint="alert" payload={alert} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolving === alert.id}
                    className="shrink-0 px-4 py-1.5 text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 rounded-lg hover:border-green-700 hover:text-green-400 transition disabled:opacity-40 self-start"
                  >
                    {resolving === alert.id ? '...' : '✓ Resolve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert History Table */}
      <div className="bg-[#0D1421] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">📋 Alert History</h2>
          <span className="text-xs text-gray-500">{historyTotal} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-400">
            <thead>
              <tr className="border-b border-gray-800 text-gray-600 uppercase text-[10px] tracking-wider">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Region</th>
                <th className="px-6 py-3">Disease</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {history.map(a => (
                <tr key={a.id} className="hover:bg-gray-800/10">
                  <td className="px-6 py-3 text-gray-600">#{a.id}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SEVERITY_BADGE[a.severity]}`}>
                      {SEVERITY_EMOJI[a.severity]} {a.severity}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-300">{a.region}</td>
                  <td className="px-6 py-3">{a.disease}</td>
                  <td className="px-6 py-3 text-gray-500">{a.date}</td>
                  <td className="px-6 py-3">
                    {a.resolved
                      ? <span className="text-green-500 text-[10px] font-bold">✓ RESOLVED</span>
                      : <span className="text-red-400 text-[10px] font-bold">● ACTIVE</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {historyPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
            <span>Page {historyPage} of {historyPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setHistoryPage(p => Math.max(1, p - 1)); fetchHistory(historyPage - 1); }}
                disabled={historyPage === 1}
                className="px-3 py-1 bg-gray-800 rounded disabled:opacity-30"
              >← Prev</button>
              <button
                onClick={() => { setHistoryPage(p => Math.min(historyPages, p + 1)); fetchHistory(historyPage + 1); }}
                disabled={historyPage === historyPages}
                className="px-3 py-1 bg-gray-800 rounded disabled:opacity-30"
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
