import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Target, 
  Activity as ActivityIcon, 
  CheckCircle2, 
  Info,
  Users,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { Project, Activity } from '../types';
import { cn } from '../lib/utils';

interface CheatSheetViewProps {
  projects: Project[];
}

export default function CheatSheetView({ projects }: CheatSheetViewProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);

  useEffect(() => {
    if (selectedProject) {
      fetch(`/api/projects/${selectedProject.id}`)
        .then(res => res.json())
        .then(data => setProjectDetails(data));
    }
  }, [selectedProject]);

  if (projects.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-500">No active projects available for cheat sheet view.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6">
      {/* Project List Sidebar */}
      <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Active Project</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={cn(
                "w-full text-left p-4 border-b border-slate-50 transition-all hover:bg-slate-50",
                selectedProject?.id === p.id ? "bg-emerald-50 border-emerald-100" : ""
              )}
            >
              <p className="text-[10px] font-bold text-emerald-600 uppercase">{p.project_code}</p>
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{p.title}</p>
              <p className="text-xs text-slate-500 mt-1">{p.country}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cheat Sheet Content */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {projectDetails ? (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Beneficiaries</span>
                </div>
                <p className="text-sm text-slate-700">{projectDetails.beneficiaries || 'Not specified'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Summary</span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-3">{projectDetails.summary || 'Not specified'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Donor Compliance</span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-3">{projectDetails.donor_compliance || 'Not specified'}</p>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Project Objectives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Principal Objective</span>
                  <p className="text-sm text-slate-700 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                    {projectDetails.principal_objective || 'Not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Specific Objectives</span>
                  <p className="text-sm text-slate-700 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    {projectDetails.specific_objectives || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Hierarchy */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Activity Hierarchy & Progress</h3>
              <div className="space-y-8">
                {/* Group activities by Outcome */}
                {Array.from(new Set(projectDetails.activities?.map(a => a.outcome) || [])).filter(Boolean).map((outcome, oIdx) => (
                  <div key={oIdx} className="space-y-4">
                    <div className="flex items-center gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-lg">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-sm">
                        {oIdx + 1}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Outcome</p>
                        <p className="text-sm font-semibold">{outcome}</p>
                      </div>
                    </div>

                    <div className="ml-8 space-y-6">
                      {/* Group by Output within Outcome */}
                      {Array.from(new Set(projectDetails.activities?.filter(a => a.outcome === outcome).map(a => a.output) || [])).filter(Boolean).map((output, pIdx) => {
                        const outputActivities = projectDetails.activities?.filter(a => a.outcome === outcome && a.output === output) || [];
                        const outputTarget = outputActivities[0]?.output_target || 0;
                        
                        return (
                          <div key={pIdx} className="space-y-4">
                            <div className="flex items-center gap-3 bg-slate-100 p-3 rounded-lg border border-slate-200">
                              <Target size={18} className="text-blue-500" />
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Output</p>
                                <p className="text-sm font-medium text-slate-800">{output}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Target</p>
                                <p className="text-sm font-bold text-slate-800">{outputTarget}</p>
                              </div>
                            </div>

                            <div className="ml-6 grid grid-cols-1 gap-3">
                              {outputActivities.map((act, aIdx) => {
                                const progressValue = Math.max(act.current_progress || 0, act.beneficiaries_reached || 0);
                                const progressPercent = act.activity_target > 0 
                                  ? Math.min(100, (progressValue / act.activity_target) * 100) 
                                  : 0;
                                
                                return (
                                  <div key={aIdx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-start gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                          <ActivityIcon size={16} />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Activity</p>
                                          <p className="text-sm font-bold text-slate-800">{act.activity_proposal_name}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-slate-500 italic">DRC: {act.activity_drc_name}</p>
                                            {act.is_partner_implemented && (
                                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold uppercase border border-blue-100">
                                                {act.partner_name || 'Partner Implemented'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Target</p>
                                        <p className="text-sm font-bold text-slate-800">{act.activity_target}</p>
                                      </div>
                                    </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex flex-col">
                                            <span className="font-medium text-slate-600">Current Progress: {progressValue}</span>
                                            <span className="text-[10px] text-slate-400">Reached: {act.beneficiaries_reached || 0} beneficiaries</span>
                                          </div>
                                          <span className="font-bold text-emerald-600">{progressPercent.toFixed(0)}%</span>
                                        </div>
                                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${progressPercent}%` }}
                                          className="h-full bg-emerald-500 rounded-full"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Info size={48} strokeWidth={1} />
            <p className="text-sm font-medium">Select a project from the sidebar to view its cheat sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
