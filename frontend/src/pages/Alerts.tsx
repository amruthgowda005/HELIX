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
  CRITICAL: 'bg-red-950/20 border-red-900/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
  HIGH:     'bg-orange-950/20 border-orange-900/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]',
  MEDIUM:   'bg-yellow-950/20 border-yellow-900/50 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)]',
  LOW:      'bg-emerald-950/20 border-emerald-900/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
};

const SEVERITY_BADGE: Record<Severity, string> = {
  CRITICAL: 'bg-red-950/40 text-red-400 border border-red-800/40',
  HIGH:     'bg-orange-950/40 text-orange-400 border border-orange-800/40',
  MEDIUM:   'bg-yellow-950/40 text-yellow-400 border border-yellow-800/40',
  LOW:      'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40',
};

const SEVERITY_EMOJI: Record<Severity, string> = {
  CRITICAL: '🚨',
  HIGH:     '⚠️',
  MEDIUM:   '⏳',
  LOW:      'ℹ️',
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
    const interval = setInterval(fetchActive, 10000);
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

  const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#060B18]/90 border border-[#00D4FF] text-white px-6 py-3.5 rounded-xl shadow-2xl text-xs font-bold animate-bounce backdrop-blur-xl">
          {toast}
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">🚨 Early Warning Alert Center</h1>
          <p className="text-xs text-white/50 mt-1">
            Real-time outbreak alerts across 10 regions × 5 pathogens. Auto-refreshes every 10s.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleRunCheck}
            disabled={checkLoading}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/80 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all transform active:scale-95 disabled:opacity-50"
          >
            {checkLoading ? '⏳ Checking...' : '🔄 Run Alert Check'}
          </button>
          <button
            onClick={handleTestAlert}
            disabled={testLoading}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-red-950/20 border border-red-900/50 text-red-400 rounded-xl hover:bg-red-900/40 hover:text-white transition-all transform active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            {testLoading ? '⏳ Triggering...' : '🧪 Trigger Test Alert'}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(sev => {
          const cnt = activeAlerts.filter(a => a.severity === sev).length;
          return (
            <div key={sev} className={`glass-panel p-5 rounded-2xl border ${SEVERITY_STYLES[sev]}`}>
              <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1 font-bold">{sev}</p>
              <p className="text-3xl font-black tech-num">{cnt}</p>
              <p className="text-[10px] opacity-60 mt-0.5">active alerts</p>
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
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 transform active:scale-95 border ${
              filter === f
                ? 'bg-[#00D4FF] border-[#00D4FF] text-black shadow-[0_0_15px_rgba(0,212,255,0.25)]'
                : 'bg-gray-900/50 border-white/5 text-white/50 hover:border-white/20'
            }`}
          >
            {f}
            {f !== 'All' && criticalCount > 0 && f === 'CRITICAL' && (
              <span className="ml-2 bg-red-600 text-white rounded-full px-2 py-0.5 text-[9px] font-black">
                {criticalCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Alerts Feed */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-bold text-white tracking-wide">⚡ Active Alerts</h2>
          <span className="text-xs text-white/40 font-bold uppercase tracking-wider tech-num">{activeAlerts.length} unresolved</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl" />
            ))}
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl block mb-4">✨</span>
            <p className="text-sm font-semibold text-white/70">No active alerts matching the current filter.</p>
            <button onClick={handleRunCheck} className="mt-4 text-xs text-[#00D4FF] hover:underline font-bold">
              Run an alert check now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="px-6 py-5 hover:bg-white/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className={`mt-0.5 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase ${SEVERITY_BADGE[alert.severity]}`}>
                      {SEVERITY_EMOJI[alert.severity]} {alert.severity}
                    </span>
                    <div className="space-y-1">
                      <p className="font-bold text-white text-base tracking-wide">
                        {alert.disease} — {alert.region}
                      </p>
                      <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
                        {alert.message}
                      </p>
                      <p className="text-xs text-emerald-400 font-bold">
                        💡 Action Required: {RECOMMENDED_ACTIONS[alert.severity]}
                      </p>
                      <p className="text-[10px] text-white/30 tech-num font-medium pt-1">
                        {alert.created_at ? new Date(alert.created_at).toLocaleString() : alert.date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolving === alert.id}
                    className="shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/70 rounded-xl hover:border-emerald-500 hover:text-emerald-400 transition-all self-start transform active:scale-95 disabled:opacity-40"
                  >
                    {resolving === alert.id ? '...' : '✓ Resolve'}
                  </button>
                </div>
                <div className="mt-4">
                  <WhyThisPrediction endpoint="alert" payload={alert} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-bold text-white tracking-wide">📋 Alert History</h2>
          <span className="text-xs text-white/40 font-bold uppercase tracking-wider tech-num">{historyTotal} total log files</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70 border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-white/40 uppercase text-[9px] tracking-wider font-bold">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Disease</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map(a => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3.5 text-white/30 tech-num font-bold">#{a.id}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${SEVERITY_BADGE[a.severity]}`}>
                      {SEVERITY_EMOJI[a.severity]} {a.severity}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-white tracking-wide">{a.region}</td>
                  <td className="px-6 py-3.5 font-medium">{a.disease}</td>
                  <td className="px-6 py-3.5 text-white/50 tech-num">{a.date}</td>
                  <td className="px-6 py-3.5 text-right">
                    {a.resolved
                      ? <span className="text-emerald-400 text-[10px] font-black tracking-wider bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-xl">✓ RESOLVED</span>
                      : <span className="text-red-400 text-[10px] font-black tracking-wider bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded-xl">● ACTIVE</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {historyPages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center text-xs text-white/40 bg-white/5">
            <span>Page <strong className="text-white tech-num">{historyPage}</strong> of <strong className="text-white tech-num">{historyPages}</strong></span>
            <div className="flex gap-2">
              <button
                onClick={() => { setHistoryPage(p => Math.max(1, p - 1)); fetchHistory(historyPage - 1); }}
                disabled={historyPage === 1}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition disabled:opacity-30 text-white/80 font-semibold"
              >← Prev</button>
              <button
                onClick={() => { setHistoryPage(p => Math.min(historyPages, p + 1)); fetchHistory(historyPage + 1); }}
                disabled={historyPage === historyPages}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition disabled:opacity-30 text-white/80 font-semibold"
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
