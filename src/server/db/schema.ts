import { z } from 'zod';

export type UserRole = 'SALES_EXECUTIVE' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  title: string;
}

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
  language?: 'en' | 'hi' | 'gu';
  propertyType?: string;
  bedrooms?: number; // e.g. 2 or 3
  budgetMin?: number; // In INR, e.g. 6500000
  budgetMax?: number; // In INR, e.g. 10000000
  budgetDisplay?: string; // e.g. "₹90L – ₹1.1Cr"
  purchaseTimeline?: '0-3 months' | '0-6 months' | '6-12 months' | 'exploring';
  intent?: 'BUY' | 'INVEST' | 'RESEARCH';
  visitPreference?: string; // e.g. "This Weekend", "Saturday Morning"
  locationPreference?: string; // e.g. "Ambli-Bopal", "Shela"
  specificNotes?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  location: string;
  subLocation: string;
  bhkTypes: string[]; // ['2 BHK', '3 BHK']
  minPrice: number; // in INR e.g. 6800000 (68L)
  maxPrice: number; // in INR e.g. 11800000 (1.18Cr)
  priceRangeDisplay: string;
  possessionDate: string; // e.g. "December 2026"
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
  explicitRestrictions: string[]; // Restrictions that AI MUST strictly enforce
  updatedAt: string;
}

export type SlotStatus = 'AVAILABLE' | 'FULL' | 'DISABLED';

export interface VisitSlot {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Saturday, 15 Nov"
  startTime: string; // "10:00 AM"
  endTime: string; // "11:30 AM"
  capacity: number;
  bookedCount: number;
  status: SlotStatus;
}

export interface ConsentRecord {
  consentGiven: boolean;
  consentAt: string;
  optOut: boolean;
  optOutAt?: string;
  termsVersion: string;
}

export interface Lead {
  id: string; // e.g. "LD-58210"
  name: string;
  phone: string;
  normalizedPhone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number; // 0-100
  temperature: LeadTemperature;
  scoreReasons: string[];
  requirements: BuyerRequirements;
  matchedProjectId?: string;
  matchScore?: number;
  assignedExecutiveId?: string;
  assignedExecutiveName?: string;
  consent: ConsentRecord;
  firstResponseMinutes: number; // For metrics
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

export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

export interface SiteVisit {
  id: string;
  leadId: string;
  projectId: string;
  projectName: string;
  slotId: string;
  date: string; // YYYY-MM-DD
  dayLabel: string;
  time: string; // e.g. "11:30 AM"
  status: VisitStatus;
  bookedAt: string;
  completedAt?: string;
  cancellationReason?: string;
  notes?: string;
}

export type ReminderType = '24_HOURS_BEFORE' | '2_HOURS_BEFORE';
export type ReminderStatus = 'SCHEDULED' | 'SIMULATED_SENT';

export interface Reminder {
  id: string;
  siteVisitId: string;
  leadId: string;
  type: ReminderType;
  label: string; // e.g. "1 day before visit (Friday, 11:30 AM)"
  scheduledFor: string;
  status: ReminderStatus;
  message: string;
  sentAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  leadId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: 'en' | 'hi' | 'gu';
  timestamp: string;
  actionPayload?: any; // For structured quick actions or recommendations
}

export interface Activity {
  id: string;
  leadId: string;
  type:
    | 'LEAD_CREATED'
    | 'AI_QUALIFIED'
    | 'PROJECT_MATCHED'
    | 'SITE_VISIT_BOOKED'
    | 'SITE_VISIT_STATUS'
    | 'AI_HANDOFF'
    | 'HUMAN_TAKEOVER'
    | 'DUPLICATE_MERGE'
    | 'OPT_OUT';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

// Zod schemas for AI extraction and request validation
export const BuyerRequirementsSchema = z.object({
  language: z.enum(['en', 'hi', 'gu']).default('en'),
  location: z.string().default('Ahmedabad'),
  propertyType: z.string().default('Apartment'),
  bedrooms: z.number().int().min(1).max(5).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  budgetDisplay: z.string().optional(),
  purchaseTimeline: z.enum(['0-3 months', '0-6 months', '6-12 months', 'exploring']).optional(),
  intent: z.enum(['BUY', 'INVEST', 'RESEARCH']).default('BUY'),
  visitPreference: z.string().optional(),
  locationPreference: z.string().optional(),
  notes: z.string().optional(),
});

export type ExtractedRequirements = z.infer<typeof BuyerRequirementsSchema>;
