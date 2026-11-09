import { BuyerRequirements, LeadTemperature } from '../db/schema.js';

export interface QualificationResult {
  score: number;
  temperature: LeadTemperature;
  breakdown: {
    budgetFit: number; // max 25
    requirementSpecificity: number; // max 15
    purchaseTimeline: number; // max 20
    siteVisitIntent: number; // max 20
    engagement: number; // max 10
    projectMatch: number; // max 10
  };
  reasons: string[];
}

export function calculateLeadScore(
  req: BuyerRequirements,
  options: {
    hasPhoneOrConsent?: boolean;
    hasSiteVisitBookedOrRequested?: boolean;
    messagesCount?: number;
    projectMatchScore?: number;
  } = {}
): QualificationResult {
  let budgetFit = 0;
  let requirementSpecificity = 0;
  let purchaseTimeline = 0;
  let siteVisitIntent = 0;
  let engagement = 0;
  let projectMatch = 0;

  const reasons: string[] = [];

  // 1. Budget Fit (0-25)
  // Ahmedabad projects: ₹65 Lakh to ₹1.2 Crore
  const budgetMax = req.budgetMax || (req.budgetDisplay?.includes('1') ? 10000000 : 0);
  if (budgetMax >= 6500000 && budgetMax <= 12500000) {
    budgetFit = 25;
    reasons.push('Budget matches available project range (₹65L–₹1.2Cr)');
  } else if (budgetMax >= 5500000 && budgetMax <= 14000000) {
    budgetFit = 18;
    reasons.push('Budget within near-match flexibility range');
  } else if (budgetMax > 0) {
    budgetFit = 10;
    reasons.push('Budget specified but requires executive alignment');
  } else {
    budgetFit = 0;
  }

  // 2. Requirement Specificity (0-15)
  if (req.bedrooms === 2 || req.bedrooms === 3) {
    requirementSpecificity += 8;
    reasons.push(`Specific ${req.bedrooms} BHK requirement identified`);
  } else if (req.bedrooms) {
    requirementSpecificity += 4;
  }

  if (req.locationPreference || (req.specificNotes && req.specificNotes.length > 5)) {
    requirementSpecificity += 4;
    reasons.push('Specific location/connectivity preference indicated');
  }

  if (req.intent === 'BUY') {
    requirementSpecificity += 3;
  } else if (req.intent) {
    requirementSpecificity += 2;
  }

  // 3. Purchase Timeline (0-20)
  if (req.purchaseTimeline === '0-3 months') {
    purchaseTimeline = 20;
    reasons.push('High urgency: Ready to purchase within 0–3 months');
  } else if (req.purchaseTimeline === '0-6 months') {
    purchaseTimeline = 16;
    reasons.push('Wants to purchase within 6 months');
  } else if (req.purchaseTimeline === '6-12 months') {
    purchaseTimeline = 10;
    reasons.push('Planning purchase in 6–12 months');
  } else if (req.purchaseTimeline === 'exploring') {
    purchaseTimeline = 5;
    reasons.push('Currently exploring options');
  } else {
    purchaseTimeline = 2;
  }

  // 4. Site-visit Intent (0-20)
  if (options.hasSiteVisitBookedOrRequested || (req.visitPreference && req.visitPreference.length > 0)) {
    siteVisitIntent = 20;
    reasons.push('Requested or confirmed site-visit schedule');
  } else {
    siteVisitIntent = 0;
  }

  // 5. Engagement (0-10)
  if (options.hasPhoneOrConsent) {
    engagement += 6;
  }
  if ((options.messagesCount ?? 0) >= 2) {
    engagement += 4;
  } else if ((options.messagesCount ?? 0) >= 1) {
    engagement += 2;
  }

  // 6. Project Match (0-10)
  const matchPct = options.projectMatchScore ?? 80;
  if (matchPct >= 85) {
    projectMatch = 10;
    reasons.push('Strong compatibility with active inventory');
  } else if (matchPct >= 70) {
    projectMatch = 7;
  } else {
    projectMatch = 4;
  }

  const score = Math.min(100, Math.max(0, budgetFit + requirementSpecificity + purchaseTimeline + siteVisitIntent + engagement + projectMatch));

  let temperature: LeadTemperature = 'COLD';
  if (score >= 70) {
    temperature = 'HOT';
  } else if (score >= 40) {
    temperature = 'WARM';
  }

  return {
    score,
    temperature,
    breakdown: {
      budgetFit,
      requirementSpecificity,
      purchaseTimeline,
      siteVisitIntent,
      engagement,
      projectMatch,
    },
    reasons,
  };
}
