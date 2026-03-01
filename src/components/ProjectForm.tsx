import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle, Calendar as CalendarIcon, DollarSign, FileText, Info, Activity as ActivityIcon, Users, ShieldCheck, Filter, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Activity, Installment, Report, CURRENCY_RATES } from '../types';
import { cn, calculateDuration } from '../lib/utils';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess: () => void;
}

const COUNTRY_PROVINCES: Record<string, string[]> = {
  'Serbia': ['Belgrade', 'Vojvodina', 'Central Serbia'],
  'Ukraine': [
    'Kyiv', 'Cherkasy', 'Chernihiv', 'Chernivtsi', 'Dnipropetrovsk', 'Donetsk', 
    'Ivano-Frankivsk', 'Kharkiv', 'Kherson', 'Khmelnytskyi', 'Kirovohrad', 
    'Luhansk', 'Lviv', 'Mykolaiv', 'Odesa', 'Poltava', 'Rivne', 'Sumy', 
    'Ternopil', 'Vinnytsia', 'Volyn', 'Zakarpattia', 'Zaporizhzhia', 'Zhytomyr'
  ],
  'Georgia': ['Tbilisi', 'Adjara', 'Guria', 'Imereti', 'Kakheti', 'Mtskheta-Mtianeti', 'Racha-Lechkhumi', 'Samegrelo-Zemo Svaneti', 'Samtskhe-Javakheti', 'Shida Kartli'],
  'Afghanistan': [
    'Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Kunduz', 'Jalalabad', 
    'Lashkar Gah', 'Taloqan', 'Khost', 'Sheberghan', 'Ghazni', 'Sar-e Pol', 
    'Maymana', 'Chaghcharan', 'Mihtarlam', 'Pol-e Khomri', 'Helmand', 'Nangarhar',
    'Balkh', 'Badakhshan', 'Bamyan', 'Farah', 'Faryab', 'Ghor', 'Kapisa', 
    'Kunar', 'Laghman', 'Logar', 'Nimruz', 'Nuristan', 'Paktia', 'Paktika', 
    'Panjshir', 'Parwan', 'Samangan', 'Takhar', 'Uruzgan', 'Wardak', 'Zabul'
  ],
  'Bangladesh': ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'],
  'Myanmar': ['Yangon', 'Mandalay', 'Naypyidaw', 'Kachin', 'Kayah', 'Kayin', 'Chin', 'Sagaing', 'Tanintharyi', 'Bago', 'Magway', 'Mon', 'Rakhine', 'Shan', 'Ayeyarwady'],
  'Iraq': ['Baghdad', 'Basra', 'Nineveh', 'Erbil', 'Anbar', 'Najaf', 'Karbala', 'Kirkuk', 'Duhok', 'Sulaymaniyah'],
  'Lebanon': ['Beirut', 'Mount Lebanon', 'North Lebanon', 'Akkar', 'Beqaa', 'Baalbek-Hermel', 'South Lebanon', 'Nabatieh'],
  'Yemen': [
    'Adan', 'Amran', 'Abyan', 'Ad Dali', 'Al Bayda', 'Al Hudaydah', 'Al Jawf', 
    'Al Mahrah', 'Al Mahwit', 'Amanat Al Asimah', 'Dhamar', 'Hadramaut', 
    'Hajjah', 'Ibb', 'Lahij', 'Ma\'rib', 'Raymah', 'Sa\'dah', 'Sana\'a', 
    'Shabwah', 'Taiz', 'Socotra'
  ],
  'Palestine': ['Gaza Strip', 'West Bank', 'East Jerusalem'],
  'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Mafraq', 'Jarash', 'Ajloun', 'Balqa', 'Madaba', 'Karak', 'Tafilah', 'Ma\'an'],
  'Syria': ['Damascus', 'Aleppo', 'Homs', 'Hama', 'Latakia', 'Tartus', 'Idlib', 'Raqqa', 'Deir ez-Zor', 'Hasakah', 'Daraa', 'Suwayda', 'Quneitra'],
  'Turkiye': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Hatay', 'Kahramanmaras'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Dori', 'Kaya', 'Fada N\'gourma'],
  'Cameroon': ['Yaounde', 'Douala', 'Bamenda', 'Garoua', 'Maroua', 'Bafoussam', 'Ngaoundere', 'Bertoua', 'Buea', 'Ebolowa'],
  'CAR': ['Bangui', 'Bambari', 'Bouar', 'Berberati', 'Kaga-Bandoro', 'Bossangoa'],
  'Chad': ['N\'Djamena', 'Moundou', 'Sarh', 'Abeche', 'Kelo', 'Am Timan'],
  'Lybia': ['Tripoli', 'Benghazi', 'Misrata', 'Bayda', 'Zawiya', 'Zliten', 'Tobruk', 'Sabha'],
  'Mali': ['Bamako', 'Kayes', 'Koulikoro', 'Sikasso', 'Segou', 'Mopti', 'Timbuktu', 'Gao', 'Kidal'],
  'Niger': ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Diffa', 'Dosso', 'Tillaberi'],
  'Nigeria': [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 
    'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 
    'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 
    'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ],
  'Algeria': ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Setif', 'Sidi Bel Abbes'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Bizerte', 'Gabes', 'Ariana'],
  'DRC': [
    'Kinshasa', 'Kongo Central', 'Kwango', 'Kwilu', 'Mai-Ndombe', 'Equateur', 
    'Mongala', 'Nord-Ubangi', 'Sud-Ubangi', 'Tshuapa', 'Haut-Uele', 'Ituri', 
    'Bas-Uele', 'Tshopo', 'Maniema', 'Nord-Kivu', 'Sud-Kivu', 'Sankuru', 
    'Kasai', 'Kasai-Central', 'Kasai-Oriental', 'Lomami', 'Lualaba', 
    'Haut-Lomami', 'Haut-Katanga', 'Tanganyika'
  ],
  'Djibouti': ['Djibouti City', 'Ali Sabieh', 'Dikhil', 'Tadjoura', 'Obock', 'Arta'],
  'Ethiopia': ['Addis Ababa', 'Afar', 'Amhara', 'Oromia', 'Somali', 'Benishangul-Gumuz', 'SNNP', 'Gambela', 'Harari', 'Tigray'],
  'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Ruiru', 'Kikuyu'],
  'Somalia': [
    'Banaadir', 'Galguduud', 'Hiiraan', 'Middle Shabelle', 'Lower Shabelle', 
    'Bari', 'Nugaal', 'Mudug', 'Bakool', 'Bay', 'Gedo', 'Middle Juba', 
    'Lower Juba', 'Awdal', 'Woqooyi Galbeed', 'Togdheer', 'Sanaag', 'Sool'
  ],
  'South Sudan': [
    'Central Equatoria', 'Eastern Equatoria', 'Jonglei', 'Lakes', 
    'Northern Bahr el Ghazal', 'Unity', 'Upper Nile', 'Warrap', 
    'Western Bahr el Ghazal', 'Western Equatoria'
  ],
  'Sudan': [
    'Khartoum', 'North Darfur', 'South Darfur', 'West Darfur', 'Central Darfur', 
    'East Darfur', 'North Kordofan', 'South Kordofan', 'West Kordofan', 
    'Blue Nile', 'White Nile', 'Red Sea', 'Gezira', 'Kassala', 'Al Qadarif', 
    'Sennar', 'River Nile', 'Northern'
  ],
  'Uganda': ['Kampala', 'Entebbe', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale', 'Arua'],
  'Burundi': ['Bujumbura', 'Gitega', 'Ngozi', 'Rumonge', 'Kayanza', 'Muyinga'],
  'Colombia': ['Bogota', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Cucuta', 'Bucaramanga', 'Pereira'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Toluca', 'Tijuana', 'Leon', 'Juarez']
};

