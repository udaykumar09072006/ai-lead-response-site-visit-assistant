# AI Lead-Response & Site-Visit Assistant

> AI-powered real-estate assistant for **instant lead qualification, verified project discovery, transactional site-visit booking, and sales-team handoff**.

**Live Demo:** https://applet-kappa.vercel.app/  
**GitHub:** https://github.com/udaykumar09072006/ai-lead-response-site-visit-assistant

---

## 🎯 Problem

Real-estate leads can arrive from multiple channels but often end up in inboxes or spreadsheets, causing delayed responses, duplicate leads, missed follow-ups, and inefficient site-visit scheduling.

This project demonstrates an AI-assisted workflow that turns a buyer enquiry into a qualified lead and, when appropriate, a confirmed site visit.

```text
Buyer Enquiry
      ↓
AI Conversation
      ↓
Requirement Extraction
      ↓
Lead Qualification
      ↓
Project Matching
      ↓
Real Slot Availability
      ↓
Site-Visit Booking
      ↓
Sales Executive Handoff
```

---

## 🚀 What It Does

### 🤖 AI Lead Assistant

The assistant understands natural-language buyer enquiries and extracts structured requirements such as:

- Location
- BHK configuration
- Budget
- Buying timeline
- Project preference
- Site-visit intent

It supports conversational interactions in:

- English
- Hindi
- Gujarati

Example:

> "Mujhe Ahmedabad mein 3 BHK chahiye. Budget 1 crore ke aas paas hai. Main is weekend site visit kar sakta hoon."

The system can identify the buyer's requirements, find suitable projects, and continue the conversation without requiring a rigid form.

---

## 🧠 AI Agent Architecture

The AI is not given unrestricted access to the database.

Instead, the application follows a controlled tool-based architecture:

```text
User Message
      ↓
Intent / Requirement Extraction
      ↓
Approved Fact-Sheet Retrieval
      ↓
Business Logic
      ↓
AI Response
      ↓
Validated Tool Call
      ↓
Backend Operation
      ↓
Database
      ↓
Result
```

Typical AI tools/workflows include:

```text
get_project_facts()
find_matching_projects()
check_available_slots()
book_site_visit()
handoff_to_sales()
```

The backend remains responsible for validation, authorization, business rules, and transactional database operations.

---

## 🎯 Deterministic Lead Qualification

AI extracts the buyer's requirements, while the backend calculates the lead score using deterministic business logic.

| Factor | Weight |
|---|---:|
| Budget fit | 25 |
| Requirement specificity | 15 |
| Buying timeline | 20 |
| Site-visit intent | 20 |
| Engagement | 10 |
| Project match | 10 |

### Lead Temperature

- 🔥 **HOT:** 70–100
- 🟡 **WARM:** 40–69
- 🔵 **COLD:** 0–39

This separation keeps important business decisions predictable instead of allowing the LLM to directly decide lead priority.

---

## 🏢 Project Matching

Buyer requirements are matched against approved project data.

The matching workflow considers factors such as:

- BHK configuration
- Budget
- Location
- Project availability
- Buyer preferences

The UI also explains **why a project matched** instead of returning an unexplained AI recommendation.

---

# 📅 Site-Visit Booking

Site-visit booking is the core transactional workflow.

```text
Select Project
      ↓
Select Date
      ↓
Check Available Slots
      ↓
Select Slot
      ↓
Confirm Buyer Details
      ↓
Create Booking
      ↓
Schedule Reminders
      ↓
Confirmation
```

The important design principle is:

> **The AI can request a booking, but the backend decides whether the booking is actually valid.**

---

## 🔒 Double-Booking Protection

A major engineering challenge is preventing two buyers from booking the same limited-capacity slot simultaneously.

The backend performs the booking inside a transactional workflow:

```text
BEGIN TRANSACTION
       ↓
Lock / Validate Slot
       ↓
Check Available Capacity
       ↓
Increment Booked Count
       ↓
Create Site Visit
       ↓
Commit Transaction
```

