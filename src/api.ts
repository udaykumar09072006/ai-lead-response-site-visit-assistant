import {
  Project,
  FactSheet,
  VisitSlot,
  Lead,
  SiteVisit,
  Reminder,
  DashboardMetrics,
  SourcePerformance,
  DuplicateMatch,
  Language,
  BuyerRequirements,
} from './types.js';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Projects
  getProjects: () => fetchJson<Project[]>('/api/projects'),
  getProject: (id: string) => fetchJson<Project>(`/api/projects/${id}`),

  // Fact Sheet
  getFactSheet: () => fetchJson<FactSheet>('/api/fact-sheet'),
  updateFactSheet: (updates: Partial<FactSheet>) =>
    fetchJson<FactSheet>('/api/fact-sheet', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Slots
  getSlots: (projectId?: string, date?: string) => {
    const q = new URLSearchParams();
    if (projectId) q.append('projectId', projectId);
    if (date) q.append('date', date);
    return fetchJson<VisitSlot[]>(`/api/slots?${q.toString()}`);
  },
  getAvailableSlots: (projectId?: string, date?: string) => {
    const q = new URLSearchParams();
    if (projectId) q.append('projectId', projectId);
    if (date) q.append('date', date);
    return fetchJson<VisitSlot[]>(`/api/slots/available?${q.toString()}`);
  },
  addSlot: (slotData: any) =>
    fetchJson<VisitSlot>('/api/admin/slots', {
      method: 'POST',
      body: JSON.stringify(slotData),
    }),
  updateSlot: (id: string, updates: Partial<VisitSlot>) =>
    fetchJson<VisitSlot>(`/api/admin/slots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Chat
  sendMessage: (params: {
    leadId?: string;
    message: string;
    language?: Language;
    history?: { role: string; content: string }[];
    currentRequirements?: BuyerRequirements;
  }) =>
    fetchJson<{
      reply: string;
      language: Language;
      requirements: BuyerRequirements;
      isHandoffRequested: boolean;
      recommendedProjectId?: string;
      matchedProjects?: any[];
      availableSlots?: VisitSlot[];
      lead?: Lead;
    }>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Handoff
  requestHandoff: (leadId?: string, reason?: string) =>
    fetchJson<{ executive: any; summary: string; lead: Lead }>('/api/ai/handoff', {
      method: 'POST',
      body: JSON.stringify({ leadId, reason }),
    }),

  // Site Visits
  bookSiteVisit: (params: {
    leadId?: string;
    projectId: string;
    slotId: string;
    notes?: string;
    buyerName?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    source?: string;
  }) =>
    fetchJson<{ siteVisit: SiteVisit; reminders: Reminder[]; lead: Lead }>(
      '/api/site-visits',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    ),

  simulateConcurrency: (slotId?: string) =>
    fetchJson<any>('/api/site-visits/simulate-concurrency', {
      method: 'POST',
      body: JSON.stringify({ slotId }),
    }),

  updateSiteVisitStatus: (id: string, status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED') =>
    fetchJson<SiteVisit>(`/api/site-visits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Leads
  getLeads: (filters?: Record<string, string>) => {
    const q = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) q.append(k, v);
      });
    }
    return fetchJson<Lead[]>(`/api/leads?${q.toString()}`);
  },

  getLeadDetail: (id: string) =>
    fetchJson<{
      lead: Lead;
      messages: any[];
      visits: SiteVisit[];
      reminders: Reminder[];
      activities: any[];
      duplicateMatches: DuplicateMatch[];
    }>(`/api/leads/${id}`),

  createLead: (leadData: any) =>
    fetchJson<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    }),

  mergeLeads: (primaryLeadId: string, secondaryLeadId: string) =>
    fetchJson<Lead>(`/api/leads/${primaryLeadId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ secondaryLeadId }),
    }),

  optOutLead: (leadId: string) =>
    fetchJson<Lead>(`/api/leads/${leadId}/opt-out`, {
      method: 'POST',
    }),

  // Dashboard Metrics & Analytics
  getDashboardMetrics: () => fetchJson<DashboardMetrics>('/api/dashboard/metrics'),
  getSourcePerformance: () => fetchJson<SourcePerformance[]>('/api/dashboard/source-performance'),

  // Reset Demo
  resetDemo: () =>
    fetchJson<{ message: string }>('/api/reset-demo', {
      method: 'POST',
    }),
};
