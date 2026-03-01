import React, { useEffect, useState } from 'react';
import { DollarSign, Calendar, ArrowUpRight, Search, X, ArrowUpDown } from 'lucide-react';
import { Installment, Project } from '../types';
import { cn } from '../lib/utils';

interface InstallmentsLogProps {
  projects: Project[];
  onUpdate?: () => void;
}

export default function InstallmentsLog({ projects, onUpdate }: InstallmentsLogProps) {
  const [localInstallments, setLocalInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const installments = projects.flatMap(p => (p.installments || []).map(i => ({
      ...i,
      project_code: p.project_code,
      dynamics_code: p.dynamics_code,
      project_title: p.title
    })));
    setLocalInstallments(installments);
  }, [projects]);

  const filteredInstallments = localInstallments.filter(inst => {
    const matchesSearch = (inst.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (inst.project_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedInstallments = [...filteredInstallments].sort((a, b) => {
    const aVal = a.date || '';
    const bVal = b.date || '';
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const groupedInstallments = sortedInstallments.reduce((acc, inst) => {
    const key = inst.project_code || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(inst);
    return acc;
  }, {} as Record<string, Installment[]>);

  const toggleStatus = async (inst: Installment) => {
    if (!inst.id) return;
    const newStatus = inst.status === 'Scheduled' ? 'Received' : 'Scheduled';
    
    // Optimistic update
    setLocalInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, status: newStatus } : i));

    try {
      const res = await fetch(`/api/installments/${inst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onUpdate?.();
      } else {
        onUpdate?.(); // Rollback
      }
    } catch (err) {
      console.error('Failed to update installment status', err);
      onUpdate?.(); // Rollback
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading installments...</div>;

  const totalAmount = sortedInstallments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Installments Log</h2>
          <p className="text-slate-500 text-sm">Track all financial disbursements across projects.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Scheduled</p>
          <p className="text-xl font-bold text-emerald-600">${totalAmount.toLocaleString()}</p>
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
        <button 
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm hover:bg-slate-100 transition-colors"
        >
          <ArrowUpDown size={14} />
          Sort by Date ({sortDirection === 'asc' ? 'Oldest' : 'Newest'})
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
        {(Object.entries(groupedInstallments) as [string, Installment[]][]).map(([projectCode, projectInsts]) => (
          <div key={projectCode} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{projectInsts[0]?.project_title || 'Unknown Project'}</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">{projectCode}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Project Total</p>
                <p className="text-sm font-bold text-slate-800">
                  ${projectInsts.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projectInsts.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Calendar size={14} className="text-slate-400" />
                        {inst.date ? new Date(inst.date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">${inst.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(inst)}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all",
                          inst.status === 'Received' 
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" 
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        )}
                      >
                        {inst.status || 'Scheduled'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {localInstallments.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 italic">
            No installments recorded.
          </div>
        ) : Object.keys(groupedInstallments).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <DollarSign size={48} strokeWidth={1} />
              <p className="text-sm font-medium">No installments found matching your criteria</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
