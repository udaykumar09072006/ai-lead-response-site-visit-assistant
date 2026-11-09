import { Project, BuyerRequirements } from '../db/schema.js';

export interface ProjectMatchResult {
  project: Project;
  matchScore: number; // 0 - 100
  reasons: string[];
  bhkMatch: boolean;
  budgetMatch: boolean;
  locationMatch: boolean;
  timelineMatch: boolean;
}

export function matchProjects(
  requirements: BuyerRequirements,
  projects: Project[]
): ProjectMatchResult[] {
  const results: ProjectMatchResult[] = [];

  for (const project of projects) {
    let score = 50; // baseline interest
    const reasons: string[] = [];

    // BHK Check
    let bhkMatch = false;
    const requestedBhkStr = requirements.bedrooms ? `${requirements.bedrooms} BHK` : null;
    if (requestedBhkStr && project.bhkTypes.includes(requestedBhkStr)) {
      score += 20;
      bhkMatch = true;
      reasons.push(`✓ ${requestedBhkStr} layout currently available`);
    } else if (!requirements.bedrooms) {
      score += 10;
      bhkMatch = true;
      reasons.push(`✓ Both 2 & 3 BHK configurations available`);
    } else {
      score -= 15;
      reasons.push(`✗ Preferred ${requestedBhkStr} is limited/not primary configuration`);
    }

    // Budget Check
    let budgetMatch = false;
    const buyerMaxBudget = requirements.budgetMax;
    if (buyerMaxBudget) {
      if (buyerMaxBudget >= project.minPrice && buyerMaxBudget <= project.maxPrice * 1.15) {
        score += 20;
        budgetMatch = true;
        reasons.push(`✓ Budget compatible with registered range (${project.priceRangeDisplay})`);
      } else if (buyerMaxBudget >= project.minPrice * 0.9) {
        score += 10;
        budgetMatch = true;
        reasons.push(`✓ Within reach of starting price (${project.priceRangeDisplay})`);
      } else if (buyerMaxBudget < project.minPrice) {
        score -= 20;
        reasons.push(`✗ Below registered starting price of ${project.priceRangeDisplay}`);
      }
    } else {
      score += 10;
      budgetMatch = true;
      reasons.push(`✓ Pricing matches competitive Ahmedabad segment (${project.priceRangeDisplay})`);
    }

    // Location Check
    let locationMatch = false;
    const locPref = requirements.locationPreference?.toLowerCase() || '';
    if (locPref && (project.location.toLowerCase().includes(locPref) || project.subLocation.toLowerCase().includes(locPref))) {
      score += 10;
      locationMatch = true;
      reasons.push(`✓ Preferred ${project.subLocation} location`);
    } else {
      locationMatch = true;
      score += 5;
      reasons.push(`✓ Prime ${project.subLocation}, Ahmedabad connectivity`);
    }

    // Timeline Check
    let timelineMatch = false;
    if (requirements.purchaseTimeline === '0-3 months' || requirements.purchaseTimeline === '0-6 months') {
      timelineMatch = true;
      score += 5;
      reasons.push(`✓ Possession timeline (${project.possessionDate}) alignable with target`);
    } else {
      timelineMatch = true;
      reasons.push(`✓ Flexible possession timeline (${project.possessionDate})`);
    }

    const finalScore = Math.min(98, Math.max(20, score));

    results.push({
      project,
      matchScore: finalScore,
      reasons,
      bhkMatch,
      budgetMatch,
      locationMatch,
      timelineMatch,
    });
  }

  // Sort descending by matchScore
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
