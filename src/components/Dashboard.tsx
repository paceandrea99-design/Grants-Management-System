import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Project, CURRENCY_RATES } from '../types';
import { Activity, CheckCircle2, XCircle, LayoutDashboard, ExternalLink, Map as MapIcon } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

// Fix for default marker icons in Leaflet with React
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DashboardProps {
  projects: Project[];
  onEdit: (project: Project) => void;
}

const PROVINCE_COORDS: Record<string, [number, number]> = {
  // South Sudan
  'Central Equatoria': [4.85, 31.6],
  'Eastern Equatoria': [4.4, 33.5],
  'Jonglei': [7.0, 32.5],
  'Lakes': [6.5, 30.5],
  'Northern Bahr el Ghazal': [9.0, 27.5],
  'Unity': [8.5, 30.0],
  'Upper Nile': [10.0, 33.0],
  'Warrap': [8.5, 28.5],
  'Western Bahr el Ghazal': [8.0, 26.0],
  'Western Equatoria': [5.0, 28.5],
  // Sudan
  'Khartoum': [15.5, 32.5],
  'North Darfur': [15.0, 25.0],
  'South Darfur': [11.5, 25.0],
  'West Darfur': [13.5, 22.5],
  'Central Darfur': [12.5, 23.5],
  'East Darfur': [11.5, 26.5],
  'North Kordofan': [14.0, 30.0],
  'South Kordofan': [11.0, 30.0],
  'West Kordofan': [12.5, 28.5],
  'Blue Nile': [11.5, 34.0],
  'Red Sea': [19.0, 36.5],
  // Afghanistan
  'Kabul': [34.5, 69.2],
  'Kandahar': [31.6, 65.7],
  'Herat': [34.3, 62.2],
  'Helmand': [31.0, 64.0],
  'Nangarhar': [34.4, 70.5],
  'Balkh': [36.7, 67.1],
  'Kunduz': [36.7, 68.9],
  'Badakhshan': [37.0, 71.0],
  'Ghazni': [33.5, 68.4],
  'Khost': [33.3, 69.9],
  'Lashkar Gah': [31.6, 64.3],
  'Mazar-i-Sharif': [36.7, 67.1],
  'Jalalabad': [34.4, 70.5],
  // DRC
  'Kinshasa': [-4.4, 15.3],
  'Nord-Kivu': [-0.5, 29.0],
  'Sud-Kivu': [-2.5, 28.5],
  'Ituri': [1.5, 30.0],
  'Tanganyika': [-7.0, 27.5],
  'Haut-Katanga': [-11.0, 27.0],
  'Kongo Central': [-5.5, 14.0],
  'Kwango': [-6.0, 17.5],
  'Kwilu': [-5.0, 18.5],
  'Kasai': [-5.0, 21.0],
  'Kasai-Central': [-6.0, 22.5],
  'Kasai-Oriental': [-6.0, 23.5],
  'Maniema': [-3.0, 26.0],
  'Tshopo': [0.5, 25.0],
  'Bas-Uele': [3.0, 25.0],
  'Haut-Uele': [3.0, 28.5],
  // Somalia
  'Banaadir': [2.0, 45.3],
  'Lower Shabelle': [1.5, 44.5],
  'Middle Shabelle': [2.5, 45.5],
  'Gedo': [3.5, 42.0],
  'Bari': [10.5, 50.0],
  'Mudug': [7.0, 47.5],
  'Galguduud': [5.0, 46.5],
  'Hiiraan': [4.0, 45.5],
  'Bakool': [4.0, 44.0],
  'Bay': [2.5, 43.5],
  // Nigeria
  'Borno': [11.8, 13.1],
  'Adamawa': [9.3, 12.5],
  'Yobe': [12.0, 11.5],
  'Lagos': [6.5, 3.4],
  'Kano': [12.0, 8.5],
  'Abia': [5.5, 7.5],
  'Akwa Ibom': [5.0, 7.8],
  'Anambra': [6.2, 7.0],
  'Bauchi': [10.5, 10.0],
  'Benue': [7.3, 8.8],
  'Delta': [5.5, 6.0],
  'Edo': [6.5, 6.0],
  'Enugu': [6.5, 7.5],
  'Imo': [5.5, 7.0],
  'Kaduna': [10.5, 7.5],
  'Katsina': [12.5, 7.5],
  'Ogun': [7.0, 3.5],
  'Oyo': [8.0, 3.5],
  'Rivers': [4.8, 7.0],
  'Sokoto': [13.0, 5.3],
  'Taraba': [8.0, 10.5],
  'Zamfara': [12.0, 6.5],
  // Ukraine
  'Kyiv': [50.4, 30.5],
  'Kharkiv': [50.0, 36.2],
  'Donetsk': [48.0, 37.8],
  'Luhansk': [48.6, 39.3],
  'Odesa': [46.5, 30.7],
  'Kherson': [46.6, 32.6],
  'Chernihiv': [51.5, 31.3],
  'Sumy': [50.9, 34.8],
  'Zaporizhzhia': [47.8, 35.2],
  'Mykolaiv': [47.0, 32.0],
  'Dnipropetrovsk': [48.5, 35.0],
  // Yemen
  'Sana\'a': [15.3, 44.2],
  'Adan': [12.8, 45.0],
  'Taiz': [13.6, 44.0],
  'Al Hudaydah': [14.8, 43.0],
  'Hadramaut': [16.0, 49.0],
  'Abyan': [13.5, 46.0],
  'Al Bayda': [14.0, 45.5],
  'Al Jawf': [16.5, 45.5],
  'Ma\'rib': [15.5, 45.5],
  'Shabwah': [14.5, 47.0],
  'Sa\'dah': [17.0, 44.0],
  'Amran': [15.8, 44.0],
  'Dhamar': [14.5, 44.3],
  'Ibb': [14.0, 44.2],
  'Lahij': [13.2, 44.8],
  'Al Mahrah': [16.5, 51.5],
  'Socotra': [12.5, 54.0]
};

