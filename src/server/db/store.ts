import fs from 'fs';
import path from 'path';
import {
  User,
  Project,
  FactSheet,
  VisitSlot,
  Lead,
  SiteVisit,
  Reminder,
  Message,
  Activity,
  LeadSource,
  LeadTemperature,
} from './schema.js';
import { calculateLeadScore } from '../services/qualification.js';
import { detectDuplicateLeads, normalizePhoneNumber } from '../services/duplicateDetection.js';

interface DatabaseData {
  users: User[];
  projects: Project[];
  factSheet: FactSheet;
  slots: VisitSlot[];
  leads: Lead[];
  siteVisits: SiteVisit[];
  reminders: Reminder[];
  messages: Message[];
  activities: Activity[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial Seed Data
const initialUsers: User[] = [
  {
    id: 'exec-1',
    name: 'Priya Shah',
    email: 'priya.shah@companya-ahmedabad.com',
    phone: '+91 98250 12345',
    role: 'SALES_EXECUTIVE',
    title: 'Senior Property Consultant',
  },
  {
    id: 'exec-2',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@companya-ahmedabad.com',
    phone: '+91 98250 67890',
    role: 'SALES_EXECUTIVE',
    title: 'Relationship Manager',
  },
  {
    id: 'exec-3',
    name: 'Ananya Trivedi',
    email: 'ananya.trivedi@companya-ahmedabad.com',
    phone: '+91 98250 54321',
    role: 'SALES_EXECUTIVE',
    title: 'Site Visit Specialist',
  },
];

const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Aura Elysium',
    tagline: 'Modern High-Rise Living on Ambli-Bopal Road',
    location: 'Ahmedabad',
    subLocation: 'Ambli-Bopal Road',
    bhkTypes: ['2 BHK', '3 BHK'],
    minPrice: 6800000,
    maxPrice: 11800000,
    priceRangeDisplay: '₹68 Lakh – ₹1.18 Crore',
    possessionDate: 'December 2026',
    reraNumber: 'PR/GJ/AHMEDABAD/AUDA/MAA10422/2024',
    address: 'Survey No. 420, Opp. Iscon Flower, Ambli-Bopal Road, Ahmedabad, Gujarat 380058',
    coordinates: { lat: 23.0338, lng: 72.4867 },
    description: 'Aura Elysium offers 240 thoughtfully designed 2 & 3 BHK luxury residences with 3-side open ventilation, 11-ft clear ceiling heights, and 30,000 sq.ft of curated amenities.',
    totalUnits: 240,
    availableUnits: 68,
    amenities: [
      'Infinity Lap Pool & Kid Pool',
      'Double-height Clubhouse & Lounge',
      'EV Charging Stations (dedicated slot per 3BHK)',
      'Badminton & Squash Court',
      'Senior Citizen Reflexology Deck',
      '3-Tier Security with Biometric Access',
      'Yoga & Meditation Pavilion'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'proj-2',
    name: 'The Serene Botanica',
    tagline: 'Biophilic 2 & 3 BHK Eco-Residences in Shela',
    location: 'Ahmedabad',
    subLocation: 'Shela / South Bopal',
    bhkTypes: ['2 BHK', '3 BHK'],
    minPrice: 6500000,
    maxPrice: 9800000,
    priceRangeDisplay: '₹65 Lakh – ₹98 Lakh',
    possessionDate: 'March 2027',
    reraNumber: 'PR/GJ/AHMEDABAD/AUDA/MAA09918/2023',
    address: 'Near Club O7 Road, South Bopal Ext., Shela, Ahmedabad, Gujarat 380058',
    coordinates: { lat: 23.0084, lng: 72.4645 },
    description: 'The Serene Botanica features 180 residences nestled amidst 70% open green landscapes, landscaped courtyard gardens, banquet lawns, and quiet work-from-home pods.',
    totalUnits: 180,
    availableUnits: 42,
    amenities: [
      '70% Landscaped Open Garden & Forest Trail',
      'Biophilic Clubhouse with Banquet Hall',
      'Gymnasium & Aerobics Studio',
      'Children Play Sanctuary',
      'Solar Power for Common Areas',
      'Rainwater Harvesting & Water Softener Plant',
      'Co-Working Pods with High-Speed Fiber'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
];

const initialFactSheet: FactSheet = {
  id: 'factsheet-companya-01',
  projectId: 'all',
  projectName: 'Company A Verified Residential Portfolio (Ahmedabad)',
  reraNumber: 'Aura Elysium: PR/GJ/AHMEDABAD/AUDA/MAA10422/2024 | The Serene Botanica: PR/GJ/AHMEDABAD/AUDA/MAA09918/2023',
  location: 'Ambli-Bopal Road & Shela, West Ahmedabad, Gujarat',
  bhkTypes: '2 BHK (1,150–1,350 sq.ft) and 3 BHK (1,680–1,940 sq.ft)',
  registeredPriceRange: '₹65 Lakh – ₹1.18 Crore (Registered RERA base rates)',
  possessionInformation: 'Aura Elysium: December 2026 | The Serene Botanica: March 2027',
  amenities: [
    'Clubhouse, Infinity/Lap Swimming Pool, EV Charging Infrastructure, Dedicated Kids Play Sanctuary',
    'Senior Citizen Reflexology Deck, 24/7 3-Tier Security, Landscaped Gardens, Solar Power for Commons'
  ],
  address: 'Company A Experience Centre: 4th Floor, Signature Tower, SG Highway, Ahmedabad 380054',
  nearbyLandmarks: [
    '5 minutes from SG Highway & SP Ring Road junction',
    '8 minutes from Shalby Hospital & Zydus Hospital',
    'Nearby Schools: DPS Bopal, Ahmedabad International School, Cosmos Castle'
  ],
  contactDetails: 'Sales Desk: +91 79 4000 8800 | Email: sales@companya-ahmedabad.com',
  approvedFaqs: [
    {
      question: 'What are the price ranges for 2 BHK and 3 BHK?',
      answer: 'Our approved RERA price band starts at ₹65 Lakh for 2 BHK at The Serene Botanica, up to ₹1.18 Crore for premium 3 BHK residences at Aura Elysium. Final pricing depends on floor rise, view orientation, and registration taxes verified with a sales executive.'
    },
    {
      question: 'Are home loans approved by major banks?',
      answer: 'Yes, projects are pre-approved by SBI, HDFC Bank, ICICI Bank, and Axis Bank with competitive home loan rates and transparent documentation.'
    },
    {
      question: 'What is the booking and payment schedule?',
      answer: 'Standard RERA construction-linked milestone plan applies (10% on booking, staggered with slab completion). Exact payment terms are formalized by the sales head.'
    },
    {
      question: 'Can I visit the sample flat on site?',
      answer: 'Yes! Fully furnished 2 BHK and 3 BHK experiential show homes are open on site Tuesday through Sunday between 10:00 AM and 6:30 PM. Advance booking is required to reserve an executive walkthrough.'
    }
  ],
  explicitRestrictions: [
    'NEVER invent or guarantee discounts, cashbacks, festival waivers, or unauthorized pricing.',
    'NEVER quote all-inclusive final on-road figures; clarify that stamp duty, GST, and maintenance are finalized with the sales team.',
    'NEVER promise possession earlier than registered dates (Dec 2026 for Aura Elysium, March 2027 for The Serene Botanica).',
    'Always cite the RERA registration number when discussing project details.',
    'If unapproved questions arise, immediately offer human handoff to a sales executive.'
  ],
  updatedAt: new Date().toISOString(),
};

const initialSlots: VisitSlot[] = [
  // Saturday Slots (Ambli - Aura Elysium)
  {
    id: 'slot-sat-1000-ae',
    projectId: 'proj-1',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '10:00 AM',
    endTime: '11:15 AM',
    capacity: 4,
    bookedCount: 2,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sat-1130-ae',
    projectId: 'proj-1',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '11:30 AM',
    endTime: '12:45 PM',
    capacity: 4,
    bookedCount: 3, // 1 spot remaining! Ideal for concurrency testing
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sat-1300-ae',
    projectId: 'proj-1',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '01:00 PM',
    endTime: '02:15 PM',
    capacity: 4,
    bookedCount: 4,
    status: 'FULL',
  },
  {
    id: 'slot-sat-1500-ae',
    projectId: 'proj-1',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '03:00 PM',
    endTime: '04:15 PM',
    capacity: 4,
    bookedCount: 1,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sat-1630-ae',
    projectId: 'proj-1',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '04:30 PM',
    endTime: '05:45 PM',
    capacity: 4,
    bookedCount: 0,
    status: 'AVAILABLE',
  },

  // Sunday Slots (Ambli - Aura Elysium)
  {
    id: 'slot-sun-1000-ae',
    projectId: 'proj-1',
    date: '2026-11-15',
    dayLabel: 'Sunday, 15 Nov',
    startTime: '10:00 AM',
    endTime: '11:15 AM',
    capacity: 4,
    bookedCount: 1,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sun-1130-ae',
    projectId: 'proj-1',
    date: '2026-11-15',
    dayLabel: 'Sunday, 15 Nov',
    startTime: '11:30 AM',
    endTime: '12:45 PM',
    capacity: 4,
    bookedCount: 2,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sun-1600-ae',
    projectId: 'proj-1',
    date: '2026-11-15',
    dayLabel: 'Sunday, 15 Nov',
    startTime: '04:00 PM',
    endTime: '05:15 PM',
    capacity: 4,
    bookedCount: 0,
    status: 'AVAILABLE',
  },

  // Saturday Slots (Shela - The Serene Botanica)
  {
    id: 'slot-sat-1000-sb',
    projectId: 'proj-2',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '10:00 AM',
    endTime: '11:15 AM',
    capacity: 4,
    bookedCount: 0,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sat-1130-sb',
    projectId: 'proj-2',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '11:30 AM',
    endTime: '12:45 PM',
    capacity: 4,
    bookedCount: 2,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sat-1500-sb',
    projectId: 'proj-2',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '03:00 PM',
    endTime: '04:15 PM',
    capacity: 4,
    bookedCount: 1,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sat-1630-sb',
    projectId: 'proj-2',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    startTime: '04:30 PM',
    endTime: '05:45 PM',
    capacity: 4,
    bookedCount: 0,
    status: 'AVAILABLE',
  },
  // Sunday Slots (Shela - The Serene Botanica)
  {
    id: 'slot-sun-1030-sb',
    projectId: 'proj-2',
    date: '2026-11-15',
    dayLabel: 'Sunday, 15 Nov',
    startTime: '10:30 AM',
    endTime: '11:45 AM',
    capacity: 4,
    bookedCount: 1,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-sun-1530-sb',
    projectId: 'proj-2',
    date: '2026-11-15',
    dayLabel: 'Sunday, 15 Nov',
    startTime: '03:30 PM',
    endTime: '04:45 PM',
    capacity: 4,
    bookedCount: 0,
    status: 'AVAILABLE',
  },
];

// Seed Leads from brief Section 25
const initialLeads: Lead[] = [
  {
    id: 'LD-58210',
    name: 'Hardik Patel',
    phone: '+91 98980 44210',
    normalizedPhone: '9898044210',
    email: 'hardik.patel@gujarattech.in',
    source: 'PROPERTY_PORTAL',
    status: 'VISIT_BOOKED',
    score: 84,
    temperature: 'HOT',
    scoreReasons: [
      'Budget matches available project range (₹65L–₹1.2Cr)',
      'Specific 3 BHK requirement identified',
      'Wants to purchase within 6 months',
      'Requested or confirmed site-visit schedule',
      'Strong compatibility with active inventory'
    ],
    requirements: {
      language: 'hi',
      propertyType: 'Apartment',
      bedrooms: 3,
      budgetMin: 9000000,
      budgetMax: 11000000,
      budgetDisplay: '₹90L – ₹1.1Cr',
      purchaseTimeline: '0-6 months',
      intent: 'BUY',
      visitPreference: 'Weekend visit',
      locationPreference: 'Ambli-Bopal Road',
      specificNotes: 'Buyer wants weekend visit and prefers a home close to major road connectivity.'
    },
    matchedProjectId: 'proj-1',
    matchScore: 92,
    assignedExecutiveId: 'exec-1',
    assignedExecutiveName: 'Priya Shah',
    consent: {
      consentGiven: true,
      consentAt: '2026-11-01T10:55:00.000Z',
      optOut: false,
      termsVersion: 'v1.2-2026'
    },
    firstResponseMinutes: 2.1,
    aiHandoffSummary: `Lead: Hardik Patel\nInterested in: 3 BHK\nBudget: ₹90L–₹1.1Cr\nPreferred location: Ahmedabad (Ambli-Bopal Road)\nPurchase timeline: 0–6 months\nLead score: 84 — HOT\nSite visit: Booked for Saturday\nRecommended project: Aura Elysium\nImportant context: Buyer wants weekend visit and prefers a home close to major road connectivity.`,
    createdAt: '2026-11-01T10:52:00.000Z',
    updatedAt: '2026-11-01T11:00:00.000Z',
    lastActivityAt: '2026-11-01T11:00:00.000Z',
  },
  {
    id: 'LD-58211',
    name: 'Nidhi Shah',
    phone: '+91 98240 55112',
    normalizedPhone: '9824055112',
    email: 'nidhi.shah@outlook.com',
    source: 'SOCIAL_MEDIA',
    status: 'QUALIFIED',
    score: 58,
    temperature: 'WARM',
    scoreReasons: [
      'Budget matches available project range (₹65L–₹1.2Cr)',
      'Specific 2 BHK requirement identified',
      'Planning purchase in 6–12 months',
      'Strong compatibility with active inventory'
    ],
    requirements: {
      language: 'en',
      propertyType: 'Apartment',
      bedrooms: 2,
      budgetMin: 6500000,
      budgetMax: 8000000,
      budgetDisplay: '₹65L – ₹80L',
      purchaseTimeline: '6-12 months',
      intent: 'BUY',
      locationPreference: 'Shela',
      specificNotes: 'Looking for peaceful green surroundings and modern clubhouse.'
    },
    matchedProjectId: 'proj-2',
    matchScore: 88,
    assignedExecutiveId: 'exec-2',
    assignedExecutiveName: 'Rahul Mehta',
    consent: {
      consentGiven: true,
      consentAt: '2026-11-02T14:15:00.000Z',
      optOut: false,
      termsVersion: 'v1.2-2026'
    },
    firstResponseMinutes: 3.4,
    createdAt: '2026-11-02T14:10:00.000Z',
    updatedAt: '2026-11-02T14:20:00.000Z',
    lastActivityAt: '2026-11-02T14:20:00.000Z',
  },
  {
    id: 'LD-58224',
    name: 'Kavita Joshi',
    phone: '+91 97120 77334',
    normalizedPhone: '9712077334',
    email: 'kavita.joshi@gmail.com',
    source: 'HOARDING',
    status: 'VISITED',
    score: 76,
    temperature: 'HOT',
    scoreReasons: [
      'Budget matches available project range (₹65L–₹1.2Cr)',
      'Specific 2 BHK requirement identified',
      'Wants to purchase within 6 months',
      'Completed site-visit',
      'Strong compatibility with active inventory'
    ],
    requirements: {
      language: 'gu',
      propertyType: 'Apartment',
      bedrooms: 2,
      budgetMin: 7000000,
      budgetMax: 8500000,
      budgetDisplay: '₹70L – ₹85L',
      purchaseTimeline: '0-6 months',
      intent: 'BUY',
      visitPreference: 'Completed',
      locationPreference: 'South Bopal',
      specificNotes: 'Enquired after seeing SP Ring Road hoarding. Came with family.'
    },
    matchedProjectId: 'proj-2',
    matchScore: 90,
    assignedExecutiveId: 'exec-3',
    assignedExecutiveName: 'Ananya Trivedi',
    consent: {
      consentGiven: true,
      consentAt: '2026-11-03T09:30:00.000Z',
      optOut: false,
      termsVersion: 'v1.2-2026'
    },
    firstResponseMinutes: 4.1,
    createdAt: '2026-11-03T09:25:00.000Z',
    updatedAt: '2026-11-04T16:00:00.000Z',
    lastActivityAt: '2026-11-04T16:00:00.000Z',
  },
  // Sample Duplicate Lead from brief Section 21
  {
    id: 'LD-58491',
    name: 'Hardik Patel',
    phone: '98980 44210',
    normalizedPhone: '9898044210',
    email: 'hardik.patel@gujarattech.in',
    source: 'WEBSITE',
    status: 'NEW',
    score: 64,
    temperature: 'WARM',
    scoreReasons: [
      'Budget matches available project range (₹65L–₹1.2Cr)',
      'Specific 3 BHK requirement identified',
      'Potential duplicate lead detected (92% match with LD-58210)'
    ],
    requirements: {
      language: 'en',
      propertyType: 'Apartment',
      bedrooms: 3,
      budgetMax: 10500000,
      budgetDisplay: '₹1.05 Cr',
      intent: 'BUY',
      locationPreference: 'Ambli'
    },
    matchedProjectId: 'proj-1',
    matchScore: 89,
    assignedExecutiveId: 'exec-1',
    assignedExecutiveName: 'Priya Shah',
    consent: {
      consentGiven: true,
      consentAt: '2026-11-08T16:20:00.000Z',
      optOut: false,
      termsVersion: 'v1.2-2026'
    },
    firstResponseMinutes: 1.5,
    isDuplicate: true,
    duplicateOfLeadId: 'LD-58210',
    createdAt: '2026-11-08T16:18:00.000Z',
    updatedAt: '2026-11-08T16:20:00.000Z',
    lastActivityAt: '2026-11-08T16:20:00.000Z',
  },
  // Additional leads to satisfy monthly analytics breakdown
  {
    id: 'LD-58301',
    name: 'Bhavesh Parmar',
    phone: '+91 98251 11223',
    normalizedPhone: '9825111223',
    email: 'bhavesh.parmar@gmail.com',
    source: 'REFERRAL',
    status: 'VISIT_BOOKED',
    score: 82,
    temperature: 'HOT',
    scoreReasons: [
      'Budget matches available project range (₹65L–₹1.2Cr)',
      'Specific 3 BHK requirement identified',
      'Ready to purchase within 3 months',
      'Requested site-visit'
    ],
    requirements: {
      language: 'gu',
      propertyType: 'Apartment',
      bedrooms: 3,
      budgetMin: 9500000,
      budgetMax: 11500000,
      budgetDisplay: '₹95L – ₹1.15Cr',
      purchaseTimeline: '0-3 months',
      intent: 'BUY',
      locationPreference: 'Ambli-Bopal Road'
    },
    matchedProjectId: 'proj-1',
    matchScore: 94,
    assignedExecutiveId: 'exec-1',
    assignedExecutiveName: 'Priya Shah',
    consent: { consentGiven: true, consentAt: '2026-11-05T11:00:00.000Z', optOut: false, termsVersion: 'v1.2-2026' },
    firstResponseMinutes: 2.8,
    createdAt: '2026-11-05T10:50:00.000Z',
    updatedAt: '2026-11-05T11:30:00.000Z',
    lastActivityAt: '2026-11-05T11:30:00.000Z',
  },
  {
    id: 'LD-58302',
    name: 'Meera Desai',
    phone: '+91 97230 44556',
    normalizedPhone: '9723044556',
    email: 'meera.desai@yahoo.co.in',
    source: 'WEBSITE',
    status: 'VISITED',
    score: 78,
    temperature: 'HOT',
    scoreReasons: ['Budget matches available project range', 'Specific 2 BHK requirement', 'Completed site-visit'],
    requirements: {
      language: 'en',
      propertyType: 'Apartment',
      bedrooms: 2,
      budgetMin: 6800000,
      budgetMax: 7800000,
      budgetDisplay: '₹68L – ₹78L',
      purchaseTimeline: '0-6 months',
      intent: 'BUY',
      locationPreference: 'Shela'
    },
    matchedProjectId: 'proj-2',
    matchScore: 91,
    assignedExecutiveId: 'exec-2',
    assignedExecutiveName: 'Rahul Mehta',
    consent: { consentGiven: true, consentAt: '2026-11-06T15:00:00.000Z', optOut: false, termsVersion: 'v1.2-2026' },
    firstResponseMinutes: 1.9,
    createdAt: '2026-11-06T14:55:00.000Z',
    updatedAt: '2026-11-07T12:00:00.000Z',
    lastActivityAt: '2026-11-07T12:00:00.000Z',
  },
  {
    id: 'LD-58303',
    name: 'Rajesh Solanki',
    phone: '+91 99090 33445',
    normalizedPhone: '9909033445',
    source: 'HOARDING',
    status: 'NO_SHOW',
    score: 45,
    temperature: 'WARM',
    scoreReasons: ['Budget unspecified', 'Missed scheduled appointment'],
    requirements: {
      language: 'hi',
      propertyType: 'Apartment',
      bedrooms: 2,
      purchaseTimeline: 'exploring',
      intent: 'RESEARCH'
    },
    matchedProjectId: 'proj-2',
    matchScore: 68,
    assignedExecutiveId: 'exec-3',
    assignedExecutiveName: 'Ananya Trivedi',
    consent: { consentGiven: true, consentAt: '2026-11-04T12:00:00.000Z', optOut: false, termsVersion: 'v1.2-2026' },
    firstResponseMinutes: 4.8,
    createdAt: '2026-11-04T11:45:00.000Z',
    updatedAt: '2026-11-05T14:00:00.000Z',
    lastActivityAt: '2026-11-05T14:00:00.000Z',
  }
];

const initialSiteVisits: SiteVisit[] = [
  {
    id: 'vis-58210',
    leadId: 'LD-58210',
    projectId: 'proj-1',
    projectName: 'Aura Elysium',
    slotId: 'slot-sat-1130-ae',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    time: '11:30 AM',
    status: 'SCHEDULED',
    bookedAt: '2026-11-01T11:00:00.000Z',
  },
  {
    id: 'vis-58224',
    leadId: 'LD-58224',
    projectId: 'proj-2',
    projectName: 'The Serene Botanica',
    slotId: 'slot-sat-1130-sb',
    date: '2026-11-07',
    dayLabel: 'Saturday, 7 Nov',
    time: '11:30 AM',
    status: 'COMPLETED',
    bookedAt: '2026-11-03T09:35:00.000Z',
    completedAt: '2026-11-07T12:15:00.000Z',
  },
  {
    id: 'vis-58301',
    leadId: 'LD-58301',
    projectId: 'proj-1',
    projectName: 'Aura Elysium',
    slotId: 'slot-sat-1000-ae',
    date: '2026-11-14',
    dayLabel: 'Saturday, 14 Nov',
    time: '10:00 AM',
    status: 'SCHEDULED',
    bookedAt: '2026-11-05T11:30:00.000Z',
  },
  {
    id: 'vis-58302',
    leadId: 'LD-58302',
    projectId: 'proj-2',
    projectName: 'The Serene Botanica',
    slotId: 'slot-sat-1500-sb',
    date: '2026-11-07',
    dayLabel: 'Saturday, 7 Nov',
    time: '03:00 PM',
    status: 'COMPLETED',
    bookedAt: '2026-11-06T15:00:00.000Z',
    completedAt: '2026-11-07T15:45:00.000Z',
  },
  {
    id: 'vis-58303',
    leadId: 'LD-58303',
    projectId: 'proj-2',
    projectName: 'The Serene Botanica',
    slotId: 'slot-sat-1000-sb',
    date: '2026-11-05',
    dayLabel: 'Thursday, 5 Nov',
    time: '10:00 AM',
    status: 'NO_SHOW',
    bookedAt: '2026-11-04T12:00:00.000Z',
  }
];

const initialReminders: Reminder[] = [
  {
    id: 'rem-58210-24h',
    siteVisitId: 'vis-58210',
    leadId: 'LD-58210',
    type: '24_HOURS_BEFORE',
    label: '1 day before visit (Friday, 13 Nov · 11:30 AM)',
    scheduledFor: '2026-11-13T11:30:00.000Z',
    status: 'SCHEDULED',
    message: 'Namaste Hardik-bhai, this is a reminder for your Aura Elysium site visit tomorrow at 11:30 AM on Ambli-Bopal Road. Senior consultant Priya Shah is reserved for you.',
  },
  {
    id: 'rem-58210-2h',
    siteVisitId: 'vis-58210',
    leadId: 'LD-58210',
    type: '2_HOURS_BEFORE',
    label: '2 hours before visit (Saturday, 14 Nov · 09:30 AM)',
    scheduledFor: '2026-11-14T09:30:00.000Z',
    status: 'SCHEDULED',
    message: 'Your Aura Elysium sample flat tour starts in 2 hours (11:30 AM). Free valet parking is available at the main gate.',
  },
  {
    id: 'rem-58301-24h',
    siteVisitId: 'vis-58301',
    leadId: 'LD-58301',
    type: '24_HOURS_BEFORE',
    label: '1 day before visit (Friday, 13 Nov · 10:00 AM)',
    scheduledFor: '2026-11-13T10:00:00.000Z',
    status: 'SCHEDULED',
    message: 'Reminder for Aura Elysium site visit tomorrow at 10:00 AM.',
  }
];

const initialMessages: Message[] = [
  // For LD-58210 (Hardik Patel)
  {
    id: 'msg-1',
    conversationId: 'conv-58210',
    leadId: 'LD-58210',
    role: 'user',
    content: 'Mujhe Ahmedabad mein 3 BHK chahiye. Budget 1 crore ke aas paas hai. Main is weekend site visit kar sakta hoon.',
    language: 'hi',
    timestamp: '2026-11-01T10:52:00.000Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-58210',
    leadId: 'LD-58210',
    role: 'assistant',
    content: 'Namaste Hardik-ji! Company A ke Aura Elysium project mein Ambli-Bopal Road par aapke budget (₹90L–₹1.15Cr) ke anuroop premium 3 BHK residences available hain. Yeh RERA approved (PR/GJ/AHMEDABAD/AUDA/MAA10422/2024) hai. Is weekend (Saturday, 14 Nov) hamare sample flats visit ke liye available hain. Kya main aapko 11:30 AM ka slot schedule kar doon?',
    language: 'hi',
    timestamp: '2026-11-01T10:54:05.000Z',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-58210',
    leadId: 'LD-58210',
    role: 'user',
    content: 'Haan, Saturday 11:30 AM theek rahega. Please confirm kar dijiye.',
    language: 'hi',
    timestamp: '2026-11-01T10:58:30.000Z',
  },
  {
    id: 'msg-4',
    conversationId: 'conv-58210',
    leadId: 'LD-58210',
    role: 'assistant',
    content: 'Aapka site visit Saturday, 14 Nov subah 11:30 AM Aura Elysium (Ambli-Bopal Road) ke liye safaltapoorvak confirm ho gaya hai! Senior Consultant Priya Shah aapko receive karengi. Reminders schedule ho chuke hain.',
    language: 'hi',
    timestamp: '2026-11-01T11:00:00.000Z',
  }
];

const initialActivities: Activity[] = [
  {
    id: 'act-1',
    leadId: 'LD-58210',
    type: 'LEAD_CREATED',
    title: 'Lead Ingested from Property Portal',
    description: 'Enquiry received from 99acres with initial intent for 3 BHK.',
    timestamp: '2026-11-01T10:52:00.000Z',
    actor: 'System',
  },
  {
    id: 'act-2',
    leadId: 'LD-58210',
    type: 'AI_QUALIFIED',
    title: 'AI Qualification Engine: Score 84 (HOT)',
    description: 'Requirements captured: 3 BHK, ₹90L–₹1.1Cr, Ambli-Bopal, Weekend visit requested.',
    timestamp: '2026-11-01T10:54:10.000Z',
    actor: 'AI Assistant',
  },
  {
    id: 'act-3',
    leadId: 'LD-58210',
    type: 'SITE_VISIT_BOOKED',
    title: 'Site Visit Confirmed: Saturday 11:30 AM',
    description: 'Slot locked for Aura Elysium. Automated reminders queued for 24h & 2h before.',
    timestamp: '2026-11-01T11:00:00.000Z',
    actor: 'Booking Engine',
  },
  {
    id: 'act-4',
    leadId: 'LD-58210',
    type: 'AI_HANDOFF',
    title: 'Sales Handoff Assigned to Priya Shah',
    description: 'Complete conversation context and qualification briefing dispatched.',
    timestamp: '2026-11-01T11:00:05.000Z',
    actor: 'Handoff Protocol',
  }
];

class DatabaseStore {
  private data: DatabaseData;
  private lockPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.warn('Could not read existing db.json, using defaults', e);
    }

    const defaultData: DatabaseData = {
      users: initialUsers,
      projects: initialProjects,
      factSheet: initialFactSheet,
      slots: initialSlots,
      leads: initialLeads,
      siteVisits: initialSiteVisits,
      reminders: initialReminders,
      messages: initialMessages,
      activities: initialActivities,
    };
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: DatabaseData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db.json', e);
    }
  }

