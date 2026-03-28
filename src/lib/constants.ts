export const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  TEAM_TOKEN: 'toyota2024',
};

export const STAGES = [
  'Concept',
  'Tender Spec & Quotation',
  'Procure & PO',
  'Drawing',
  'Fabrication',
  'PDI',
  'Shipping & Tax',
  'Delivery',
  'Installation',
  'Trial',
  'Handover',
] as const;

export const EQUIPMENT_GROUPS = [
  'Machining', 'Welding', 'Assembly', 'Press', 'Paint', 'Logistics', 'Inspection', 'Utilities', 'Other',
];

export const EQUIPMENT_SOURCES = [
  'Local', 'Import - Japan', 'Import - China', 'Import - Germany', 'Import - Other',
];

export const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  'IN PROGRESS': '#0ea5e9',
  DELAY: '#ef4444',
  UPCOMING: '#64748b',
  'NOT STARTED': '#475569',
};
