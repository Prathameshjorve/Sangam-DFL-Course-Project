import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { BarChart3, PieChart, Activity, ShieldCheck, History } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aRes, sRes] = await Promise.all([
          apiService.getCityAnalytics(),
          apiService.getSyncHistory(10)
        ]);
        setAnalytics(aRes.data);
        setSyncHistory(sRes.data || []);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const priorityData = analytics?.priority_distribution ? [
    { name: 'High Priority', value: analytics.priority_distribution['High'] || 0, color: '#8A2B2B' },
    { name: 'Medium Priority', value: analytics.priority_distribution['Medium'] || 0, color: '#B07B28' },
    { name: 'Low Priority', value: analytics.priority_distribution['Low'] || 0, color: '#3E5C38' }
  ] : [];

  return (
    <div className="min-h-screen bg-[#4C5744] p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-[#FFFFFF] rounded-2xl shadow-2xl overflow-hidden border border-[#D5DDD0]">
        
        {/* Header */}
        <div className="p-8 border-b border-[#E3E8DC] bg-[#FAFBF9]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#EEF2E9] rounded text-[11px] font-bold uppercase tracking-wider text-[#404D36] mb-2 border border-[#D0DBCA]">
            <BarChart3 className="w-3.5 h-3.5 text-[#5B6D4C]" />
            <span>Distributed Metrics & Synchronization Log</span>
          </div>
          <h1 className="text-3xl font-black text-[#1E251A] uppercase">Tactical Reports & Telemetry</h1>
          <p className="text-xs text-[#5B6B50] mt-1">Cross-jurisdiction classification telemetry, review load balance, and replication audit records</p>
        </div>

        {/* Charts Grid */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#F6F8F3]">
          
          {/* Priority Breakdown Pie */}
          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#D5DDD0] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black uppercase text-[#20271B] flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#4E5E41]" />
                <span>Threat & Review Priority Breakdown</span>
              </h3>
              <p className="text-xs text-[#627354] mt-0.5">Distribution of human-review urgency across all nodes</p>
            </div>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E251A', color: '#FFF', borderRadius: '4px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-[#EAEFE5] pt-3 text-[11px] text-[#718263] flex justify-between">
              <span>High Alert Percentage:</span>
              <span className="font-bold text-[#8A2B2B]">
                {priorityData.reduce((acc, p) => acc + p.value, 0) > 0 
                  ? Math.round(((priorityData[0]?.value || 0) / priorityData.reduce((acc, p) => acc + p.value, 0)) * 100) 
                  : 0}%
              </span>
            </div>
          </div>

          {/* Sync Audit Trail */}
          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#D5DDD0] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black uppercase text-[#20271B] flex items-center gap-2">
                <History className="w-5 h-5 text-[#4E5E41]" />
                <span>Replication & Synchronization Audit</span>
              </h3>
              <p className="text-xs text-[#627354] mt-0.5">Historical log of inter-service distributed polling passes</p>
            </div>

            <div className="space-y-2.5 mt-4 max-h-64 overflow-y-auto pr-1">
              {syncHistory.map((log) => (
                <div key={log.sync_id} className="p-3 bg-[#FAFBF9] rounded border border-[#DFE7D8] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#20271B] block">{log.sync_id}</span>
                    <span className="text-[10px] text-[#6E805E]">
                      {new Date(log.completed_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-[#3E4C36] text-white">
                      {log.status}
                    </span>
                    <span className="block text-[10px] text-[#6E805E] mt-0.5">
                      +{log.new_events_added} new ({log.correlations_identified} links)
                    </span>
                  </div>
                </div>
              ))}
              {syncHistory.length === 0 && (
                <div className="text-center py-12 text-xs text-[#758667]">
                  No sync audit history recorded yet. Click "Sync All Nodes" on the header.
                </div>
              )}
            </div>

            <div className="border-t border-[#EAEFE5] pt-3 text-[11px] text-[#718263]">
              All synchronizations are duplicate-safe and idempotent.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
