import React from 'react';
import { Award, Radio, Server, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TacticalCityCard = ({ 
  city, 
  displayName, 
  status, 
  reportCount, 
  pendingCount, 
  modelName, 
  modelVersion, 
  isOnline, 
  responseTime, 
  lastSync, 
  colorVariant = 'dark',
  port = 8001
}) => {
  // Styles inspired directly from the reference cards:
  // Card 1: deep olive-dark (#222A1E)
  // Card 2: medium tactical green (#526046)
  // Card 3: olive green (#637355)
  const bgStyles = {
    dark: 'bg-[#1E251A] text-white',
    medium: 'bg-[#4B5840] text-white',
    lighter: 'bg-[#5C6B4E] text-white'
  }[colorVariant] || 'bg-[#1E251A] text-white';

  return (
    <div className={`tactical-beveled-card ${bgStyles} p-6 shadow-md transition-all duration-200 hover:-translate-y-1 relative flex flex-col justify-between min-h-[260px] border border-[#3E4A35]`}>
      {/* Top Section with Title and Badge Insignia cut-out */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#52D472] animate-pulse' : 'bg-[#EF4444]'}`}></span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#B0BF9E]">
                PORT: {port} • {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <h3 className="text-xl font-black tracking-wide mt-2 uppercase font-sans">
              {displayName} SECTION
            </h3>
            <p className="text-xs text-[#CCD9BD] tracking-wider uppercase font-semibold">
              Autonomous Intelligence Node
            </p>
          </div>

          {/* Tactical Military Insignia Chevron Badge */}
          <div className="tactical-badge-cut bg-[#343F2D] border border-[#526346] w-9 h-11 flex flex-col items-center justify-center text-[#D6E2C8] shadow-inner">
            <Award className="w-4 h-4 mb-0.5" />
            <div className="w-3 h-0.5 bg-[#8DA07B] rounded-full"></div>
          </div>
        </div>

        {/* Node Telemetry Stats */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[#FFFFFF18]">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#A7B896] block">Total Reports</span>
            <span className="text-2xl font-black">{reportCount ?? 0}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#A7B896] block">Awaiting Review</span>
            <span className="text-2xl font-black text-[#F4C562]">{pendingCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-[#FFFFFF18] flex items-center justify-between text-xs text-[#BAC8AB]">
        <div className="truncate max-w-[180px]">
          <span className="font-semibold block truncate">{modelName || 'Mock NLP'}</span>
          <span className="text-[10px] opacity-75">{modelVersion} • Mock Adapter</span>
        </div>
        
        <Link 
          to={`/cities/${city.toLowerCase()}`}
          className="flex items-center gap-1 text-[#FFFFFF] bg-[#FFFFFF18] hover:bg-[#FFFFFF30] px-2.5 py-1.5 rounded-sm font-bold text-xs uppercase tracking-wider transition"
        >
          <span>Node</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
