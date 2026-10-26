import React from 'react';
import { ShieldAlert, MapPin, Calendar, Clock, Sparkles, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EventTableRow = ({ event, onReviewStatusUpdate }) => {
  const priorityColors = {
    High: 'bg-[#8A2B2B] text-white border-[#A83D3D]',
    Medium: 'bg-[#B07B28] text-white border-[#C7913A]',
    Low: 'bg-[#3E5C38] text-white border-[#507447]'
  };

  const statusColors = {
    'Verified': 'bg-[#1D4A27] text-[#A6E8B6] border-[#2E683C]',
    'Under Review': 'bg-[#544318] text-[#F9DF9C] border-[#705920]',
    'Pending Review': 'bg-[#404938] text-[#D4E0CB] border-[#55624A]',
    'Dismissed': 'bg-[#3A3A3A] text-[#B0B0B0] border-[#505050]'
  };

  return (
    <tr className="border-b border-[#E1E5DC] hover:bg-[#F2F5ED] transition-colors text-sm">
      <td className="py-4 px-4 font-mono font-bold text-xs text-[#2A3423]">
        {event.event_id}
      </td>
      <td className="py-4 px-4">
        <span className="inline-block px-2.5 py-1 text-xs uppercase font-bold tracking-wider rounded-sm bg-[#384530] text-white">
          {event.city}
        </span>
      </td>
      <td className="py-4 px-4 font-medium text-[#2C3325]">
        <div className="flex items-center gap-1.5 text-xs text-[#526046]">
          <MapPin className="w-3.5 h-3.5 text-[#6D7F5D]" />
          <span className="font-semibold text-[#1F241C]">{event.reported_area}</span>
        </div>
        <p className="text-xs text-[#4E5943] mt-1 line-clamp-2 max-w-md">{event.text_description}</p>
      </td>
      <td className="py-4 px-4">
        <span className="text-xs font-semibold text-[#323D2A] block">{event.predicted_category}</span>
        <span className="text-[10px] text-[#697A59]">Confidence: {Math.round((event.model_confidence || 0) * 100)}%</span>
      </td>
      <td className="py-4 px-4">
        <span className={`inline-block px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${priorityColors[event.review_priority] || 'bg-gray-700 text-white'}`}>
          {event.review_priority}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {(event.matched_keywords || []).slice(0, 3).map((kw, i) => (
            <span key={i} className="text-[10px] bg-[#E2E8DC] text-[#33402A] px-1.5 py-0.5 rounded font-mono">
              {kw}
            </span>
          ))}
        </div>
      </td>
      <td className="py-4 px-4">
        <select
          value={event.verification_status}
          onChange={(e) => onReviewStatusUpdate(event.event_id, event.city, e.target.value)}
          className={`text-xs font-semibold px-2 py-1 rounded border cursor-pointer outline-none ${statusColors[event.verification_status] || 'bg-gray-800 text-white'}`}
        >
          <option value="Pending Review">Pending Review</option>
          <option value="Under Review">Under Review</option>
          <option value="Verified">Verified</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </td>
      <td className="py-4 px-4 text-right">
        <Link
          to={`/cities/${event.city}?event=${event.event_id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#3B4833] hover:text-[#182013] hover:underline"
        >
          <span>Detail</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  );
};
