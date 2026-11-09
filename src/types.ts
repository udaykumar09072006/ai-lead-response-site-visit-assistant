export type Language = 'en' | 'hi' | 'gu';

export type LeadSource =
  | 'PROPERTY_PORTAL'
  | 'SOCIAL_MEDIA'
  | 'WEBSITE'
  | 'HOARDING'
  | 'REFERRAL'
  | 'OTHER';

export type LeadStatus =
  | 'NEW'
  | 'QUALIFIED'
  | 'VISIT_BOOKED'
  | 'HANDED_OFF'
  | 'VISITED'
  | 'NO_SHOW'
  | 'LOST'
  | 'MERGED';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export interface BuyerRequirements {
  language?: Language;
  propertyType?: string;
  bedrooms?: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetDisplay?: string;
  purchaseTimeline?: '0-3 months' | '0-6 months' | '6-12 months' | 'exploring';
  intent?: 'BUY' | 'INVEST' | 'RESEARCH';
  visitPreference?: string;
  locationPreference?: string;
  specificNotes?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  location: string;
  subLocation: string;
  bhkTypes: string[];
  minPrice: number;
  maxPrice: number;
  priceRangeDisplay: string;
  possessionDate: string;
  reraNumber: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  totalUnits: number;
  availableUnits: number;
  amenities: string[];
  imageUrl: string;
}

export interface ApprovedFaq {
  question: string;
  answer: string;
}

export interface FactSheet {
  id: string;
  projectId: string;
  projectName: string;
  reraNumber: string;
  location: string;
  bhkTypes: string;
  registeredPriceRange: string;
  possessionInformation: string;
  amenities: string[];
  address: string;
  nearbyLandmarks: string[];
  contactDetails: string;
  approvedFaqs: ApprovedFaq[];
  explicitRestrictions: string[];
  updatedAt: string;
}

export interface VisitSlot {
  id: string;
  projectId: string;
  date: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  status: 'AVAILABLE' | 'FULL' | 'DISABLED';
}

export interface ConsentRecord {
  consentGiven: boolean;
  consentAt: string;
  optOut: boolean;
  optOutAt?: string;
  termsVersion: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  temperature: LeadTemperature;
  scoreReasons: string[];
  requirements: BuyerRequirements;
  matchedProjectId?: string;
  matchScore?: number;
  assignedExecutiveId?: string;
  assignedExecutiveName?: string;
  consent: ConsentRecord;
  firstResponseMinutes: number;
  aiHandoffSummary?: string;
  handoffReason?: string;
  notes?: string;
  isDuplicate?: boolean;
  duplicateOfLeadId?: string;
  mergedIntoId?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface SiteVisit {
  id: string;
  leadId: string;
  projectId: string;
  projectName: string;
  slotId: string;
  date: string;
  dayLabel: string;
  time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  bookedAt: string;
  completedAt?: string;
  cancellationReason?: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  siteVisitId: string;
  leadId: string;
  type: '24_HOURS_BEFORE' | '2_HOURS_BEFORE';
  label: string;
  scheduledFor: string;
  status: 'SCHEDULED' | 'SIMULATED_SENT';
  message: string;
  sentAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  leadId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: Language;
  timestamp: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface DuplicateMatch {
  existingLead: Lead;
  matchScore: number;
  matchedFields: string[];
  reasons: string[];
}

export interface DashboardMetrics {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  totalVisits: number;
  scheduledVisits: number;
  completedVisits: number;
  noShows: number;
  showUpRate: number;
  leadToVisitConversion: number;
  clientTargetConversion: number;
  baselineConversion: number;
  medianFirstResponseMinutes: number;
  targetFirstResponseMinutes: number;
  unreached48hPercent: number;
  targetUnreached48h: number;
  totalMarketingCost: number;
  costPerVisit: number;
}

export interface SourcePerformance {
  source: LeadSource;
  label: string;
  leads: number;
  visits: number;
  showUpRate: number;
  medianResponseMinutes: number;
  monthlySpend: number;
  costPerVisit: number;
}
