import React, { useState } from 'react';
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Users, 
  Globe, 
  Layers,
  ExternalLink,
  Plus,
  ArrowUpDown,
  Filter,
  Search,
  X
} from 'lucide-react';
import { Project, CURRENCY_RATES } from '../types';
import { cn, formatCurrency, calculateDuration } from '../lib/utils';
import MeetingModal from './MeetingModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface ProjectLogProps {
  projects: Project[];
  title: string;
  onEdit: (project: Project) => void;
  refresh: () => void;
}

export default function ProjectLog({ projects, title, onEdit, refresh }: ProjectLogProps) {
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<keyof Project | 'budgetUSD'>('project_code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [donorFilter, setDonorFilter] = useState('');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.project_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter ? p.country === countryFilter : true;
    const matchesDonor = donorFilter ? p.donor === donorFilter : true;
    return matchesSearch && matchesCountry && matchesDonor;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aVal: any = a[sortField as keyof Project];
    let bVal: any = b[sortField as keyof Project];

    if (sortField === 'budgetUSD') {
      aVal = a.total_budget_donor * (CURRENCY_RATES[a.donor_currency] || 1);
      bVal = b.total_budget_donor * (CURRENCY_RATES[b.donor_currency] || 1);
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalBudgetUSD = sortedProjects.reduce((acc, p) => {
    const rate = CURRENCY_RATES[p.donor_currency] || 1;
    return acc + (p.total_budget_donor * rate);
  }, 0);

  const handleSort = (field: keyof Project | 'budgetUSD') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const countries = Array.from(new Set(projects.map(p => p.country))).sort();
  const donors = Array.from(new Set(projects.map(p => p.donor))).sort();

  const handleAddMeeting = (id: number) => {
    setSelectedProjectId(id);
    setIsMeetingModalOpen(true);
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) refresh();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedProjectId(id);
    setIsDeleteModalOpen(true);
  };

  const deleteProject = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`, {
        method: 'DELETE'
      });
      if (res.ok) refresh();
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-slate-500 text-sm">Manage and track your {title.toLowerCase()} projects.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {title === 'Active Projects' ? 'Total Active Budget' : 
               title === 'Closed Projects' ? 'Total Closed Budget' :
               title === 'Rejected Projects' ? 'Total Rejected Budget' :
               'Total Pipeline Budget'}
            </p>
            <p className="text-xl font-bold text-emerald-600">${totalBudgetUSD.toLocaleString()}</p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Count</p>
            <p className="text-xl font-bold text-slate-800">{projects.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search code or title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
          />
        </div>
        <select 
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          value={donorFilter}
          onChange={e => setDonorFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">All Donors</option>
          {donors.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {(searchTerm || countryFilter || donorFilter) && (
          <button 
            onClick={() => {
              setSearchTerm('');
              setCountryFilter('');
              setDonorFilter('');
            }}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Clear Filters"
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
                onClick={() => handleSort('project_code')}
              >
                <div className="flex items-center gap-1">
                  Project Info
                  <ArrowUpDown size={12} className={sortField === 'project_code' ? 'text-emerald-500' : 'text-slate-300'} />
                </div>
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location & Sectors</th>
              <th 
                className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                onClick={() => handleSort('start_date')}
              >
                <div className="flex items-center gap-1">
                  Timeline
                  <ArrowUpDown size={12} className={sortField === 'start_date' ? 'text-emerald-500' : 'text-slate-300'} />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                onClick={() => handleSort('budgetUSD')}
              >
                <div className="flex items-center gap-1">
                  Budget (USD)
                  <ArrowUpDown size={12} className={sortField === 'budgetUSD' ? 'text-emerald-500' : 'text-slate-300'} />
                </div>
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedProjects.map((project) => {
              const duration = calculateDuration(project.start_date, project.end_date);
              const budgetUSD = project.total_budget_donor * (CURRENCY_RATES[project.donor_currency] || 1);
              
              return (
                <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-emerald-600 mb-1">{project.project_code}</span>
                      <span className="text-sm font-semibold text-slate-800 line-clamp-1">{project.title}</span>
                      <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Users size={12} /> {project.donor} {project.consortium ? '(Consortium)' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Globe size={12} className="text-slate-400" />
                        {project.country} ({(project.regions || []).map(r => r.name).join(', ')})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set((project.regions || []).flatMap(r => r.sectors || []))).slice(0, 3).map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-700">{duration} Months</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">${budgetUSD.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500">{formatCurrency(project.total_budget_donor, project.donor_currency)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      project.status === 'Pipeline' && "bg-blue-50 text-blue-600 border border-blue-100",
                      project.status === 'Active' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                      project.status === 'Closed' && "bg-slate-100 text-slate-600 border border-slate-200",
                      project.status === 'Rejected' && "bg-red-50 text-red-600 border border-red-100"
                    )}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleAddMeeting(project.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Add Meeting"
                      >
                        <Calendar size={18} />
                      </button>
                      <button 
                        onClick={() => onEdit(project)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Project"
                      >
                        <Edit3 size={18} />
                      </button>
                      {project.status === 'Pipeline' && (
                        <button 
                          onClick={() => updateStatus(project.id, 'Active')}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Activate Project"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      {project.status === 'Active' && (
                        <button 
                          onClick={() => updateStatus(project.id, 'Closed')}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Close Project"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteClick(project.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Project"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedProjects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Layers size={48} strokeWidth={1} />
                    <p className="text-sm font-medium">No projects found in this category.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MeetingModal 
        isOpen={isMeetingModalOpen} 
        onClose={() => setIsMeetingModalOpen(false)} 
        projectId={selectedProjectId} 
        onSuccess={refresh}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and all associated activities, installments, and reports will be removed."
      />
    </div>
  );
}
