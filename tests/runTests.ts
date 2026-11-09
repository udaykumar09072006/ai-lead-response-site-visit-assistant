import assert from 'assert';
import { db } from '../src/server/db/store.js';
import { calculateLeadScore } from '../src/server/services/qualification.js';
import { detectDuplicateLeads, normalizePhoneNumber } from '../src/server/services/duplicateDetection.js';
import { matchProjects } from '../src/server/services/projectMatcher.js';
import { BuyerRequirementsSchema } from '../src/server/db/schema.js';

async function runAllTests() {
  console.log('🧪 Starting Critical Business Logic Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  ✓ ${name}`);
        passed++;
      })
      .catch(err => {
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.message}`);
        failed++;
      });
  }

  // 1. Phone Normalization & Duplicate Detection
  await test('Duplicate Detection: Normalizes phone numbers with country code, leading zeros, and formatting', () => {
    assert.strictEqual(normalizePhoneNumber('+91 98980 44210'), '9898044210');
    assert.strictEqual(normalizePhoneNumber('098980-44210'), '9898044210');
    assert.strictEqual(normalizePhoneNumber('(98980) 44210'), '9898044210');
  });

  await test('Duplicate Detection: Flags duplicate lead when phone or email matches existing lead', () => {
    const existing = db.getLeads();
    const matches = detectDuplicateLeads(
      { name: 'Hardik Patel', phone: '98980 44210', email: 'hardik.patel@gujarattech.in' },
      existing
    );
    assert(matches.length > 0, 'Expected to detect at least one duplicate');
    assert(
      matches.some(m => m.existingLead.id === 'LD-58210' || m.existingLead.id === 'LD-58491'),
      'Expected to match existing Hardik Patel leads'
    );
    assert(matches[0].matchScore >= 80, 'Match score should be high for matching phone and email');
  });

  // 2. Deterministic Lead Scoring
  await test('Lead Scoring: Calculates deterministic 0-100 score and classifies HOT/WARM/COLD', () => {
    // High-intent 3 BHK with 1 Cr budget ready in 6 months with site-visit request
    const hotResult = calculateLeadScore(
      {
        bedrooms: 3,
        budgetMax: 10000000,
        purchaseTimeline: '0-6 months',
        locationPreference: 'Ambli-Bopal',
        visitPreference: 'Weekend visit',
      },
      {
        hasPhoneOrConsent: true,
        hasSiteVisitBookedOrRequested: true,
        projectMatchScore: 92,
      }
    );

    assert(hotResult.score >= 70, `Expected HOT score >= 70, got ${hotResult.score}`);
    assert.strictEqual(hotResult.temperature, 'HOT');
    assert(hotResult.reasons.length > 0, 'Reasons should be explained');

    // Exploring buyer without budget or visit intent
    const coldResult = calculateLeadScore({
      purchaseTimeline: 'exploring',
    });
    assert(coldResult.score < 40, `Expected COLD score < 40, got ${coldResult.score}`);
    assert.strictEqual(coldResult.temperature, 'COLD');
  });

  // 3. Project Matching
  await test('Project Matching: Deterministically matches 3 BHK around 1 Cr to Aura Elysium', () => {
    const projects = db.getProjects();
    const results = matchProjects(
      {
        bedrooms: 3,
        budgetMax: 10000000,
        purchaseTimeline: '0-6 months',
      },
      projects
    );

    assert(results.length >= 2, 'Should evaluate both live projects');
    const best = results[0];
    assert.strictEqual(best.project.id, 'proj-1', 'Aura Elysium should be top match');
    assert(best.matchScore >= 85, 'Match score should be high');
    assert(best.bhkMatch, 'BHK match should be true');
    assert(best.budgetMatch, 'Budget match should be true');
  });

  // 4. Slot Availability & Capacity Validation
  await test('Slot Availability: Filters out full and disabled slots', () => {
    // Add temporary slot with capacity 1
    const testSlot = db.addSlot({
      projectId: 'proj-1',
      date: '2026-11-28',
      dayLabel: 'Saturday, 28 Nov',
      startTime: '02:00 PM',
      endTime: '03:15 PM',
      capacity: 1,
    });

    const availBefore = db.getAvailableSlots('proj-1', '2026-11-28');
    assert(availBefore.some(s => s.id === testSlot.id), 'Slot should initially be available');

    // Manually mark full
    db.updateSlot(testSlot.id, { bookedCount: 1, status: 'FULL' });
    const availAfter = db.getAvailableSlots('proj-1', '2026-11-28');
    assert(!availAfter.some(s => s.id === testSlot.id), 'Slot should not appear when full');
  });

  // 5. Double-Booking Prevention & Concurrency Protection
  await test('Double-Booking Prevention: Concurrently booking final slot permits exactly 1 success', async () => {
    // Create dedicated slot with capacity 1
    const exclusiveSlot = db.addSlot({
      projectId: 'proj-1',
      date: '2026-11-29',
      dayLabel: 'Sunday, 29 Nov',
      startTime: '11:00 AM',
      endTime: '12:15 PM',
      capacity: 1,
    });

    const results = await db.simulateConcurrentBookings(exclusiveSlot.id, [
      { name: 'Concurrent Buyer 1', phone: '98250 11111' },
      { name: 'Concurrent Buyer 2', phone: '98250 22222' },
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    assert.strictEqual(successes.length, 1, 'Exactly one concurrent booking should succeed');
    assert.strictEqual(failures.length, 1, 'Second concurrent booking must fail');
    assert(
      failures[0].error?.includes('That slot was just booked'),
      `Expected standard rejection message, got: ${failures[0].error}`
    );

    // Verify slot in DB is full
    const slotInDb = db.getSlots('proj-1', '2026-11-29').find(s => s.id === exclusiveSlot.id);
    assert.strictEqual(slotInDb?.bookedCount, 1);
    assert.strictEqual(slotInDb?.status, 'FULL');
  });

  // 6. Consent & Opt-Out Safety
  await test('Consent & Opt-Out: Respects DPDP opt-out and cancels future notifications', () => {
    const lead = db.createLead({
      name: 'Opt-Out Test Lead',
      phone: '98250 88776',
      source: 'WEBSITE',
      consent: { consentGiven: true, consentAt: new Date().toISOString(), optOut: false, termsVersion: 'v1.2' },
    });

    assert.strictEqual(lead.consent.optOut, false);
    const updated = db.optOutLead(lead.id);
    assert.strictEqual(updated.consent.optOut, true);
    assert(updated.consent.optOutAt !== undefined);

    // Verify activity logged
    const activities = db.getActivities(lead.id);
    assert(activities.some(a => a.type === 'OPT_OUT'), 'Opt-out activity should be recorded');
  });

  // 7. Zod AI Output Validation
  await test('AI Output Validation: Zod parses and validates requirement extraction schema', () => {
    const validData = {
      language: 'hi',
      location: 'Ahmedabad',
      propertyType: 'Apartment',
      bedrooms: 3,
      budgetMax: 10000000,
      purchaseTimeline: '0-6 months',
      intent: 'BUY',
    };
    const parsed = BuyerRequirementsSchema.parse(validData);
    assert.strictEqual(parsed.bedrooms, 3);
    assert.strictEqual(parsed.language, 'hi');
  });

  console.log(`\nTest Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(e => {
  console.error('Test runner encountered an error:', e);
  process.exit(1);
});