If the slot becomes unavailable during a concurrent booking attempt, the transaction fails safely and the buyer can be offered another available slot.

The project also includes a **concurrency demonstration** for testing simultaneous booking attempts.

---

## 👤 Human Handoff

A buyer can request a sales executive at any point.

The system preserves relevant conversation context and creates a structured handoff containing information such as:

- Buyer name
- Requirements
- Budget
- Timeline
- Project interest
- Lead score
- Site-visit status
- Conversation context

This allows the sales executive to continue the conversation without asking the buyer to repeat everything.

---

# 🛡️ AI Safety & Business Rules

The assistant uses an approved project/fact-sheet data source for business information.

It should not invent:

- Final prices
- Discounts
- Possession commitments
- Availability
- Payment terms
- Legal claims
- RERA information
- Unsupported amenities

For unsupported questions, the assistant can route the buyer to a sales executive.

### Example

If a buyer asks:

> "What is the final price including all charges and discount?"

The assistant does not invent a final number. It can provide the approved information available to it and offer human assistance.

---

## 📋 Compliance-Aware Design

The prototype includes considerations for:

### RERA

Project information can include the relevant registration number and should avoid promotional claims that are not supported by approved project information.

### Consent / Opt-Out

Lead records can maintain consent and opt-out status so promotional follow-ups can respect buyer preferences.

> This project demonstrates compliance-aware engineering patterns; it is not a claim of legal certification or compliance approval.

---

# 📊 Sales Dashboard

The sales interface provides visibility into lead and visit activity.

Key operational information includes:

- Total leads
- Hot leads
- Lead source
- Lead score
- Site visits
- Visit status
- Upcoming visits
- Assigned sales executive
- Response/engagement metrics
- Source performance

---

# 🔎 Duplicate Lead Detection

The application identifies potential duplicate leads using available lead information.

Example:

```text
Existing Lead
LD-58210

New Lead
LD-58491

Potential Match
92%
```

Potential duplicates can be reviewed before creating unnecessary parallel sales follow-ups.

---

# 🧪 Demo Scenarios

The application includes evaluation flows covering the main business requirements.

### Scenario 1 — Buyer Qualification + Booking

```text
"Mujhe Ahmedabad mein 3 BHK chahiye.
Budget 1 crore ke aas paas hai.
Main is weekend site visit kar sakta hoon."
```

Expected flow:

```text
Hindi Detection
      ↓
Requirement Extraction
      ↓
Project Matching
      ↓
Available Weekend Slots
      ↓
Booking
      ↓
Reminder Tracking
      ↓
Sales Handoff
```

---

### Scenario 2 — Unsupported Final Price

```text
"I want the cheapest 2BHK.
What is the final price including everything?"
```

The assistant avoids inventing discounts or unsupported final pricing and can offer a sales-executive handoff.

---

### Scenario 3 — Language Switch

```text
"Gujarati ma vaat karo."
```

The conversation switches language while preserving the buyer's existing context.

---

### Scenario 4 — Human Handoff

```text
"Can I speak to someone?"
```

The system immediately initiates the sales handoff flow.

---

# 🧱 Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- Lucide

### Backend

- Node.js
- Express.js
- TypeScript
- REST APIs
- Zod validation

### AI

- Gemini / LLM API
- AI Agents
- LLM-based requirement extraction
- Tool-based workflows
- Structured outputs
- Prompt engineering
- AI guardrails

### Database

- PostgreSQL
- Prisma ORM

### Deployment