const SECTORS = [
  'Cash', 'Protection', 'Wash', 'Shelter', 'Livelihoods', 'CCCM', 'Capacity Development', 'HDP'
];

export default function ProjectForm({ isOpen, onClose, project, onSuccess }: ProjectFormProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    project_code: '',
    dynamics_code: '',
    donor: '',
    title: '',
    country: '',
    regions: [],
    sectors: [],
    partners: [],
    start_date: '',
    end_date: '',
    proposal_lead: '',
    technical_leads: [],
    dynamics_lead: '',
    submission_deadline: '',
    donor_currency: 'USD',
    total_budget_donor: 0,
    status: 'Pipeline',
    consortium: false,
    drc_is_lead: false,
    has_partners: false,
    beneficiaries: '',
    summary: '',
    principal_objective: '',
    specific_objectives: '',
    donor_compliance: '',
    activities: [],
    installments: [],
    reports: []
  });

  const [activeTab, setActiveTab] = useState<'pipeline' | 'activation'>('pipeline');
  const [selectedProvince, setSelectedProvince] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        beneficiaries: project.beneficiaries || '',
        summary: project.summary || '',
        principal_objective: project.principal_objective || '',
        specific_objectives: project.specific_objectives || '',
        donor_compliance: project.donor_compliance || '',
        activities: project.activities || [],
        installments: project.installments || [],
        reports: project.reports || []
      });
      if (project.status !== 'Pipeline') {
        setActiveTab('activation');
      } else {
        setActiveTab('pipeline');
      }
    } else {
      setFormData({
        project_code: '',
        dynamics_code: '',
        donor: '',
        consortium: false,
        title: '',
        country: '',
        regions: [],
        sectors: [],
        partners: [],
        start_date: '',
        end_date: '',
        proposal_lead: '',
        technical_leads: [],
        dynamics_lead: '',
        submission_deadline: '',
        donor_currency: 'USD',
        total_budget_donor: 0,
        status: 'Pipeline',
        has_partners: false,
        beneficiaries: '',
        summary: '',
        principal_objective: '',
        specific_objectives: '',
        donor_compliance: '',
        activities: [],
        installments: [],
        reports: []
      });
      setActiveTab('pipeline');
    }
  }, [project, isOpen]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    // Validation: Installments must match total budget if active/closed
    if (formData.status === 'Active' || formData.status === 'Closed') {
      if (Math.abs(totalInstallments - (formData.total_budget_donor || 0)) > 0.01) {
        const proceed = confirm(`Total installments (${totalInstallments.toLocaleString()} ${formData.donor_currency}) do not match total budget (${(formData.total_budget_donor || 0).toLocaleString()} ${formData.donor_currency}). Proceed anyway?`);
        if (!proceed) return;
      }
    }

    const method = project ? 'PUT' : 'POST';
    const url = project ? `/api/projects/${project.id}` : '/api/projects';

    setIsSaving(true);
    console.log('Saving project data:', formData);

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      console.log('Save response status:', res.status);
      
      if (res.ok) {
        await onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        console.error('Save failed:', errorData);
        alert(`Error: ${errorData.error || 'Failed to save project'}`);
      }
    } catch (err) {
      console.error('Failed to save project', err);
      alert('An unexpected error occurred while saving the project.');
    } finally {
      setIsSaving(false);
    }
  };

  const addProvince = (name: string) => {
    if (!name) return;
    const current = formData.regions || [];
    if (!current.find(r => r.name === name)) {
      setFormData({ ...formData, regions: [...current, { name, sectors: [] }] });
    }
    setSelectedProvince('');
  };

  const toggleSectorInProvince = (provinceName: string, sector: string) => {
    const regions = (formData.regions || []).map(r => {
      if (r.name === provinceName) {
        const sectors = r.sectors.includes(sector)
          ? r.sectors.filter(s => s !== sector)
          : [...r.sectors, sector];
        return { ...r, sectors };
      }
      return r;
    });
    setFormData({ ...formData, regions });
  };

  const removeProvince = (index: number) => {
    const current = formData.regions || [];
    const updated = [...current];
    updated.splice(index, 1);
    setFormData({ ...formData, regions: updated });
  };

  const addListItem = (field: keyof Project, value: string) => {
    if (field !== 'partners' && !value) return;
    const current = (formData[field] as string[]) || [];
    if (field === 'partners' || !current.includes(value)) {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const removeListItem = (field: keyof Project, index: number) => {
    const current = (formData[field] as string[]) || [];
    const updated = [...current];
    updated.splice(index, 1);
    setFormData({ ...formData, [field]: updated });
  };

  const addActivity = () => {
    const newActivity: Activity = {
      region: '',
      sector: '',
      outcome: '',
      output: '',
      output_target: 0,
      activity_proposal_name: '',
      activity_target: 0,
      activity_drc_name: '',
      current_progress: 0
    };
    setFormData({ ...formData, activities: [...(formData.activities || []), newActivity] });
  };

  const updateActivity = (index: number, field: keyof Activity, value: any) => {
    const activities = [...(formData.activities || [])];
    activities[index] = { ...activities[index], [field]: value };
    setFormData({ ...formData, activities });
  };

  const removeActivity = (index: number) => {
    const activities = [...(formData.activities || [])];
    activities.splice(index, 1);
    setFormData({ ...formData, activities });
  };

  const addInstallment = () => {
    const newInst: Installment = { date: '', amount: 0, status: 'Scheduled' };
    setFormData({ ...formData, installments: [...(formData.installments || []), newInst] });
  };

  const updateInstallment = (index: number, field: keyof Installment, value: any) => {
    const installments = [...(formData.installments || [])];
    installments[index] = { ...installments[index], [field]: value };
    setFormData({ ...formData, installments });
  };

  const addReport = () => {
    const newRep: Report = { type: '', deadline: '', status: 'Triggered', is_drc_partner: false };
    setFormData({ ...formData, reports: [...(formData.reports || []), newRep] });
  };

  const updateReport = (index: number, field: keyof Report, value: any) => {
    const reports = [...(formData.reports || [])];
    reports[index] = { ...reports[index], [field]: value };
    setFormData({ ...formData, reports });
  };

  const duration = calculateDuration(formData.start_date || '', formData.end_date || '');
  const budgetUSD = (formData.total_budget_donor || 0) * (CURRENCY_RATES[formData.donor_currency || 'USD'] || 1);
  const totalInstallments = formData.installments?.reduce((sum, inst) => sum + (inst.amount || 0), 0) || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex-col flex"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {project ? `Modify Project: ${project.project_code}` : 'Create New Pipeline Project'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Fill in the details below to manage your humanitarian project.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 border-b border-slate-100 flex gap-8">
          <button 
            onClick={() => setActiveTab('pipeline')}
            className={cn(
              "py-4 font-medium text-sm border-b-2 transition-all",
              activeTab === 'pipeline' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Pipeline Details
          </button>
          <button 
            onClick={() => setActiveTab('activation')}
            disabled={!project && formData.status === 'Pipeline'}
            className={cn(
              "py-4 font-medium text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === 'activation' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700",
              (!project && formData.status === 'Pipeline') && "opacity-50 cursor-not-allowed"
            )}
          >
            Activation & Implementation
            {formData.status === 'Pipeline' && !project && <Info size={14} className="text-slate-400" />}
          </button>
        </div>

        {/* Form Content */}
        <form id="project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'pipeline' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4 col-span-full">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Info size={18} className="text-emerald-500" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Code</label>
                    <input 
                      required
                      value={formData.project_code}
                      onChange={e => setFormData({...formData, project_code: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="e.g. SSD-24-001"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dynamics Code</label>
                    <input 
                      required
                      value={formData.dynamics_code}
                      onChange={e => setFormData({...formData, dynamics_code: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="e.g. DYN-12345"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Title</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="e.g. Emergency WASH Support"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Donor</label>
                    <input 
                      required
                      value={formData.donor}
                      onChange={e => setFormData({...formData, donor: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="e.g. ECHO, BHA"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country</label>
                    <select 
                      required
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value, regions: []})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    >
                      <option value="">-- Select Country --</option>
                      {Object.keys(COUNTRY_PROVINCES).sort().map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, consortium: !formData.consortium})}
                      className={cn(
                        "w-10 h-6 rounded-full transition-all relative",
                        formData.consortium ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.consortium ? "left-5" : "left-1"
                      )} />
                    </button>
                    <span className="text-sm font-semibold text-slate-700">Consortium Project</span>
                  </div>

                  {formData.consortium && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, drc_is_lead: !formData.drc_is_lead})}
                        className={cn(
                          "w-10 h-6 rounded-full transition-all relative",
                          formData.drc_is_lead ? "bg-emerald-500" : "bg-slate-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          formData.drc_is_lead ? "left-5" : "left-1"
                        )} />
                      </button>
                      <span className="text-sm font-semibold text-slate-700">DRC is Lead</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, has_partners: !formData.has_partners})}
                      className={cn(
                        "w-10 h-6 rounded-full transition-all relative",
                        formData.has_partners ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.has_partners ? "left-5" : "left-1"
                      )} />
                    </button>
                    <span className="text-sm font-semibold text-slate-700">Has Implementing Partners?</span>
                  </div>
                </div>
              </div>

              {/* Lists (Regions, Sectors, Partners) */}
              <div className="space-y-4 col-span-full">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Provinces & Sectors</label>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase">Select Province</label>
                    <select 
                      value={selectedProvince}
                      onChange={e => setSelectedProvince(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">-- Select Province --</option>
                      {(COUNTRY_PROVINCES[formData.country || ''] || []).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <button 
                    type="button"
                    onClick={() => addProvince(selectedProvince)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold"
                  >
                    Add Province
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {formData.regions?.map((r, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                      <button 
                        type="button"
                        onClick={() => removeProvince(i)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                      <h4 className="font-bold text-slate-700 text-sm mb-2">{r.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {SECTORS.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSectorInProvince(r.name, s)}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold transition-all border",
                              r.sectors.includes(s)
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formData.has_partners && (
                <div className="space-y-4 col-span-full">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Implementing Partners</label>
                    <button
                      type="button"
                      onClick={() => addListItem('partners', '')}
                      className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-xs"
                    >
                      <Plus size={14} /> Add Partner
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.partners?.map((p, i) => (
                      <div key={i} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 group">
                        <input 
                          className="flex-1 bg-transparent border-none text-sm focus:ring-0"
                          value={p}
                          onChange={e => {
                            const partners = [...(formData.partners || [])];
                            partners[i] = e.target.value;
                            setFormData({...formData, partners});
                          }}
                          placeholder="Partner name..."
                        />
                        <button 
                          type="button"
                          onClick={() => removeListItem('partners', i)}
                          className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {(!formData.partners || formData.partners.length === 0) && (
                      <p className="text-xs text-slate-400 italic py-2">No implementing partners added.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Dates & Leads */}
              <div className="space-y-4 col-span-full">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-emerald-500" />
                  Timeline & Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                    <input 
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={e => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submission Deadline</label>
                    <input 
                      type="date"
                      value={formData.submission_deadline}
                      onChange={e => setFormData({...formData, submission_deadline: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proposal Lead</label>
                    <input 
                      value={formData.proposal_lead}
                      onChange={e => setFormData({...formData, proposal_lead: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dynamics Lead</label>
                    <input 
                      value={formData.dynamics_lead}
                      onChange={e => setFormData({...formData, dynamics_lead: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Technical Leads</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        placeholder="Add technical lead..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addListItem('technical_leads', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.technical_leads?.map((l, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs flex items-center gap-1">
                          {l} <X size={12} className="cursor-pointer" onClick={() => removeListItem('technical_leads', i)} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-4 col-span-full">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-500" />
                  Budget Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Donor Currency</label>
                    <select 
                      value={formData.donor_currency}
                      onChange={e => setFormData({...formData, donor_currency: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                      {Object.keys(CURRENCY_RATES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Budget (Donor)</label>
                    <input 
                      type="number"
                      value={isNaN(formData.total_budget_donor!) ? '' : formData.total_budget_donor}
                      onChange={e => setFormData({...formData, total_budget_donor: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calculated USD</p>
                    <p className="text-2xl font-bold text-emerald-600">${budgetUSD.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4 col-span-full">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Status</label>
                <div className="flex gap-4">
                  {['Pipeline', 'Active', 'Closed', 'Rejected'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({...formData, status: s as any})}
                      className={cn(
                        "px-6 py-2 rounded-full text-sm font-medium transition-all border",
                        formData.status === s 
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Cheat Sheet Fields */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <FileText size={18} className="text-emerald-500" />
                  Cheat Sheet & Objectives
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beneficiaries</label>
                    <textarea 
                      value={formData.beneficiaries || ''}
                      onChange={e => setFormData({...formData, beneficiaries: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[80px]"
                      placeholder="Target groups and numbers..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Summary</label>
                    <textarea 
                      value={formData.summary || ''}
                      onChange={e => setFormData({...formData, summary: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Principal Objective</label>
                    <textarea 
                      value={formData.principal_objective || ''}
                      onChange={e => setFormData({...formData, principal_objective: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specific Objectives</label>
                    <textarea 
                      value={formData.specific_objectives || ''}
                      onChange={e => setFormData({...formData, specific_objectives: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Donor Compliance</label>
                    <textarea 
                      value={formData.donor_compliance || ''}
                      onChange={e => setFormData({...formData, donor_compliance: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Activities */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <ActivityIcon size={18} className="text-emerald-500" />
                    Activities & Indicators
                  </h3>
                  <button 
                    type="button"
                    onClick={addActivity}
                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    <Plus size={16} /> Add Activity
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.activities?.map((act, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-xl border border-slate-200 relative group">
                      <button 
                        type="button"
                        onClick={() => removeActivity(idx)}
                        className="absolute top-4 right-4 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Region</label>
                          <select 
                            value={act.region}
                            onChange={e => updateActivity(idx, 'region', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                          >
                            <option value="">-- Select Region --</option>
                            {formData.regions?.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Sector</label>
                          <select 
                            value={act.sector}
                            onChange={e => updateActivity(idx, 'sector', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                          >
                            <option value="">-- Select Sector --</option>
                            {formData.regions?.find(r => r.name === act.region)?.sectors.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Outcome</label>
                          <input 
                            value={act.outcome}
                            onChange={e => updateActivity(idx, 'outcome', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Output</label>
                          <input 
                            value={act.output}
                            onChange={e => updateActivity(idx, 'output', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Activity (Proposal Name)</label>
                          <input 
                            value={act.activity_proposal_name}
                            onChange={e => updateActivity(idx, 'activity_proposal_name', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Activity (DRC Internal)</label>
                          <input 
                            value={act.activity_drc_name}
                            onChange={e => updateActivity(idx, 'activity_drc_name', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Output Target</label>
                            <input 
                              type="number"
                              value={isNaN(act.output_target) ? '' : act.output_target}
                              onChange={e => updateActivity(idx, 'output_target', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Activity Target</label>
                            <input 
                              type="number"
                              value={isNaN(act.activity_target) ? '' : act.activity_target}
                              onChange={e => updateActivity(idx, 'activity_target', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Beneficiaries Reached</label>
                            <input 
                              type="number"
                              value={isNaN(act.beneficiaries_reached || 0) ? '' : act.beneficiaries_reached}
                              onChange={e => updateActivity(idx, 'beneficiaries_reached', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                            />
                          </div>
                        </div>
                        <div className="col-span-full flex flex-col gap-3 mt-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => updateActivity(idx, 'is_partner_implemented', !act.is_partner_implemented)}
                              className={cn(
                                "w-10 h-6 rounded-full transition-all relative",
                                act.is_partner_implemented ? "bg-emerald-500" : "bg-slate-300"
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                act.is_partner_implemented ? "left-5" : "left-1"
                              )} />
                            </button>
                            <span className="text-xs font-semibold text-slate-600">Implemented by Partner?</span>
                          </div>
                          
                          {act.is_partner_implemented && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Select Partner</label>
                              <select 
                                value={act.partner_name || ''}
                                onChange={e => updateActivity(idx, 'partner_name', e.target.value)}
                                className="w-full max-w-xs px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                              >
                                <option value="">-- Select Partner --</option>
                                {formData.partners?.map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                              {(!formData.partners || formData.partners.length === 0) && (
                                <p className="text-[10px] text-red-500 italic">Please add partners in the Pipeline section first.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Installments & Reports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <DollarSign size={18} className="text-emerald-500" />
                      Installments
                    </h3>
                    <button type="button" onClick={addInstallment} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.installments?.map((inst, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="date"
                          value={inst.date}
                          onChange={e => updateInstallment(idx, 'date', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm"
                        />
                        <div className="relative w-32">
                          <input 
                            type="number"
                            value={isNaN(inst.amount) ? '' : inst.amount}
                            onChange={e => updateInstallment(idx, 'amount', parseFloat(e.target.value))}
                            className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm"
                            placeholder="Amount"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                            {formData.donor_currency}
                          </span>
                        </div>
                        <button type="button" onClick={() => {
                          const insts = [...(formData.installments || [])];
                          insts.splice(idx, 1);
                          setFormData({...formData, installments: insts});
                        }} className="text-slate-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {formData.installments && formData.installments.length > 0 && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Total Installments</span>
                        <span className={cn(
                          "text-sm font-bold",
                          Math.abs(totalInstallments - (formData.total_budget_donor || 0)) < 0.01 ? "text-emerald-600" : "text-red-500"
                        )}>
                          {totalInstallments.toLocaleString()} / {(formData.total_budget_donor || 0).toLocaleString()} {formData.donor_currency}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <FileText size={18} className="text-emerald-500" />
                      Reports
                    </h3>
                    <button type="button" onClick={addReport} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.reports?.map((rep, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex gap-2 items-center">
                          <input 
                            value={rep.type}
                            onChange={e => updateReport(idx, 'type', e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                            placeholder="Report Type"
                          />
                          <input 
                            type="date"
                            value={rep.deadline}
                            onChange={e => updateReport(idx, 'deadline', e.target.value)}
                            className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                          />
                          <select 
                            value={rep.status}
                            onChange={e => updateReport(idx, 'status', e.target.value)}
                            className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                          >
                            <option value="Triggered">Triggered</option>
                            <option value="Pending">Pending</option>
                            <option value="Sent">Sent</option>
                            <option value="Approved">Approved</option>
                            <option value="Not Approved">Not Approved</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <input 
                              type="checkbox"
                              checked={rep.is_drc_partner}
                              onChange={e => updateReport(idx, 'is_drc_partner', e.target.checked)}
                              className="w-4 h-4 accent-emerald-500"
                            />
                            <span className="text-[10px] text-slate-500">Internal + Partner?</span>
                          </div>
                          <button type="button" onClick={() => {
                            const reps = [...(formData.reports || [])];
                            reps.splice(idx, 1);
                            setFormData({...formData, reports: reps});
                          }} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Lead Person</label>
                            <input 
                              value={rep.lead_person || ''}
                              onChange={e => updateReport(idx, 'lead_person', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                              placeholder="Who is in charge?"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Technical People (comma separated)</label>
                            <input 
                              value={(rep.technical_people || []).join(', ')}
                              onChange={e => updateReport(idx, 'technical_people', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                              placeholder="Technical staff involved"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase">Duration</span>
              <span className="font-semibold text-slate-700">{duration} Months</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase">Total Budget (USD)</span>
              <span className="font-semibold text-emerald-600">${budgetUSD.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className={cn(
                "px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2",
                isSaving && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={20} />
                  {project ? 'Save Changes' : 'Create Project'}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
