import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService, CITY_PORTS } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, Send, Cpu, CheckCircle2, AlertTriangle, ArrowLeft, Radio, RefreshCw, FileText, UserCheck } from 'lucide-react';

export const CityDetailView = () => {
  const { cityName } = useParams();
  const selectedCity = (cityName || 'mumbai').toLowerCase();
  const { user } = useAuth();

  const [health, setHealth] = useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [reportedArea, setReportedArea] = useState('');
  const [textDescription, setTextDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState(null);
  const [formError, setFormError] = useState(null);

  const fetchCityNodeData = async () => {
    try {
      setLoading(true);
      const [hRes, pRes, eRes, aRes] = await Promise.all([
        apiService.getCityHealth(selectedCity).catch(e => ({ data: { status: 'offline', error: e.message } })),
        apiService.getCityProfile(selectedCity).catch(() => ({ data: {} })),
        apiService.getCityEvents(selectedCity, { limit: 15 }).catch(() => ({ data: { events: [] } })),
        apiService.getCityAnalyticsSummary(selectedCity).catch(() => ({ data: {} }))
      ]);
      setHealth(hRes.data);
      setProfile(pRes.data);
      setEvents(eRes.data.events || []);
      setAnalytics(aRes.data);
    } catch (err) {
      console.error("City node fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCityNodeData();
    setLastSubmissionResult(null);
    setFormError(null);
  }, [selectedCity]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportedArea || !textDescription) return;

    try {
      setSubmitting(true);
      setFormError(null);
      const payload = {
        reported_area: reportedArea,
        text_description: textDescription,
        source_category: "Tactical Field Terminal Report",
        uploaded_by: user ? `${user.username} (${user.role})` : "Field Intelligence Agent"
      };
      const res = await apiService.submitCityEvent(selectedCity, payload);
      setLastSubmissionResult(res.data);
      setReportedArea('');
      setTextDescription('');
      
      // Refresh local node events
      await fetchCityNodeData();
      
      // Auto-trigger global sync to keep coordinator up to date
      apiService.triggerSync().catch(() => {});
    } catch (err) {
      setFormError("Submission failed: Node might be unreachable at port " + CITY_PORTS[selectedCity]);
    } finally {
      setSubmitting(false);
    }
  };

  const isOnline = health?.status === 'healthy';

  return (
    <div className="min-h-screen bg-[#4C5744] p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-[#FFFFFF] rounded-2xl shadow-2xl overflow-hidden border border-[#D5DDD0]">
        
        {/* City Tab Bar */}
        <div className="bg-[#21281C] px-8 py-4 border-b border-[#35422D] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#A4B692] font-mono mr-2">Select Edge Node:</span>
            {['mumbai', 'bengaluru', 'kolkata', 'chennai'].map((c) => (
              <Link
                key={c}
                to={`/cities/${c}`}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition ${
                  selectedCity === c 
                    ? 'bg-[#526346] text-white shadow-inner' 
                    : 'text-[#C5D4B6] hover:bg-[#2F3A27]'
                }`}
              >
                {c} ({CITY_PORTS[c]})
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-[#52D472]' : 'bg-[#EF4444]'}`}></span>
            <span className="text-white uppercase font-bold">{selectedCity.toUpperCase()} NODE: {isOnline ? 'ONLINE' : 'UNREACHABLE'}</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="p-8 border-b border-[#E3E8DC] bg-[#FAFBF9]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#EEF2E9] rounded text-[11px] font-bold uppercase tracking-wider text-[#404D36] mb-2 border border-[#D0DBCA]">
                <Building2 className="w-3.5 h-3.5 text-[#5B6D4C]" />
                <span>Autonomous Local Node Command</span>
              </div>
              <h1 className="text-3xl font-black text-[#1E251A] uppercase">{selectedCity} Node Control</h1>
              <p className="text-xs text-[#5B6B50] mt-1">
                Dedicated service instance running on Port {CITY_PORTS[selectedCity]}. Houses local MongoDB store and independent text classification model.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="bg-[#EEF3EA] border border-[#CCD8C4] px-3 py-1.5 rounded text-right">
                  <span className="text-[10px] uppercase font-bold text-[#6D805E] block">Authenticated Operator</span>
                  <span className="text-xs font-mono font-bold text-[#1F251A]">{user.username} ({user.role})</span>
                </div>
              )}
              <button
                onClick={fetchCityNodeData}
                className="flex items-center gap-1.5 bg-[#2D3627] hover:bg-[#3D4935] text-white px-3.5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Node</span>
              </button>
            </div>
          </div>

          {/* Cross-City Visibility Alert */}
          <div className="mt-4 p-3 bg-[#EEF2E8] border border-[#CAD5C2] rounded text-xs text-[#3E4D33] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#52D472]"></span>
              <span><strong>Cross-City Intelligence Sharing Active:</strong> Suspicious incidents uploaded here are analyzed by the {selectedCity} model, synchronized to the central Global Model, and immediately visible to analysts and operators across Mumbai, Bengaluru, Kolkata, and Chennai.</span>
            </div>
            <Link to="/events" className="text-xs font-bold text-[#2E6B3E] hover:underline uppercase tracking-wider flex-shrink-0 ml-3">
              View Global Log →
            </Link>
          </div>

          {/* Telemetry Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E6EBE0]">
            <div className="bg-[#FFFFFF] p-3 rounded border border-[#DFE7D8]">
              <span className="text-[10px] uppercase font-bold text-[#6D7F5E] block">Total Node Records</span>
              <span className="text-2xl font-black text-[#20271B]">{analytics?.total_reports ?? events.length}</span>
            </div>
            <div className="bg-[#FFFFFF] p-3 rounded border border-[#DFE7D8]">
              <span className="text-[10px] uppercase font-bold text-[#6D7F5E] block">Pending Review</span>
              <span className="text-2xl font-black text-[#B27D22]">{analytics?.pending_review ?? 0}</span>
            </div>
            <div className="bg-[#FFFFFF] p-3 rounded border border-[#DFE7D8]">
              <span className="text-[10px] uppercase font-bold text-[#6D7F5E] block">High Priority Alerts</span>
              <span className="text-2xl font-black text-[#962A2A]">{analytics?.high_priority ?? 0}</span>
            </div>
            <div className="bg-[#FFFFFF] p-3 rounded border border-[#DFE7D8]">
              <span className="text-[10px] uppercase font-bold text-[#6D7F5E] block">Model Status</span>
              <span className="text-xs font-extrabold text-[#2C6839] block mt-1">ACTIVE (MOCK ADAPTER)</span>
              <span className="text-[10px] text-[#6D7F5E] block">{health?.model_status?.model_name || 'NLP Classifier'}</span>
            </div>
          </div>
        </div>

        {/* Ingestion Form & Local Logs Grid */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#F6F8F3]">
          
          {/* Form */}
          <div className="lg:col-span-5 bg-[#FFFFFF] p-6 rounded-lg border border-[#D5DDD0] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-[#4E5E41]" />
                <h3 className="text-base font-black uppercase text-[#20271B]">Ingest Local Field Report</h3>
              </div>
              <p className="text-xs text-[#5C6E4E] mb-5">
                Submit raw tactical text. The local {selectedCity} model adapter will extract entities, evaluate threat level, and register the incident.
              </p>

              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#334029] mb-1">
                    Reported Area / Sector Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${selectedCity.toUpperCase()} Sector 7 Dock Gate`}
                    value={reportedArea}
                    onChange={(e) => setReportedArea(e.target.value)}
                    className="w-full bg-[#FAFBF9] border border-[#CCD6C4] px-3 py-2 rounded-sm text-xs font-medium text-[#1E251A] focus:outline-none focus:border-[#425237]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#334029] mb-1">
                    Suspicious Narrative / Text Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter observation details, vehicle descriptions, registration numbers, suspicious equipment..."
                    value={textDescription}
                    onChange={(e) => setTextDescription(e.target.value)}
                    className="w-full bg-[#FAFBF9] border border-[#CCD6C4] px-3 py-2 rounded-sm text-xs font-medium text-[#1E251A] focus:outline-none focus:border-[#425237]"
                  ></textarea>
                </div>

                {/* Quick Model Sample Prompts */}
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-[#6D805E] block mb-1.5">Quick Tactical Test Prompts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReportedArea(`${selectedCity.toUpperCase()} North Checkpoint`);
                        setTextDescription("Unmarked white hatchback with missing registration number plate observed loitering near terminal gates.");
                      }}
                      className="px-2 py-1 bg-[#EEF3EA] hover:bg-[#DDE7D6] text-[10px] font-semibold text-[#303D27] rounded border border-[#CCD8C4] transition"
                    >
                      🚗 Suspicious Vehicle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportedArea(`${selectedCity.toUpperCase()} Industrial Warehouse 4`);
                        setTextDescription("Unmarked wooden crate and contraband consignment transferred to small motorized barge without customs pass.");
                      }}
                      className="px-2 py-1 bg-[#EEF3EA] hover:bg-[#DDE7D6] text-[10px] font-semibold text-[#303D27] rounded border border-[#CCD8C4] transition"
                    >
                      📦 Contraband
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportedArea(`${selectedCity.toUpperCase()} Telecom Node B`);
                        setTextDescription("Encrypted tactical radio frequency beacon transmission detected with frequency jammer characteristics.");
                      }}
                      className="px-2 py-1 bg-[#EEF3EA] hover:bg-[#DDE7D6] text-[10px] font-semibold text-[#303D27] rounded border border-[#CCD8C4] transition"
                    >
                      📡 RF Anomaly
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#2D3627] hover:bg-[#3D4935] text-white py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50 mt-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Analyzing & Ingesting...' : 'Submit & Execute Inference'}</span>
                </button>
              </form>
            </div>

            {/* Inference Result Card */}
            {lastSubmissionResult && (
              <div className="mt-5 p-4 bg-[#EDF3E8] border border-[#CAD9C0] rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#23582E]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Inference Succeeded • {lastSubmissionResult.event_id}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#2D3627] text-white rounded font-bold">
                    MODEL: {lastSubmissionResult.model_name}
                  </span>
                </div>
                <div className="text-[11px] space-y-1 text-[#3E4E32]">
                  <p>Classification: <strong className="text-[#1E251A]">{lastSubmissionResult.predicted_category}</strong></p>
                  <p>Priority Rating: <strong>{lastSubmissionResult.review_priority}</strong> (Confidence: <strong>{Math.round(lastSubmissionResult.model_confidence * 100)}%</strong>)</p>
                  <p>Matched Keywords: <strong>{(lastSubmissionResult.matched_keywords || []).join(', ') || 'N/A'}</strong></p>
                  {lastSubmissionResult.extracted_entities && Object.keys(lastSubmissionResult.extracted_entities).length > 0 && (
                    <div className="mt-1 pt-1 border-t border-[#CAD9C0] text-[10px]">
                      <span className="font-bold text-[#23582E]">Extracted Entities:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {Object.entries(lastSubmissionResult.extracted_entities).flatMap(([k, vals]) => 
                          vals.map(v => (
                            <span key={v} className="bg-[#D9E6D1] text-[#24331B] px-1.5 py-0.5 rounded font-mono">
                              {k}: {v}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Model Engine Details */}
            <div className="mt-4 p-3.5 bg-[#1F251C] text-white rounded-sm border border-[#3E4D34] text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#B5C6A3] font-bold">Connected Model Pipeline</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#2E7A3E] text-[9px] font-bold uppercase rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  CONNECTED
                </span>
              </div>
              <div className="text-[11px] text-[#CBD8BE] space-y-0.5 font-mono">
                <div>Model: <strong className="text-white">{health?.model_status?.model_name || `${selectedCity.toUpperCase()} Tactical Classifier`}</strong></div>
                <div>Version: <span className="text-[#9FE6A5]">{health?.model_status?.model_version || 'v1.2.0-neural-mock'}</span></div>
                <div>Status: <span className="text-[#A4E6A3]">{health?.model_status?.status || 'ONLINE & READY'}</span></div>
                <div>Inferences Processed: <span className="text-white font-bold">{health?.model_status?.total_inferences_processed ?? 0}</span></div>
              </div>
            </div>
          </div>

          {/* Local Event Feed */}
          <div className="lg:col-span-7 bg-[#FFFFFF] p-6 rounded-lg border border-[#D5DDD0] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black uppercase text-[#20271B] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#506143]" />
                  <span>{selectedCity.toUpperCase()} In-Memory & MongoDB Log</span>
                </h3>
                <p className="text-xs text-[#627354] mt-0.5">Isolated records stored in local node database collection</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {events.map((ev) => (
                <div key={ev.event_id} className="p-3.5 bg-[#FAFBF9] hover:bg-[#F0F4EC] rounded border border-[#DFE7D8] transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-[#252E20]">{ev.event_id}</span>
                    <span className="text-[10px] bg-[#3B4733] text-white px-2 py-0.5 rounded uppercase font-bold">
                      {ev.predicted_category}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#1F251A]">{ev.reported_area}</p>
                  <p className="text-xs text-[#4E5C43] my-1 leading-relaxed">{ev.text_description}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#6E805E] border-t border-[#E8EDE4] pt-2 mt-2">
                    <span>Priority: <strong>{ev.review_priority}</strong></span>
                    <span>Status: <strong>{ev.verification_status}</strong></span>
                    <span>Model: {ev.model_name}</span>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-16 text-[#728464] text-xs font-medium">
                  No events recorded on this local node. Use the form to submit one.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