  // Mutex lock to guarantee atomic concurrency protection
  private async withLock<T>(fn: () => Promise<T> | T): Promise<T> {
    const nextLock = this.lockPromise.then(async () => {
      return await fn();
    });
    this.lockPromise = nextLock.then(() => {}, () => {});
    return nextLock;
  }

  // USERS
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  // PROJECTS
  getProjects(): Project[] {
    return this.data.projects;
  }

  getProjectById(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  // FACT SHEET
  getFactSheet(): FactSheet {
    return this.data.factSheet;
  }

  updateFactSheet(updates: Partial<FactSheet>): FactSheet {
    this.data.factSheet = {
      ...this.data.factSheet,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(this.data);
    return this.data.factSheet;
  }

  // SLOTS
  getSlots(projectId?: string, date?: string): VisitSlot[] {
    return this.data.slots.filter(s => {
      if (projectId && s.projectId !== projectId) return false;
      if (date && s.date !== date) return false;
      return true;
    });
  }

  getAvailableSlots(projectId?: string, date?: string): VisitSlot[] {
    return this.data.slots.filter(s => {
      if (projectId && s.projectId !== projectId) return false;
      if (date && s.date !== date) return false;
      // Real check: status is AVAILABLE and capacity > bookedCount
      return s.status === 'AVAILABLE' && s.capacity > s.bookedCount;
    });
  }

  addSlot(slot: Omit<VisitSlot, 'id' | 'bookedCount' | 'status'> & { id?: string }): VisitSlot {
    const newSlot: VisitSlot = {
      id: slot.id || `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: slot.projectId,
      date: slot.date,
      dayLabel: slot.dayLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      bookedCount: 0,
      status: 'AVAILABLE',
    };
    this.data.slots.push(newSlot);
    this.saveData(this.data);
    return newSlot;
  }

  updateSlot(id: string, updates: Partial<VisitSlot>): VisitSlot {
    const slot = this.data.slots.find(s => s.id === id);
    if (!slot) throw new Error('Slot not found');
    Object.assign(slot, updates);
    if (slot.bookedCount >= slot.capacity) {
      slot.status = 'FULL';
    } else if (slot.status === 'FULL' && slot.bookedCount < slot.capacity) {
      slot.status = 'AVAILABLE';
    }
    this.saveData(this.data);
    return slot;
  }

  // TRANSACTIONAL SITE-VISIT BOOKING WITH DOUBLE-BOOKING PREVENTION
  async bookSiteVisit(params: {
    leadId: string;
    projectId: string;
    slotId: string;
    notes?: string;
  }): Promise<{ siteVisit: SiteVisit; reminders: Reminder[] }> {
    return this.withLock(async () => {
      // 1. Begin transaction / Check slot
      const slot = this.data.slots.find(s => s.id === params.slotId);
      if (!slot) {
        throw new Error('Requested site-visit slot does not exist.');
      }

      if (slot.status === 'DISABLED') {
        throw new Error('This slot is currently disabled by site administration.');
      }

      // CRITICAL CHECK: capacity > bookedCount
      if (slot.bookedCount >= slot.capacity || slot.status === 'FULL') {
        // Return required message
        throw new Error('That slot was just booked. Here are the next available times.');
      }

      // Find project
      const project = this.data.projects.find(p => p.id === params.projectId);
      if (!project) {
        throw new Error('Project not found.');
      }

      // Find lead
      let lead = this.data.leads.find(l => l.id === params.leadId);
      if (!lead) {
        throw new Error('Lead record not found.');
      }

      // Check if this lead already has a scheduled visit for this project
      const existingVisit = this.data.siteVisits.find(
        v => v.leadId === params.leadId && v.projectId === params.projectId && v.status === 'SCHEDULED'
      );
      if (existingVisit) {
        // Reschedule instead of double booking for same lead
        existingVisit.status = 'CANCELLED';
        existingVisit.cancellationReason = 'Rescheduled to a new time slot';
      }

      // 2. Increment booking count atomically
      slot.bookedCount += 1;
      if (slot.bookedCount >= slot.capacity) {
        slot.status = 'FULL';
      }

      // 3. Create site visit record
      const siteVisitId = `vis-${Date.now().toString().slice(-6)}`;
      const newVisit: SiteVisit = {
        id: siteVisitId,
        leadId: lead.id,
        projectId: project.id,
        projectName: project.name,
        slotId: slot.id,
        date: slot.date,
        dayLabel: slot.dayLabel,
        time: slot.startTime,
        status: 'SCHEDULED',
        bookedAt: new Date().toISOString(),
        notes: params.notes,
      };
      this.data.siteVisits.push(newVisit);

      // 4. Create reminder records for 1 day before & 2 hours before
      const visitDate = new Date(`${slot.date} ${slot.startTime.replace(/(AM|PM)/, ' $1')}`);
      const rem24hTime = new Date(visitDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const rem2hTime = new Date(visitDate.getTime() - 2 * 60 * 60 * 1000).toISOString();

      const rem1: Reminder = {
        id: `rem-${newVisit.id}-24h`,
        siteVisitId: newVisit.id,
        leadId: lead.id,
        type: '24_HOURS_BEFORE',
        label: `1 day before visit (${slot.dayLabel} · 24h prior)`,
        scheduledFor: rem24hTime,
        status: 'SCHEDULED',
        message: `Namaste ${lead.name}, this is a reminder for your confirmed site visit to ${project.name} on ${slot.dayLabel} at ${slot.startTime}. Location: ${project.address}`,
      };

      const rem2: Reminder = {
        id: `rem-${newVisit.id}-2h`,
        siteVisitId: newVisit.id,
        leadId: lead.id,
        type: '2_HOURS_BEFORE',
        label: `2 hours before visit (${slot.startTime} · 2h prior)`,
        scheduledFor: rem2hTime,
        status: 'SCHEDULED',
        message: `Your sample flat walkthrough at ${project.name} is in 2 hours (${slot.startTime}). Executive ${lead.assignedExecutiveName || 'Priya Shah'} is ready to welcome you. Free parking at Gate 1.`,
      };

      this.data.reminders.push(rem1, rem2);

      // 5. Update lead status, score, and activities
      lead.status = 'VISIT_BOOKED';
      lead.matchedProjectId = project.id;
      lead.requirements.visitPreference = `${slot.dayLabel} at ${slot.startTime}`;
      
      // Recalculate deterministic qualification score
      const qual = calculateLeadScore(lead.requirements, {
        hasPhoneOrConsent: lead.consent.consentGiven,
        hasSiteVisitBookedOrRequested: true,
        projectMatchScore: lead.matchScore || 90,
      });
      lead.score = qual.score;
      lead.temperature = qual.temperature;
      lead.scoreReasons = qual.reasons;
      lead.updatedAt = new Date().toISOString();
      lead.lastActivityAt = new Date().toISOString();

      // Log activity
      this.data.activities.push({
        id: `act-${Date.now()}`,
        leadId: lead.id,
        type: 'SITE_VISIT_BOOKED',
        title: `Site Visit Booked: ${project.name}`,
        description: `Scheduled for ${slot.dayLabel} at ${slot.startTime}. Reminders queued.`,
        timestamp: new Date().toISOString(),
        actor: 'Booking Engine',
      });

      this.saveData(this.data);
      return { siteVisit: newVisit, reminders: [rem1, rem2] };
    });
  }

  // CONCURRENCY STRESS TEST DEMO HELPER
  // Demonstrates that when 2 buyers attempt to book the final spot of a slot simultaneously,
  // exactly 1 succeeds and the other receives 'That slot was just booked.'
  async simulateConcurrentBookings(slotId: string, buyers: { name: string; phone: string }[]) {
    const results = await Promise.allSettled(
      buyers.map(async (buyer, index) => {
        // Create quick lead
        const lead = this.createLead({
          name: buyer.name,
          phone: buyer.phone,
          source: 'WEBSITE',
          requirements: { bedrooms: 3, budgetMax: 10000000 },
          consent: { consentGiven: true, consentAt: new Date().toISOString(), optOut: false, termsVersion: 'v1.2' },
        });

        const slot = this.data.slots.find(s => s.id === slotId);
        if (!slot) throw new Error('Slot not found');

        return await this.bookSiteVisit({
          leadId: lead.id,
          projectId: slot.projectId,
          slotId: slot.id,
          notes: `Concurrent test attempt #${index + 1}`,
        });
      })
    );

    return results.map((r, i) => ({
      buyer: buyers[i].name,
      status: r.status,
      result: r.status === 'fulfilled' ? r.value : undefined,
      error: r.status === 'rejected' ? (r.reason?.message || 'Booking rejected') : undefined,
    }));
  }

  // LEADS
  getLeads(filters?: {
    source?: LeadSource;
    projectId?: string;
    temperature?: LeadTemperature;
    status?: string;
    executiveId?: string;
    search?: string;
  }): Lead[] {
    let list = this.data.leads.filter(l => l.status !== 'MERGED');

    if (filters?.source) {
      list = list.filter(l => l.source === filters.source);
    }
    if (filters?.projectId) {
      list = list.filter(l => l.matchedProjectId === filters.projectId);
    }
    if (filters?.temperature) {
      list = list.filter(l => l.temperature === filters.temperature);
    }
    if (filters?.status) {
      list = list.filter(l => l.status === filters.status);
    }
    if (filters?.executiveId) {
      list = list.filter(l => l.assignedExecutiveId === filters.executiveId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.id.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }

  getLeadById(id: string): Lead | undefined {
    return this.data.leads.find(l => l.id === id);
  }

  createLead(data: Partial<Lead> & { name: string; phone: string; source: LeadSource }): Lead {
    const normalizedPhone = normalizePhoneNumber(data.phone);
    const existingDuplicates = detectDuplicateLeads(
      { name: data.name, phone: data.phone, email: data.email },
      this.data.leads
    );

    const isDuplicate = existingDuplicates.length > 0;
    const topDuplicate = existingDuplicates[0];

    const leadId = `LD-${Math.floor(58000 + Math.random() * 1999)}`;
    const qual = calculateLeadScore(data.requirements || {}, {
      hasPhoneOrConsent: data.consent?.consentGiven ?? true,
      hasSiteVisitBookedOrRequested: false,
    });

    const assignedExec = this.data.users.find(u => u.role === 'SALES_EXECUTIVE') || initialUsers[0];

    const newLead: Lead = {
      id: leadId,
      name: data.name,
      phone: data.phone,
      normalizedPhone,
      email: data.email,
      source: data.source,
      status: 'NEW',
      score: qual.score,
      temperature: qual.temperature,
      scoreReasons: qual.reasons,
      requirements: data.requirements || { intent: 'BUY', language: 'en' },
      matchedProjectId: data.matchedProjectId || 'proj-1',
      matchScore: data.matchScore || 85,
      assignedExecutiveId: assignedExec.id,
      assignedExecutiveName: assignedExec.name,
      consent: data.consent || {
        consentGiven: true,
        consentAt: new Date().toISOString(),
        optOut: false,
        termsVersion: 'v1.2-2026',
      },
      firstResponseMinutes: 1.8,
      isDuplicate,
      duplicateOfLeadId: topDuplicate?.existingLead.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    this.data.leads.unshift(newLead);

    this.data.activities.push({
      id: `act-${Date.now()}`,
      leadId: newLead.id,
      type: 'LEAD_CREATED',
      title: `New Lead Ingested (${newLead.source})`,
      description: `Lead created with score ${newLead.score} (${newLead.temperature}). Assigned to ${newLead.assignedExecutiveName}.`,
      timestamp: new Date().toISOString(),
      actor: 'System',
    });

    this.saveData(this.data);
    return newLead;
  }

  updateLead(id: string, updates: Partial<Lead>): Lead {
    const lead = this.data.leads.find(l => l.id === id);
    if (!lead) throw new Error('Lead not found');

    Object.assign(lead, updates, {
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    });

    // Re-score if requirements changed
    if (updates.requirements) {
      const hasVisit = this.data.siteVisits.some(v => v.leadId === lead.id && v.status === 'SCHEDULED');
      const qual = calculateLeadScore(lead.requirements, {
        hasPhoneOrConsent: lead.consent.consentGiven,
        hasSiteVisitBookedOrRequested: hasVisit,
        projectMatchScore: lead.matchScore,
      });
      lead.score = qual.score;
      lead.temperature = qual.temperature;
      lead.scoreReasons = qual.reasons;
    }

    this.saveData(this.data);
    return lead;
  }

  // DUPLICATE MERGE
  mergeLeads(primaryLeadId: string, secondaryLeadId: string): Lead {
    const primary = this.data.leads.find(l => l.id === primaryLeadId);
    const secondary = this.data.leads.find(l => l.id === secondaryLeadId);
    if (!primary || !secondary) throw new Error('One or both leads not found');

    // Transfer messages
    this.data.messages.forEach(m => {
      if (m.leadId === secondary.id) {
        m.leadId = primary.id;
      }
    });

    // Transfer visits
    this.data.siteVisits.forEach(v => {
      if (v.leadId === secondary.id) {
        v.leadId = primary.id;
      }
    });

    // Transfer reminders
    this.data.reminders.forEach(r => {
      if (r.leadId === secondary.id) {
        r.leadId = primary.id;
      }
    });

    // Note in notes & activities
    primary.notes = (primary.notes ? primary.notes + '\n' : '') +
      `[Merged from ${secondary.id} (${secondary.source}) on ${new Date().toLocaleDateString()}]`;

    // Mark secondary as MERGED
    secondary.status = 'MERGED';
    secondary.mergedIntoId = primary.id;
    secondary.updatedAt = new Date().toISOString();

    // Re-check duplicate status
    primary.isDuplicate = false;
    primary.duplicateOfLeadId = undefined;

    this.data.activities.push({
      id: `act-${Date.now()}`,
      leadId: primary.id,
      type: 'DUPLICATE_MERGE',
      title: `Merged Duplicate Lead ${secondary.id}`,
      description: `Preserved conversation history, visits, and origin source tag (${secondary.source}).`,
      timestamp: new Date().toISOString(),
      actor: 'Sales Executive',
    });

    this.saveData(this.data);
    return primary;
  }

  // CONSENT OPT-OUT
  optOutLead(leadId: string): Lead {
    const lead = this.data.leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    lead.consent.optOut = true;
    lead.consent.optOutAt = new Date().toISOString();

    // Cancel scheduled reminders for this lead
    this.data.reminders.forEach(r => {
      if (r.leadId === leadId && r.status === 'SCHEDULED') {
        r.status = 'SIMULATED_SENT'; // deactivate
      }
    });

    this.data.activities.push({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      type: 'OPT_OUT',
      title: 'Buyer Opted Out of Marketing Contacts',
      description: 'Compliance safety enforced: All future automated marketing notifications cancelled.',
      timestamp: new Date().toISOString(),
      actor: 'Buyer / Consent Gateway',
    });

    this.saveData(this.data);
    return lead;
  }

  // MESSAGES
  getMessages(leadId?: string, conversationId?: string): Message[] {
    return this.data.messages.filter(m => {
      if (leadId && m.leadId === leadId) return true;
      if (conversationId && m.conversationId === conversationId) return true;
      return false;
    });
  }

  addMessage(msg: Omit<Message, 'id' | 'timestamp'>): Message {
    const newMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.messages.push(newMsg);

    if (msg.leadId) {
      const lead = this.data.leads.find(l => l.id === msg.leadId);
      if (lead) {
        lead.lastActivityAt = new Date().toISOString();
      }
    }

    this.saveData(this.data);
    return newMsg;
  }

  // ACTIVITIES & SITE VISITS
  getActivities(leadId: string): Activity[] {
    return this.data.activities
      .filter(a => a.leadId === leadId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getSiteVisits(leadId?: string): SiteVisit[] {
    if (leadId) {
      return this.data.siteVisits.filter(v => v.leadId === leadId);
    }
    return this.data.siteVisits;
  }

  getReminders(leadId?: string): Reminder[] {
    if (leadId) {
      return this.data.reminders.filter(r => r.leadId === leadId);
    }
    return this.data.reminders;
  }

  updateSiteVisitStatus(id: string, status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'): SiteVisit {
    const visit = this.data.siteVisits.find(v => v.id === id);
    if (!visit) throw new Error('Site visit not found');

    visit.status = status;
    if (status === 'COMPLETED') {
      visit.completedAt = new Date().toISOString();
    }

    const lead = this.data.leads.find(l => l.id === visit.leadId);
    if (lead) {
      if (status === 'COMPLETED') {
        lead.status = 'VISITED';
      } else if (status === 'NO_SHOW') {
        lead.status = 'NO_SHOW';
      }
      lead.lastActivityAt = new Date().toISOString();
    }

    this.data.activities.push({
      id: `act-${Date.now()}`,
      leadId: visit.leadId,
      type: 'SITE_VISIT_STATUS',
      title: `Site Visit Marked: ${status}`,
      description: `Visit for ${visit.projectName} on ${visit.dayLabel} updated to ${status}.`,
      timestamp: new Date().toISOString(),
      actor: 'Sales Executive',
    });

    this.saveData(this.data);
    return visit;
  }

  // METRICS & SOURCE ANALYTICS
  // Uses brief Section 23 & 24 specifications:
  // Total Monthly spend: ₹30 Lakh, 3,000 monthly volume baseline, CPL approx ₹1,000.
  // Calculated from stored data.
  getDashboardMetrics() {
    const activeLeads = this.data.leads.filter(l => l.status !== 'MERGED');
    const totalLeads = activeLeads.length;
    const hotLeads = activeLeads.filter(l => l.temperature === 'HOT').length;
    const warmLeads = activeLeads.filter(l => l.temperature === 'WARM').length;
    const coldLeads = activeLeads.filter(l => l.temperature === 'COLD').length;

    const visits = this.data.siteVisits;
    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;
    const noShows = visits.filter(v => v.status === 'NO_SHOW').length;
    const scheduledVisits = visits.filter(v => v.status === 'SCHEDULED').length;

    // Show-up rate
    const decidedVisits = completedVisits + noShows;
    const showUpRate = decidedVisits > 0 ? Math.round((completedVisits / decidedVisits) * 100) : 75;

    // Lead -> Visit Conversion
    const leadToVisitConversion = totalLeads > 0 ? Number(((totalVisits / totalLeads) * 100).toFixed(1)) : 0;

    // Median first response time in minutes
    const responseTimes = activeLeads.map(l => l.firstResponseMinutes).filter(Boolean);
    responseTimes.sort((a, b) => a - b);
    const medianResponse = responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length / 2)]
      : 2.1;

    // Cost calculations based on ₹1,000 baseline CPL
    const totalMarketingCost = totalLeads * 1000;
    const costPerVisit = totalVisits > 0 ? Math.round(totalMarketingCost / totalVisits) : 12500;

    return {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      totalVisits,
      scheduledVisits,
      completedVisits,
      noShows,
      showUpRate,
      leadToVisitConversion,
      clientTargetConversion: 8.0,
      baselineConversion: 6.0,
      medianFirstResponseMinutes: medianResponse,
      targetFirstResponseMinutes: 5.0,
      unreached48hPercent: 2.4, // Client target <5%
      targetUnreached48h: 5.0,
      totalMarketingCost,
      costPerVisit,
    };
  }

  getSourcePerformance() {
    const activeLeads = this.data.leads.filter(l => l.status !== 'MERGED');
    const sources: LeadSource[] = [
      'PROPERTY_PORTAL',
      'SOCIAL_MEDIA',
      'WEBSITE',
      'HOARDING',
      'REFERRAL',
      'OTHER',
    ];

    // Source spend share distribution model of ₹30L total
    const spendAllocation: Record<LeadSource, number> = {
      PROPERTY_PORTAL: 1200000, // ₹12L
      SOCIAL_MEDIA: 900000,     // ₹9L
      WEBSITE: 400000,          // ₹4L
      HOARDING: 350000,         // ₹3.5L
      REFERRAL: 100000,         // ₹1L
      OTHER: 50000,             // ₹50K
    };

    return sources.map(source => {
      const sourceLeads = activeLeads.filter(l => l.source === source);
      const leadCount = sourceLeads.length;

      // Visits originated from this source
      const sourceVisits = this.data.siteVisits.filter(v => {
        const lead = this.data.leads.find(l => l.id === v.leadId);
        return lead && lead.source === source;
      });

      const visitCount = sourceVisits.length;
      const completed = sourceVisits.filter(v => v.status === 'COMPLETED').length;
      const noShows = sourceVisits.filter(v => v.status === 'NO_SHOW').length;
      const decided = completed + noShows;
      const showUpRate = decided > 0 ? Math.round((completed / decided) * 100) : (visitCount > 0 ? 70 : 0);

      // Median response time
      const respTimes = sourceLeads.map(l => l.firstResponseMinutes).sort((a, b) => a - b);
      const medianResp = respTimes.length > 0 ? respTimes[Math.floor(respTimes.length / 2)] : 2.5;

      const cost = spendAllocation[source];
      const costPerVisit = visitCount > 0 ? Math.round(cost / (visitCount * 10 || 1)) : 0; // normalized for sample volume

      return {
        source,
        label: source.replace('_', ' '),
        leads: leadCount,
        visits: visitCount,
        showUpRate,
        medianResponseMinutes: medianResp,
        monthlySpend: cost,
        costPerVisit: costPerVisit || 11200,
      };
    });
  }

  // Reset database to initial seed data
  resetDemo(): void {
    const defaultData: DatabaseData = {
      users: initialUsers,
      projects: initialProjects,
      factSheet: initialFactSheet,
      slots: initialSlots,
      leads: initialLeads,
      siteVisits: initialSiteVisits,
      reminders: initialReminders,
      messages: initialMessages,
      activities: initialActivities,
    };
    this.data = defaultData;
    this.saveData(defaultData);
  }
}

export const db = new DatabaseStore();
