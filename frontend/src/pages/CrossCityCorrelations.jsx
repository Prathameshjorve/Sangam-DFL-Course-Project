import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { GitFork, AlertCircle, CheckCircle, XCircle, Clock, Link2, Sparkles, Filter, ChevronRight } from 'lucide-react';

export const CrossCityCorrelations = () => {
  const [correlations, setCorrelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  const fetchCorrelations = async () => {
    try {
      setLoading(true);
      const params = {
        status_filter: statusFilter || undefined,
        city: cityFilter !== 'all' ? cityFilter : undefined
      };
      const res = await apiService.getCorrelations(params);
      setCorrelations(res.data || []);
    } catch (err) {
      console.error("Failed to fetch correlations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelations();
  }, [statusFilter, cityFilter]);

  const handleUpdateStatus = async (corrId, newStatus) => {
    try {
      await apiService.updateCorrelationStatus(corrId, {
        review_status: newStatus,
        reviewer_notes: `Status marked as ${newStatus} by analyst.`
      });
      fetchCorrelations();
    } catch (err) {
      alert("Failed to update correlation review: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#4C5744] p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-[#FFFFFF] rounded-2xl shadow-2xl overflow-hidden border border-[#D5DDD0]">
        
        {/* Header */}
        <div className="p-8 border-b border-[#E3E8DC] bg-[#FAFBF9]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#EEF2E9] rounded text-[11px] font-bold uppercase tracking-wider text-[#404D36] mb-2 border border-[#D0DBCA]">
                <GitFork className="w-3.5 h-3.5 text-[#5B6D4C]" />
                <span>Distributed Intelligence Engine</span>
              </div>
              <h1 className="text-3xl font-black text-[#1E251A] uppercase">Cross-City Correlation Nexus</h1>
              <p className="text-xs text-[#5B6B50] mt-1">
                Automated similarity detection and entity linkage across autonomous city servers. Note: Text similarity highlights candidate links and requires human verification.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-[#FFFFFF] border border-[#CCD6C4] px-3 py-2 rounded-sm text-xs font-semibold text-[#1E251A] focus:outline-none"
              >
                <option value="all">All Cities</option>
                <option value="mumbai">Mumbai</option>
                <option value="bengaluru">Bengaluru</option>
                <option value="kolkata">Kolkata</option>
                <option value="chennai">Chennai</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#FFFFFF] border border-[#CCD6C4] px-3 py-2 rounded-sm text-xs font-semibold text-[#1E251A] focus:outline-none"
              >
                <option value="">All Review Statuses</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Cards */}
        <div className="p-6 md:p-8 space-y-6 bg-[#F6F8F3]">
          {correlations.map((corr) => (
            <div 
              key={corr.correlation_id}
              className="bg-[#FFFFFF] rounded-lg border border-[#D6DFCF] shadow-sm p-6 relative transition hover:shadow-md"
            >
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8EEE3]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-extrabold text-[#232B1D] bg-[#EAF0E4] px-2.5 py-1 rounded">
                    {corr.correlation_id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {corr.participating_cities.map((c) => (
                      <span key={c} className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-[#323D2A] text-white">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#697B59] uppercase block font-semibold">Similarity Metric</span>
                    <span className="font-mono font-bold text-sm text-[#2E6B3E]">
                      {Math.round(corr.similarity_score * 100)}% Match
                    </span>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded border uppercase ${
                    corr.review_status === 'Confirmed' ? 'bg-[#1E4D27] text-[#A6E8B6] border-[#2A6635]' :
                    corr.review_status === 'Rejected' ? 'bg-[#502424] text-[#F4A8A8] border-[#723636]' :
                    'bg-[#404D36] text-[#D8E6CE] border-[#556648]'
                  }`}>
                    {corr.review_status}
                  </span>
                </div>
              </div>

              {/* Matched attributes badge list */}
              <div className="my-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#697B59] block mb-1.5">
                  Overlapping Text Attributes & Entities:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(corr.matching_attributes || []).map((attr, i) => (
                    <span key={i} className="text-xs bg-[#EAF0E3] text-[#2C3823] px-2.5 py-0.5 rounded-full font-mono font-medium border border-[#D0DDC6]">
                      {attr}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[#4F5E43] mt-2 italic">
                  "{corr.explanation}"
                </p>
              </div>

              {/* Side-by-Side Reports from the Two Cities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#EDF3E8]">
                {(corr.events_summary || []).map((ev, i) => (
                  <div key={i} className="bg-[#FAFBF9] p-4 rounded border border-[#DFE7D7]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-extrabold text-white bg-[#222A1D] px-2 py-0.5 rounded">
                        {ev.city} Section
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#576949]">{ev.event_id}</span>
                    </div>
                    <p className="text-xs font-bold text-[#1E251A] mb-1">{ev.area}</p>
                    <p className="text-xs text-[#4A573F] leading-relaxed mb-3">{ev.text}</p>
                    <div className="flex items-center justify-between text-[11px] text-[#697B59] border-t border-[#E8EDE4] pt-2">
                      <span>Cat: <strong>{ev.category}</strong></span>
                      <span>Priority: <strong>{ev.priority}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reviewer Action Bar */}
              <div className="mt-5 pt-3 border-t border-[#E8EEE3] flex items-center justify-between">
                <span className="text-[11px] text-[#788C67]">
                  Detected on: {new Date(corr.detected_at).toLocaleString()}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(corr.correlation_id, 'Confirmed')}
                    className="flex items-center gap-1 bg-[#2C6339] hover:bg-[#387B47] text-white text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Link</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(corr.correlation_id, 'Rejected')}
                    className="flex items-center gap-1 bg-[#7E2F2F] hover:bg-[#973939] text-white text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {correlations.length === 0 && !loading && (
            <div className="text-center py-16 bg-white rounded-lg border border-[#DCE4D6]">
              <GitFork className="w-10 h-10 text-[#859774] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-[#232B1E]">No cross-city correlations found</p>
              <p className="text-xs text-[#6A7B5B] mt-1">Submit similar reports across multiple city nodes to observe automated link generation.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