const getProjectColor = (projectCode: string) => {
  const colors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  if (!projectCode) return colors[0];
  let hash = 0;
  for (let i = 0; i < projectCode.length; i++) {
    hash = projectCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const projectIcon = (color: string) => L.divIcon({
  html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="background-color: ${color}">
          <div class="w-2 h-2 rounded-full bg-white/50"></div>
        </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const getStableJitter = (id: number, index: number): [number, number] => {
  const seed = id * 13 + index * 7;
  const x = Math.sin(seed) * 0.15;
  const y = Math.cos(seed) * 0.15;
  return [x, y];
};

export default function Dashboard({ projects, onEdit }: DashboardProps) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const calculateTotalBudget = (status: string) => {
    return projects
      .filter(p => p.status === status)
      .reduce((sum, p) => {
        const rate = CURRENCY_RATES[p.donor_currency] || 1;
        return sum + (p.total_budget_donor * rate);
      }, 0);
  };

  const stats = [
    { 
      label: 'Pipeline', 
      value: projects.filter(p => p.status === 'Pipeline').length, 
      budget: calculateTotalBudget('Pipeline'),
      icon: LayoutDashboard, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Active', 
      value: projects.filter(p => p.status === 'Active').length, 
      budget: calculateTotalBudget('Active'),
      icon: Activity, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Closed', 
      value: projects.filter(p => p.status === 'Closed').length, 
      budget: calculateTotalBudget('Closed'),
      icon: CheckCircle2, 
      color: 'text-slate-500', 
      bg: 'bg-slate-100' 
    },
    { 
      label: 'Rejected', 
      value: projects.filter(p => p.status === 'Rejected').length, 
      budget: calculateTotalBudget('Rejected'),
      icon: XCircle, 
      color: 'text-red-500', 
      bg: 'bg-red-50' 
    },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                {formatCurrency(stat.budget)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MapIcon size={16} className="text-emerald-500" />
            Project Distribution Map
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Pins are colored by project</p>
        </div>
        
        <MapContainer center={[10, 30]} zoom={5} className="h-full w-full bg-[#dae3e8]">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {projects.flatMap(project => {
            const projectColor = getProjectColor(project.project_code);
            return (project.regions || []).map((region, rIdx) => {
              const coords = PROVINCE_COORDS[region.name] || [0, 0];
              if (coords[0] === 0) return null;

              const jitter = getStableJitter(project.id, rIdx);
              const jitteredCoords: [number, number] = [
                coords[0] + jitter[0],
                coords[1] + jitter[1]
              ];

              return (
                <Marker 
                  key={`${project.id}-${region.name}-${rIdx}`} 
                  position={jitteredCoords}
                  icon={projectIcon(projectColor)}
                >
                  <Popup onOpen={() => setSelectedSector(null)}>
                    <div className="p-2 min-w-[240px] max-w-[300px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">{project.project_code}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase",
                          project.status === 'Pipeline' && "bg-blue-50 text-blue-600",
                          project.status === 'Active' && "bg-emerald-50 text-emerald-600",
                          project.status === 'Closed' && "bg-slate-100 text-slate-600",
                          project.status === 'Rejected' && "bg-red-50 text-red-600"
                        )}>
                          {project.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{project.title}</h4>
                      <p className="text-xs text-slate-500 mb-2">{region.name} • {project.donor}</p>
                      
                      <div className="space-y-3 mt-3 border-t pt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sectors in this Region</p>
                        <div className="flex flex-wrap gap-2">
                          {(region.sectors || []).map(s => (
                            <button
                              key={s}
                              onClick={() => setSelectedSector(s === selectedSector ? null : s)}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold transition-all border",
                                selectedSector === s 
                                  ? "bg-emerald-500 text-white border-emerald-500"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        {selectedSector && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 mt-2">
                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Activities for {selectedSector}</p>
                            <div className="space-y-1 max-h-[120px] overflow-y-auto">
                              {project.activities
                                ?.filter(a => a.region === region.name && a.sector === selectedSector)
                                .map((a, i) => (
                                  <div key={i} className="text-[10px] text-slate-700 py-1 border-b border-slate-100 last:border-0 flex items-center justify-between">
                                    <span>• {a.activity_proposal_name}</span>
                                    {a.is_partner_implemented && (
                                      <span className="text-[8px] font-bold text-blue-500 uppercase ml-2">
                                        {a.partner_name || 'Partner'}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              {(!(project.activities || []).filter(a => a.region === region.name && a.sector === selectedSector).length) && (
                                <p className="text-[10px] text-slate-400 italic">No activities listed</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => onEdit(project)}
                        className="w-full mt-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 hover:bg-slate-800 transition-all"
                      >
                        <ExternalLink size={12} /> Full Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            });
          })}
        </MapContainer>
      </div>
    </div>
  );
}

