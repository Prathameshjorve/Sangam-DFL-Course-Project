import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { EventTableRow } from '../components/EventTableRow';
import { Search, Filter, RefreshCw, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export const GlobalEventsExplorer = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Filters
  const [city, setCity] = useState('all');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        skip: page * limit,
        limit,
        city: city !== 'all' ? city : undefined,
        priority: priority || undefined,
        verification_status: status || undefined,
        search: search.trim() || undefined
      };
      const res = await apiService.getGlobalEvents(params);
      setEvents(res.data.events || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, city, priority, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchEvents();
  };

  const handleReviewUpdate = async (eventId, eventCity, newStatus) => {
    try {
      await apiService.updateLocalEventReview(eventCity, eventId, newStatus);
      // Trigger sync to update global view
      await apiService.triggerSync();
      fetchEvents();
    } catch (err) {
      alert("Status update failed: " + err.message);
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
                <FileText className="w-3.5 h-3.5 text-[#5B6D4C]" />
                <span>Centralized Event Registry</span>
              </div>
              <h1 className="text-3xl font-black text-[#1E251A] uppercase">Global Intelligence Explorer</h1>
              <p className="text-xs text-[#5B6B50] mt-1">Multi-city ingested tactical events, classified by autonomous city NLP nodes</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={fetchEvents}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#2D3627] hover:bg-[#3D4935] text-white text-xs font-bold rounded-sm uppercase tracking-wider"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-6 pt-6 border-t border-[#E6EBE0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
              <input
                type="text"
                placeholder="Search report text, area, keyword, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#CCD6C4] px-3.5 py-2 pl-9 rounded-sm text-xs font-medium text-[#1E251A] placeholder-[#819273] focus:outline-none focus:border-[#425237]"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6E805E]" />
            </form>

            <select
              value={city}
              onChange={(e) => { setCity(e.target.value); setPage(0); }}
              className="bg-[#FFFFFF] border border-[#CCD6C4] px-3 py-2 rounded-sm text-xs font-semibold text-[#1E251A] focus:outline-none"
            >
              <option value="all">All Jurisdictions</option>
              <option value="mumbai">Mumbai</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="kolkata">Kolkata</option>
              <option value="chennai">Chennai</option>
            </select>

            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(0); }}
              className="bg-[#FFFFFF] border border-[#CCD6C4] px-3 py-2 rounded-sm text-xs font-semibold text-[#1E251A] focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="High">High Review Priority</option>
              <option value="Medium">Medium Review Priority</option>
              <option value="Low">Low Review Priority</option>
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="bg-[#FFFFFF] border border-[#CCD6C4] px-3 py-2 rounded-sm text-xs font-semibold text-[#1E251A] focus:outline-none"
            >
              <option value="">All Verification Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Verified">Verified</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2D3627] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Area & Narrative</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">NLP Keywords</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <EventTableRow 
                  key={ev.event_id} 
                  event={ev} 
                  onReviewStatusUpdate={handleReviewUpdate}
                />
              ))}
              {events.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-[#6D7F5E] text-sm font-medium">
                    No matching intelligence reports found in registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[#FAFBF9] border-t border-[#E3E8DC] flex items-center justify-between text-xs text-[#526345] font-semibold">
          <span>Showing {events.length} of {total} records</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 border border-[#CCD6C4] rounded-sm disabled:opacity-30 hover:bg-[#EEF2E9]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="p-1.5 border border-[#CCD6C4] rounded-sm disabled:opacity-30 hover:bg-[#EEF2E9]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
