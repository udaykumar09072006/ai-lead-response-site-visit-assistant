import { Lead } from '../db/schema.js';

export interface DuplicateMatch {
  existingLead: Lead;
  matchScore: number; // 0 - 100
  matchedFields: string[];
  reasons: string[];
}

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove spaces, hyphens, parentheses, plus signs
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  // If starts with 91 (India country code) and has 12 digits, take last 10
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  // If starts with 0 and has 11 digits, strip leading 0
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Check token overlap
  const tokens1 = s1.split(/\s+/);
  const tokens2 = s2.split(/\s+/);
  const common = tokens1.filter(t => tokens2.includes(t));
  if (common.length > 0) {
    return (2 * common.length) / (tokens1.length + tokens2.length);
  }

  // Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}

export function detectDuplicateLeads(
  newLead: { name: string; phone: string; email?: string },
  existingLeads: Lead[],
  excludeLeadId?: string
): DuplicateMatch[] {
  const normalizedNewPhone = normalizePhoneNumber(newLead.phone);
  const matches: DuplicateMatch[] = [];

  for (const lead of existingLeads) {
    if (excludeLeadId && lead.id === excludeLeadId) continue;
    if (lead.status === 'MERGED') continue; // Don't match already merged leads

    let matchScore = 0;
    const matchedFields: string[] = [];
    const reasons: string[] = [];

    const existingNormalizedPhone = normalizePhoneNumber(lead.phone);

    // Exact phone match
    if (normalizedNewPhone && existingNormalizedPhone && normalizedNewPhone === existingNormalizedPhone) {
      matchScore += 70;
      matchedFields.push('phone');
      reasons.push(`Exact normalized phone match (${normalizedNewPhone})`);
    }

    // Exact email match
    if (newLead.email && lead.email && newLead.email.trim().toLowerCase() === lead.email.trim().toLowerCase()) {
      matchScore += 60;
      matchedFields.push('email');
      reasons.push(`Exact email match (${lead.email})`);
    }

    // Name similarity
    if (newLead.name && lead.name) {
      const nameSim = calculateStringSimilarity(newLead.name, lead.name);
      if (nameSim >= 0.85) {
        matchScore += 25;
        matchedFields.push('name');
        reasons.push(`Strong name similarity (${Math.round(nameSim * 100)}%)`);
      } else if (nameSim >= 0.6) {
        matchScore += 10;
        reasons.push(`Partial name match (${Math.round(nameSim * 100)}%)`);
      }
    }

    // Cap at 100
    const finalScore = Math.min(100, matchScore);

    // Threshold for duplicate alert: >= 60%
    if (finalScore >= 60) {
      matches.push({
        existingLead: lead,
        matchScore: finalScore,
        matchedFields,
        reasons,
      });
    }
  }

  // Sort highest match first
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}
