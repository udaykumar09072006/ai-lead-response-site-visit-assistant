# Company A · AI Lead-Response & Site-Visit Booking Assistant
**Ahmedabad Residential Real Estate Developer (₹65 Lakh – ₹1.2 Crore Segment)**

A production-grade, compliance-aware AI lead-response, qualification, and transactional site-visit booking system designed for Company A, Ahmedabad (420 residential apartments across 2 active projects: **Aura Elysium** on Ambli-Bopal Road and **The Serene Botanica** in Shela).

---

## 1. Problem Statement

Company A receives hundreds of inbound leads monthly from property portals (99acres, MagicBricks), social media ads (Instagram/Meta), website enquiry forms, and roadside hoarding phone calls. Historically, leads accumulated in email inboxes and unstandardized spreadsheets, with manual telecaller follow-up delayed until the following business day.

During this 12-to-24-hour lag:
- Over 60% of high-intent homebuyers go cold or schedule walkthroughs with rival developers.
- Sales executives spend disproportionate hours chasing unqualified inquiries or duplicate submissions.
- Double bookings on prime weekend show-flat slots frustrate buyers and strain on-site executive bandwidth.

## 2. Solution Overview

This assistant provides an immediate, verified, and automated conversion pipeline:
1. **Instant First Response (< 5 min target)**: Engages homebuyers within minutes across English, Hindi (हिन्दी), and Gujarati (ગુજરાતી).
2. **Fact-Sheet Grounded AI**: Answers strictly from an approved Sales Head Fact Sheet with zero hallucinated prices, unapproved discounts, or fake possession dates.
3. **Deterministic Lead Qualification (0–100 Score)**: AI extracts criteria; deterministic mathematical logic scores budget fit, requirement specificity, purchase timeline, and visit intent into HOT (70–100), WARM (40–69), and COLD (0–39).
4. **Deterministic Project Matching**: Matches buyer criteria against active inventory (e.g., 92% match for 3 BHK ₹1 Cr at Aura Elysium) with transparent "why" factors.
5. **Transactional Site-Visit Booking**: Real-time slot availability with mutex-backed concurrency locking preventing double-booking of the same slot.
6. **Compliance-Aware Design (RERA & DPDP)**: Enforces GujRERA registration numbers on all project facts and records explicit consent and opt-out statuses.
7. **Human Handoff**: Instantly assigns serious leads to senior sales consultants (e.g., Priya Shah) with structured AI briefing notes and full chat history.
8. **Source Analytics & Sales Economics**: Tracks leads, visits, show-up rates, and dynamic cost-per-visit metrics from a ₹30 Lakh / 3,000 lead monthly baseline.

---

## 3. Architecture

```text
               +-------------------------------------------+
               |        Buyer (Mobile-First Web App)       |
               +-------------------------------------------+
                                     |
                                     v
               +-------------------------------------------+
               |        React 19 + Vite + Tailwind CSS      |
               +-------------------------------------------+
                                     |  REST API / JSON
                                     v
               +-------------------------------------------+
               |        Express.js Full-Stack Server       |
               +-------------------------------------------+
                                     |
          +--------------------------+--------------------------+
          |                                                     |
          v                                                     v
+-----------------------+                             +--------------------+
|   AI Agent Engine     |                             | Business Services  |
|  (@google/genai SDK)  |                             |  - Lead Scoring    |
|   gemini-3.8-flash    |                             |  - Dupe Detection  |
+-----------------------+                             |  - Project Matcher |
          |                                           +--------------------+
          v                                                     |
+-----------------------+                                       |
| Sales Head Fact Sheet |                                       |
|  Strict Constraints   |                                       |
+-----------------------+                                       |
          |                                                     |
          +--------------------------+--------------------------+
                                     |
                                     v
               +-------------------------------------------+
               |   ACID Transactional Database Engine      |
               |     (Mutex Concurrency Slot Locking)      |
               +-------------------------------------------+
                                     |
                                     v
               +-------------------------------------------+
               |       Sales Executive CRM Dashboard       |
               | (Pipeline, Audit Trail, Source Analytics) |
               +-------------------------------------------+
```

---

## 4. AI Safety & Fact Sheet Invariants

The AI model operates under strict behavioral guardrails:
- **No Hallucinated Information**: The assistant only answers using facts in the approved `FactSheet` table.
- **Refusal on Unsupported Requests**: If an enquirer asks for unapproved discounts or final all-inclusive prices:
  > *"I can share the registered project pricing available in my fact sheet, but I cannot provide a final all-inclusive price or discount. A sales executive can confirm the applicable charges."*
