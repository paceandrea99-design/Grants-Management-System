import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  Map as MapIcon,
  ChevronRight,
  Menu,
  X,
  Search,
  Bell,
  User,
  LogOut,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Project, Meeting, Installment, Report } from './types';

// Views
import Dashboard from './components/Dashboard';
import ProjectLog from './components/ProjectLog';
import MeetingsLog from './components/MeetingsLog';
import InstallmentsLog from './components/InstallmentsLog';
import ReportsLog from './components/ReportsLog';
import CheatSheetView from './components/CheatSheetView';
import ProjectForm from './components/ProjectForm';

type ViewType = 'dashboard' | 'pipeline' | 'active' | 'closed' | 'rejected' | 'meetings' | 'installments' | 'reports' | 'cheatsheet';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<{id: string, title: string, date: string, type: 'report' | 'installment'}[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
      
      // Calculate notifications
      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(now.getDate() + 7);
      
      const newNotifications: any[] = [];
      
      data.forEach((p: Project) => {
        p.reports?.forEach(r => {
          const deadline = new Date(r.deadline);
          if (deadline >= now && deadline <= oneWeekFromNow && r.status !== 'Approved') {
            newNotifications.push({
              id: `rep-${r.id}`,
              title: `Report Due: ${r.type} (${p.project_code})`,
              date: r.deadline,
              type: 'report'
            });
          }
        });
        
        p.installments?.forEach(i => {
          const date = new Date(i.date);
          if (date >= now && date <= oneWeekFromNow && i.status !== 'Received') {
            newNotifications.push({
              id: `inst-${i.id}`,
              title: `Installment Due: ${p.project_code}`,
              date: i.date,
              type: 'installment'
            });
          }
        });
      });
      
      setNotifications(newNotifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  const navItems = [
    { id: 'dashboard', label: 'Interactive Map', icon: MapIcon },
    { id: 'pipeline', label: 'Pipeline Log', icon: LayoutDashboard },
    { id: 'active', label: 'Active Projects', icon: Activity },
    { id: 'closed', label: 'Closed Projects', icon: CheckCircle2 },
    { id: 'rejected', label: 'Rejected Projects', icon: XCircle },
    { id: 'meetings', label: 'Meetings Log', icon: Calendar },
    { id: 'installments', label: 'Installments Log', icon: DollarSign },
    { id: 'reports', label: 'Reports Log', icon: FileText },
    { id: 'cheatsheet', label: 'Cheat Sheet', icon: Briefcase },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 z-30"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Activity className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-white tracking-tight">HUMANITY</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                activeView === item.id 
                  ? "bg-emerald-500/10 text-emerald-400 font-medium" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                activeView === item.id ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
              )} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleCreateProject}
            className={cn(
              "w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20",
              !isSidebarOpen && "p-0 h-10 w-10 mx-auto"
            )}
          >
            <PlusCircle size={20} />
            {isSidebarOpen && <span>New Project</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800">
              {navItems.find(i => i.id === activeView)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsNotificationOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Deadlines</h3>
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                            {notifications.length} New
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map(n => (
                              <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg shrink-0",
                                    n.type === 'report' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                                  )}>
                                    {n.type === 'report' ? <FileText size={14} /> : <DollarSign size={14} />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800 leading-tight">{n.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                      <Clock size={10} />
                                      Due: {new Date(n.date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-slate-400 italic text-sm">
                              No upcoming deadlines this week.
                            </div>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                            <button 
                              onClick={() => {
                                setIsNotificationOpen(false);
                                setActiveView(notifications[0].type === 'report' ? 'reports' : 'installments');
                              }}
                              className="text-[10px] font-bold text-emerald-600 uppercase hover:text-emerald-700"
                            >
                              View All Deadlines
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-800">Admin User</p>
                  <p className="text-xs text-slate-500">Program Manager</p>
                </div>
                <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-300">
                  <User size={18} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeView === 'dashboard' && <Dashboard projects={projects} onEdit={handleEditProject} />}
              {activeView === 'pipeline' && <ProjectLog projects={projects.filter(p => p.status === 'Pipeline')} title="Pipeline Projects" onEdit={handleEditProject} refresh={fetchProjects} />}
              {activeView === 'active' && <ProjectLog projects={projects.filter(p => p.status === 'Active')} title="Active Projects" onEdit={handleEditProject} refresh={fetchProjects} />}
              {activeView === 'closed' && <ProjectLog projects={projects.filter(p => p.status === 'Closed')} title="Closed Projects" onEdit={handleEditProject} refresh={fetchProjects} />}
              {activeView === 'rejected' && <ProjectLog projects={projects.filter(p => p.status === 'Rejected')} title="Rejected Projects" onEdit={handleEditProject} refresh={fetchProjects} />}
              {activeView === 'meetings' && <MeetingsLog projects={projects} />}
              {activeView === 'installments' && <InstallmentsLog projects={projects} onUpdate={fetchProjects} />}
              {activeView === 'reports' && <ReportsLog projects={projects} onUpdate={fetchProjects} />}
              {activeView === 'cheatsheet' && <CheatSheetView projects={projects.filter(p => p.status === 'Active')} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <ProjectForm 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        project={selectedProject}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
