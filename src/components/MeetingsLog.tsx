import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Tag, Briefcase, Users, Globe, ArrowUpDown, Search, X } from 'lucide-react';
import { Meeting, Project } from '../types';
import { cn } from '../lib/utils';

interface MeetingsLogProps {
  projects: Project[];
}

export default function MeetingsLog({ projects }: MeetingsLogProps) {
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof Meeting>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const meetings = projects.flatMap(p => (p.meetings || []).map(m => ({
    ...m,
    project_code: p.project_code,
    dynamics_code: p.dynamics_code,
    project_title: p.title,
    project_end_date: p.end_date,
    project_status: p.status,
    regions: p.regions,
    partners: p.partners
  })));

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = (m.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (m.project_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? m.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Meeting) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const meetingTypes = Array.from(new Set(meetings.map(m => m.type))).filter(Boolean).sort();

  if (loading) return <div className="p-8 text-center text-slate-500">Loading meetings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Meetings Log</h2>
          <p className="text-slate-500 text-sm">Historical and upcoming project meetings.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search project..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
          />
        </div>
        <select 
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">All Types</option>
          {meetingTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(searchTerm || typeFilter) && (
          <button 
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
            }}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th 
                className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date & Time
                  <ArrowUpDown size={12} className={sortField === 'date' ? 'text-emerald-500' : 'text-slate-300'} />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                onClick={() => handleSort('project_code')}
              >
                <div className="flex items-center gap-1">
                  Project Info
                  <ArrowUpDown size={12} className={sortField === 'project_code' ? 'text-emerald-500' : 'text-slate-300'} />
                </div>
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sectors & Areas</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Partners</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedMeetings.map((meeting) => (
              <tr key={meeting.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-500" />
                      {meeting.date ? new Date(meeting.date).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Clock size={14} />
                      {meeting.time || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-600 uppercase">{meeting.project_code || 'N/A'}</span>
                    <span className="text-sm font-semibold text-slate-800 line-clamp-1">{meeting.project_title || 'Unknown Project'}</span>
                    <span className="text-[10px] text-slate-400 mt-1">Ends: {meeting.project_end_date ? new Date(meeting.project_end_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                    {meeting.type || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set((meeting.regions || []).flatMap(r => r.sectors) || [])).map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin size={10} />
                      {(meeting.regions || []).map(r => r.name).join(', ')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {meeting.partners?.map((p, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                        {p}
                      </span>
                    ))}
                    {(!meeting.partners || meeting.partners.length === 0) && <span className="text-[10px] text-slate-400 italic">No partners</span>}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    meeting.project_status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {meeting.project_status}
                  </span>
                </td>
              </tr>
            ))}
            {meetings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                  No meetings recorded yet.
                </td>
              </tr>
            ) : sortedMeetings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Calendar size={48} strokeWidth={1} />
                    <p className="text-sm font-medium">No meetings found matching your criteria</p>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