- **RERA Compliance**: GujRERA registration numbers (`PR/GJ/AHMEDABAD/AUDA/MAA10422/2024` and `PR/GJ/AHMEDABAD/AUDA/MAA09918/2023`) are explicitly cited.
- **Zod Schema Validation**: Extracted buyer requirements are validated via Zod schemas before database persistence.

---

## 5. Site-Visit Concurrency & Double-Booking Protection

Concurrency race conditions are eliminated using a serialized transaction lock:
1. Transaction acquires slot lock.
2. Checks condition: `slot.capacity > slot.bookedCount`.
3. If available:
   - Increments `bookedCount`.
   - Creates `SiteVisit` record with status `SCHEDULED`.
   - Queues 24-hour and 2-hour automated reminder jobs.
   - Recalculates lead qualification score to HOT.
   - Commits transaction.
4. If capacity is exhausted:
   - Immediately throws: *"That slot was just booked. Here are the next available times."*
   - Safely rolls back without data corruption.

An interactive **Concurrency Demo** modal is built into the navigation bar to test two simultaneous parallel requests against the final spot of a slot.

---

## 6. Pre-seeded Sample Leads (Section 25)

The database includes realistic demo leads:
- `LD-58210`: **Hardik Patel** (Property Portal, 3 BHK, Aura Elysium, Booked 14 Nov 11:30 AM, Score: 84 HOT).
- `LD-58211`: **Nidhi Shah** (Social Media ad, 2 BHK, The Serene Botanica, Not booked, Score: 58 WARM).
- `LD-58224`: **Kavita Joshi** (Hoarding call, 2 BHK, The Serene Botanica, Visited, Score: 76 HOT).
- `LD-58491`: **Hardik Patel** (Website, 3 BHK, 92% duplicate match with `LD-58210`).

---

## 7. Interactive Demo Scenarios (1-Click Evaluation)

The top banner provides 1-click execution for all four core evaluation flows:
1. **Scenario 1 (Primary Demo)**:
   Input: *"Mujhe Ahmedabad mein 3 BHK chahiye. Budget 1 crore ke aas paas hai. Main is weekend site visit kar sakta hoon."*
   Detects Hindi, extracts 3 BHK / ₹1 Cr / Weekend, matches Aura Elysium (92%), returns real available Saturday slots, and reserves the appointment with reminder tracking.
2. **Scenario 2 (Safety Refusal)**:
   Input: *"I want the cheapest 2BHK. What is the final price including everything?"*
   Refuses to quote unapproved discounts, quotes RERA starting price (₹65L), and offers human handoff.
3. **Scenario 3 (Multilingual Switch)**:
   Input: *"Gujarati ma vaat karo."*
   Switches seamlessly to Gujarati while preserving structured context.
4. **Scenario 4 (Human Handoff)**:
   Input: *"Can I speak to someone?"*
   Instantly assigns senior consultant Priya Shah with an executive briefing summary.

---

## 8. Setup & Development Instructions

### Prerequisites
- Node.js >= 20
- npm >= 10

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```
*(If no API key is set, the application automatically uses deterministic natural-language extraction and fact-sheet rules without crashing).*

### Installation
```bash
npm install
```

### Run Tests
```bash
npm test
```
Runs 8 comprehensive tests verifying duplicate detection, scoring, project matching, slot availability, double-booking prevention, consent opt-out, and Zod output validation.

### Start Full-Stack Dev Server
```bash
npm run dev
```
Starts Express API backend with mounted Vite middleware on `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

---

## 9. Key REST API Endpoints

- `GET /api/projects` - Get active projects (Aura Elysium, The Serene Botanica)
- `GET /api/fact-sheet` - Retrieve approved Sales Head Fact Sheet
- `PATCH /api/fact-sheet` - Update fact sheet (immediately informs future AI answers)
- `GET /api/slots/available` - Get genuinely available slots with open capacity
- `POST /api/chat/message` - Inbound user chat message, extraction & fact-sheet response
- `POST /api/ai/handoff` - Trigger executive handoff with AI summary
- `POST /api/site-visits` - Transactional site-visit booking with race-condition prevention
- `POST /api/site-visits/simulate-concurrency` - Concurrency stress test endpoint
- `GET /api/leads` - List leads with filters (source, temperature, status, search)
- `GET /api/leads/:id` - Full lead dossier (AI score breakdown, transcript, duplicate match)
- `POST /api/leads/:id/merge` - Merge duplicate lead into canonical record
- `POST /api/leads/:id/opt-out` - DPDP consent opt-out
- `GET /api/dashboard/metrics` - High-level conversion and response time metrics
- `GET /api/dashboard/source-performance` - Channel breakdown with show-up rate and CPL
- `POST /api/reset-demo` - Reset database to initial demo state