- Vercel
- Node.js-compatible backend hosting
- PostgreSQL cloud database

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │       Buyer         │
                    │   Mobile / Web      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │ Chat + Booking + UI │
                    └──────────┬──────────┘
                               │
                          REST / JSON
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │ Validation + Logic  │
                    └───────┬───────┬─────┘
                            │       │
                 ┌──────────┘       └───────────┐
                 ▼                              ▼
        ┌─────────────────┐           ┌────────────────┐
        │   AI Agent      │           │  PostgreSQL    │
        │   / LLM Layer   │           │  + Prisma      │
        └────────┬────────┘           └────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Validated AI Tools  │
        │                     │
        │ Project Matching    │
        │ Slot Availability   │
        │ Site-Visit Booking  │
        │ Sales Handoff       │
        └─────────────────────┘
```

---

# 🔌 API Highlights

```text
POST  /api/chat/message
POST  /api/ai/handoff

GET   /api/projects
GET   /api/fact-sheet

GET   /api/slots/available
POST  /api/site-visits

GET   /api/leads
GET   /api/leads/:id
POST  /api/leads/check-duplicate
POST  /api/leads/:id/merge

GET   /api/dashboard/metrics
GET   /api/dashboard/source-performance
```

---

# 🧪 Testing

The project includes automated tests around critical business logic, including:

- Duplicate detection
- Lead scoring
- Project matching
- Slot availability
- Double-booking prevention
- Consent / opt-out handling
- AI structured-output validation

Run:

```bash
npm test
```

---

# ⚙️ Local Development

## Requirements

- Node.js >= 20
- npm >= 10
- PostgreSQL

## Installation

```bash
git clone https://github.com/udaykumar09072006/ai-lead-response-site-visit-assistant.git

cd ai-lead-response-site-visit-assistant

npm install
```

Create your environment file:

```env
GEMINI_API_KEY=your_api_key
PORT=3000
DATABASE_URL=your_database_url
```

Then start the application:

```bash
npm run dev
```

For a production build:

```bash
npm run build
npm start
```

---

# 🔐 Environment Variables

Never commit secrets to GitHub.

Example:

```env
GEMINI_API_KEY=
DATABASE_URL=
PORT=3000
```

Use environment variables for all API keys, database credentials, and deployment secrets.

---

# 🌐 Deployment

The frontend is deployed on Vercel:

**https://applet-kappa.vercel.app/**

For complete deployment instructions, see:

**`deployment.md`**

---

# 📈 Engineering Focus

This project is intentionally focused on engineering problems beyond simply building UI features.

### Key engineering challenges

**AI reliability**

Using controlled fact retrieval and backend validation instead of allowing the LLM to invent business data.

**Transactional booking**

Protecting limited site-visit capacity from concurrent booking attempts.

**Deterministic decision logic**

Keeping lead scoring and important business rules outside the LLM.

**Human-in-the-loop**

Allowing buyers to move from AI assistance to a named sales executive without losing context.

**Data quality**

Detecting potential duplicate leads before they create fragmented sales records.

**End-to-end ownership**

The workflow covers:

```text
Lead
 ↓
AI Qualification
 ↓
Project Matching
 ↓
Booking
 ↓
Reminder
 ↓
Sales Handoff
 ↓
Analytics
```

---

# 🚀 Future Improvements

Possible production extensions include:

- WhatsApp Business API integration
- SMS/email reminder providers
- Calendar integrations
- CRM integrations
- MCP server/tool integrations
- Advanced agent orchestration
- Multi-project support
- Lead-source integrations
- Automated follow-up workflows
- Advanced conversion analytics

These are intentionally separated from the core prototype so the current implementation remains focused on the challenge requirements.

---

# 👨‍💻 Author

**Uday Kumar**

Computer Science Engineer | Full-Stack & AI

**GitHub:** https://github.com/udaykumar09072006  
**LinkedIn:** https://linkedin.com/in/uday-kumar-08934628b  
**Portfolio:** https://uday-portfolio-six.vercel.app

---

## 📌 Disclaimer

This is a technical prototype based on the supplied real-estate AI assistant challenge.

Any project information, pricing, inventory, registration details, or buyer data shown in the demo should be treated as **sample/demo data unless connected to verified production systems**.

This project does not constitute legal, RERA, financial, or real-estate advice.
