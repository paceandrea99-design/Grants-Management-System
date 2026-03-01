export interface RegionSectors {
  name: string;
  sectors: string[];
}

export interface Project {
  id: number;
  project_code: string;
  dynamics_code: string;
  donor: string;
  consortium: boolean;
  drc_is_lead?: boolean;
  title: string;
  country: string;
  regions: RegionSectors[];
  sectors: string[];
  partners: string[];
  has_partners?: boolean;
  start_date: string;
  end_date: string;
  proposal_lead: string;
  technical_leads: string[];
  dynamics_lead: string;
  submission_deadline: string;
  donor_currency: string;
  total_budget_donor: number;
  status: 'Pipeline' | 'Active' | 'Closed' | 'Rejected';
  beneficiaries?: string;
  summary?: string;
  principal_objective?: string;
  specific_objectives?: string;
  donor_compliance?: string;
  activities?: Activity[];
  installments?: Installment[];
  reports?: Report[];
  meetings?: Meeting[];
}

export interface Activity {
  id?: number;
  project_id?: number;
  region: string;
  sector: string;
  outcome: string;
  output: string;
  output_target: number;
  activity_proposal_name: string;
  activity_target: number;
  activity_drc_name: string;
  current_progress: number;
  beneficiaries_reached?: number;
  is_partner_implemented?: boolean;
  partner_name?: string;
}

export interface Installment {
  id?: number;
  project_id?: number;
  date: string;
  amount: number;
  status: 'Scheduled' | 'Received';
  project_code?: string;
  dynamics_code?: string;
  project_title?: string;
}

export interface Report {
  id?: number;
  project_id?: number;
  type: string;
  deadline: string;
  status: 'Triggered' | 'Sent' | 'Approved' | 'Not Approved' | 'Pending';
  is_drc_partner: boolean;
  lead_person?: string;
  technical_people?: string[];
  project_code?: string;
  dynamics_code?: string;
  project_title?: string;
}

export interface Meeting {
  id?: number;
  project_id: number;
  date: string;
  time: string;
  type: string;
  project_code?: string;
  dynamics_code?: string;
  project_title?: string;
  sectors?: string[];
  regions?: RegionSectors[];
  partners?: string[];
  project_end_date?: string;
  project_status?: string;
}

export const CURRENCY_RATES: Record<string, number> = {
  'USD': 1,
  'EUR': 1.08,
  'GBP': 1.26,
  'DKK': 0.14,
  'KES': 0.0075,
  'UGX': 0.00026,
};
