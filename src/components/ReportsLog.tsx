import React, { useEffect, useState } from 'react';
import { FileText, Calendar, UserCheck, Search, X, ArrowUpDown, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Report, Project } from '../types';
import { cn } from '../lib/utils';

interface ReportsLogProps {
  projects: Project[];
  onUpdate?: () => void;
}

export default function ReportsLog({ projects, onUpdate }: ReportsLogProps) {
  const [localReports, setLocalReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const reports = projects.flatMap(p => (p.reports || []).map(r => ({
      ...r,
      project_code: p.project_code,
      dynamics_code: p.dynamics_code,
      project_title: p.title
    })));
    setLocalReports(reports);
  }, [projects]);

  const updateReportStatus = async (reportId: number | undefined, newStatus: Report['status']) => {
    if (!reportId) return;
    
    // Optimistic update
    setLocalReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onUpdate?.();
      } else {
        // Rollback on error
        onUpdate?.(); // Refresh to get correct state
      }
    } catch (err) {
      console.error('Failed to update report status', err);
      onUpdate?.(); // Refresh to get correct state
    }
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 size={12} className="text-emerald-500" />;
      case 'Sent': return <Clock size={12} className="text-blue-500" />;
      case 'Pending': return <Clock size={12} className="text-amber-500" />;
      case 'Not Approved': return <XCircle size={12} className="text-red-500" />;
      default: return <AlertCircle size={12} className="text-amber-500" />;
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'Approved': return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case 'Sent': return "bg-blue-50 text-blue-700 border-blue-100";
      case 'Pending': return "bg-amber-50 text-amber-700 border-amber-100";
      case 'Not Approved': return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const filteredReports = localReports.filter(rep => {
    const matchesSearch = (rep.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (rep.project_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rep.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    const aVal = a.deadline || '';
    const bVal = b.deadline || '';
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const groupedReports = sortedReports.reduce((acc, report) => {
    const key = report.project_code || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(report);
    return acc;
  }, {} as Record<string, Report[]>);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports Log</h2>
          <p className="text-slate-500 text-sm">Compliance and reporting deadlines.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search project or report type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
          />
        </div>
        <button 
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm hover:bg-slate-100 transition-colors"
        >
          <ArrowUpDown size={14} />
          Sort by Deadline ({sortDirection === 'asc' ? 'Oldest' : 'Newest'})
        </button>
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="space-y-8">
        {(Object.entries(groupedReports) as [string, Report[]][]).map(([projectCode, projectReports]) => (
          <div key={projectCode} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{projectReports[0]?.project_title || 'Unknown Project'}</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">{projectCode}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Reports</p>
                <p className="text-sm font-bold text-slate-800">{projectReports.length}</p>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Report Type</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Responsibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projectReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Calendar size={14} className="text-slate-400" />
                        {report.deadline ? new Date(report.deadline).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <FileText size={14} className="text-slate-400" />
                        {report.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={report.status || 'Triggered'}
                        onChange={(e) => updateReportStatus(report.id, e.target.value as Report['status'])}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border outline-none transition-all cursor-pointer",
                          getStatusColor(report.status || 'Triggered')
                        )}
                      >
                        <option value="Triggered">Triggered</option>
                        <option value="Pending">Pending</option>
                        <option value="Sent">Sent</option>
                        <option value="Approved">Approved</option>
                        <option value="Not Approved">Not Approved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {report.is_drc_partner ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase">
                            <UserCheck size={14} /> Internal + Partner
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                            <UserCheck size={14} /> DRC Internal
                          </span>
                        )}
                        {report.lead_person && (
                          <span className="text-[10px] text-slate-500 font-medium">Lead: {report.lead_person}</span>
                        )}
                        {report.technical_people && report.technical_people.length > 0 && (
                          <span className="text-[9px] text-slate-400 italic">Tech: {report.technical_people.join(', ')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {localReports.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 italic">
            No reports recorded.
          </div>
        ) : Object.keys(groupedReports).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <FileText size={48} strokeWidth={1} />
              <p className="text-sm font-medium">No reports found matching your criteria</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
