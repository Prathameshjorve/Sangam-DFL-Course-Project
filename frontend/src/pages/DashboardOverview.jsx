import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { TacticalCityCard } from '../components/TacticalCityCard';
import { Shield, Radio, Activity, RefreshCw, AlertTriangle, FileText, CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const DashboardOverview = () => {
  const [summary, setSummary] = useState(null);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, srvRes] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getServerStatuses()
      ]);
      setSummary(sumRes.data);
      setServers(srvRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to connect to SANGAM Central Coordinator at http://127.0.0.1:8000. Ensure the global server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      await apiService.triggerSync();
      await fetchDashboardData();
    } catch (err) {
      alert("Synchronization partially failed or timed out: " + (err.response?.data?.detail || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const chartData = summary ? Object.keys(summary.reports_by_city || {}).map(city => ({
    name: city.toUpperCase(),
    reports: summary.reports_by_city[city]
  })) : [];

  const chartColors = ['#222A1E', '#4B5840', '#637355', '#3A4832'];

  return (
    <div className="min-h-screen bg-[#4C5744] p-4 md:p-8">
      {/* Outer Tactical Canvas Shell directly styled from the supplied template */}
      <div className="max-w-7xl mx-auto bg-[#FFFFFF] rounded-2xl shadow-2xl overflow-hidden border border-[#D5DDD0]">
        
        {/* Top Tactical Banner Header */}
        <div className="p-8 md:p-12 pb-6 border-b border-[#E3E8DC] relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF2E9] rounded text-xs font-bold uppercase tracking-wider text-[#404D36] mb-3 border border-[#D0DBCA]">
                <Activity className="w-3.5 h-3.5 text-[#5B6D4C]" />
                <span>Operational Readiness • Distributed Grid Active</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-[#1E251A] tracking-tight uppercase">
                Country <span className="bg-[#5B6D4C] text-[#FFFFFF] px-2 py-0.5 rounded-sm">Secured</span>
              </h1>
              <p className="text-sm text-[#5B6B50] mt-3 leading-relaxed font-medium">
                SANGAM Multi-City Text Intelligence Platform aggregates suspicious activity streams across Mumbai, Bengaluru, Kolkata, and Chennai edge nodes, identifying cross-jurisdiction entity correlations in real-time.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="flex items-center gap-2 bg-[#2D3627] hover:bg-[#3D4935] text-white px-5 py-3 rounded-sm font-bold text-xs uppercase tracking-widest transition shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Aggregating...' : 'Sync All Nodes'}</span>
              </button>
            </div>
          </div>

          {/* Quick status bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#EAEFE5]">
            <div className="bg-[#F6F8F3] p-3 rounded border border-[#DFE7D8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#68795A] block">Total Ingested Reports</span>
              <span className="text-2xl font-black text-[#1E251A]">{summary?.total_reports ?? 0}</span>
            </div>
            <div className="bg-[#F6F8F3] p-3 rounded border border-[#DFE7D8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#68795A] block">Cross-City Correlations</span>
              <span className="text-2xl font-black text-[#2E6B3E]">{summary?.potential_correlations ?? 0}</span>
            </div>
            <div className="bg-[#F6F8F3] p-3 rounded border border-[#DFE7D8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#68795A] block">High Priority Review</span>
              <span className="text-2xl font-black text-[#962A2A]">{summary?.high_priority_reports ?? 0}</span>
            </div>
            <div className="bg-[#F6F8F3] p-3 rounded border border-[#DFE7D8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#68795A] block">Active Edge Nodes</span>
              <span className="text-2xl font-black text-[#1E251A]">{summary?.servers_online ?? 0} / {summary?.servers_total ?? 4}</span>
            </div>
          </div>
        </div>

        {/* City Nodes Section: Reproducing the 3-4 Hero Cards from user's image */}
        <div className="p-8 md:p-12 bg-[#F9FAF7]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#5B6D4C] block">Tactical Command Units</span>
              <h2 className="text-2xl font-black uppercase text-[#1F251C]">Autonomous City Nodes</h2>
            </div>
            <Link to="/cities" className="text-xs font-bold text-[#445239] hover:text-[#182013] uppercase tracking-wider flex items-center gap-1">
              <span>View Node Control</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servers.map((srv, idx) => {
              const variant = idx === 0 ? 'dark' : idx === 1 ? 'medium' : 'lighter';
              return (
                <TacticalCityCard
                  key={srv.city}
                  city={srv.city}
                  displayName={srv.display_name}
                  status={srv.is_online ? 'online' : 'offline'}
                  isOnline={srv.is_online}
                  port={srv.port}
                  reportCount={srv.total_events}
                  pendingCount={srv.pending_review_count}
                  modelName={srv.model_name}
                  modelVersion={srv.model_version}
                  responseTime={srv.response_time_ms}
                  colorVariant={variant}
                />
              );
            })}
          </div>
        </div>

        {/* Lower Intelligence Analytics & Stream */}
        <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-[#E5EADF]">
          
          {/* City Distribution Chart */}
          <div className="lg:col-span-1 bg-[#FFFFFF] p-6 rounded border border-[#DCE4D6] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black uppercase text-[#20271B] flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#506143]" />
                <span>Reports By Jurisdiction</span>
              </h3>
              <p className="text-xs text-[#627354] mt-1">Ingestion distribution across local databases</p>
            </div>

            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#4C5744" fontSize={11} fontStyle="bold" />
                  <YAxis stroke="#4C5744" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#20271B', color: '#FFFFFF', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <Bar dataKey="reports" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] text-[#718263] border-t border-[#EAEFE5] pt-3 mt-2 flex justify-between">
              <span>Last Synchronized:</span>
              <span className="font-mono font-semibold text-[#20271B]">
                {summary?.last_sync_timestamp ? new Date(summary.last_sync_timestamp).toLocaleTimeString() : 'Awaiting Ingestion'}
              </span>
            </div>
          </div>

          {/* Recent Ingested Tactical Reports */}
          <div className="lg:col-span-2 bg-[#FFFFFF] p-6 rounded border border-[#DCE4D6] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black uppercase text-[#20271B] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#506143]" />
                  <span>Recent Intelligence Ingestions</span>
                </h3>
                <p className="text-xs text-[#627354] mt-1">Live telemetry received through local city NLP endpoints</p>
              </div>
              <Link to="/events" className="text-xs font-bold text-[#445239] hover:underline uppercase tracking-wider">
                All Logs
              </Link>
            </div>

            <div className="space-y-3">
              {(summary?.recent_activity || []).map((ev) => (
                <div key={ev.event_id} className="p-3.5 bg-[#F6F8F3] hover:bg-[#EEF3EA] rounded border border-[#DFE7D8] flex items-start justify-between gap-4 transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#2D3627] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {ev.city}
                      </span>
                      <span className="text-xs font-bold text-[#20271B]">{ev.reported_area}</span>
                      <span className="text-[10px] font-mono text-[#6A7B5C]">
                        {ev.report_date} {ev.report_time}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A573F] line-clamp-2">{ev.text_description}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#404D36] text-white mb-1">
                      {ev.predicted_category}
                    </span>
                    <span className="block text-[10px] text-[#6A7B5C]">
                      Priority: <strong className="text-[#1E251A]">{ev.review_priority}</strong>
                    </span>
                  </div>
                </div>
              ))}
              {(!summary?.recent_activity || summary.recent_activity.length === 0) && (
                <div className="text-center py-10 text-sm text-[#738466]">
                  No intelligence reports recorded yet. Click "Sync All Nodes" or submit a new city report.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
