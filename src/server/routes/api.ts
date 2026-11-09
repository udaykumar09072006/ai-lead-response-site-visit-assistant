import { Router } from 'express';
import { db } from '../db/store.js';
import { matchProjects } from '../services/projectMatcher.js';
import { detectDuplicateLeads } from '../services/duplicateDetection.js';
import {
  extractRequirementsWithAI,
  generateGroundedResponse,
  generateHandoffSummary,
  detectLanguage,
} from '../services/aiService.js';
import { LeadSource, LeadTemperature } from '../db/schema.js';

export const apiRouter = Router();

// HEALTH
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Company A Lead & Booking Engine',
  });
});

// PROJECTS
apiRouter.get('/projects', (req, res) => {
  const projects = db.getProjects();
  res.json({ success: true, data: projects });
});

apiRouter.get('/projects/:id', (req, res) => {
  const project = db.getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, data: project });
});

// FACT SHEET
apiRouter.get('/fact-sheet', (req, res) => {
  const sheet = db.getFactSheet();
  res.json({ success: true, data: sheet });
});

apiRouter.patch('/fact-sheet', (req, res) => {
  try {
    const updated = db.updateFactSheet(req.body);
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// SLOTS
apiRouter.get('/slots', (req, res) => {
  const { projectId, date } = req.query;
  const slots = db.getSlots(projectId as string, date as string);
  res.json({ success: true, data: slots });
});

apiRouter.get('/slots/available', (req, res) => {
  const { projectId, date } = req.query;
  const slots = db.getAvailableSlots(projectId as string, date as string);
  res.json({ success: true, data: slots });
});

apiRouter.post('/admin/slots', (req, res) => {
  try {
    const { projectId, date, dayLabel, startTime, endTime, capacity } = req.body;
    if (!projectId || !date || !startTime || !endTime || !capacity) {
      return res.status(400).json({ success: false, error: 'Missing required slot fields' });
    }
    const slot = db.addSlot({
      projectId,
      date,
      dayLabel: dayLabel || date,
      startTime,
      endTime,
      capacity: Number(capacity),
    });
    res.json({ success: true, data: slot });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

apiRouter.patch('/admin/slots/:id', (req, res) => {
  try {
    const updated = db.updateSlot(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// CHAT & AI INTERACTION
apiRouter.post('/chat/message', async (req, res) => {
  try {
    const {
      leadId,
      message,
      language: clientLang = 'en',
      history = [],
      currentRequirements = {},
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    // 1. Detect language
    const detectedLang = detectLanguage(message, clientLang);

    // 2. Extract structured buyer requirements
    const extractedReqs = await extractRequirementsWithAI(message, history, currentRequirements);
    extractedReqs.language = detectedLang;

    // 3. Save user message to database
    db.addMessage({
      conversationId: leadId ? `conv-${leadId}` : 'conv-temp',
      leadId,
      role: 'user',
      content: message,
      language: detectedLang,
    });

    // 4. Generate grounded fact-sheet response
    const aiResult = await generateGroundedResponse({
      userMessage: message,
      leadId,
      language: detectedLang,
      conversationHistory: history,
      extractedRequirements: extractedReqs,
    });

    // 5. Save assistant response to database
    db.addMessage({
      conversationId: leadId ? `conv-${leadId}` : 'conv-temp',
      leadId,
      role: 'assistant',
      content: aiResult.reply,
      language: aiResult.language,
    });

    // 6. Update lead record if leadId is present
    let updatedLead = null;
    if (leadId) {
      const existing = db.getLeadById(leadId);
      if (existing) {
        const updates: any = {
          requirements: { ...existing.requirements, ...extractedReqs },
        };
        if (aiResult.recommendedProjectId) {
          updates.matchedProjectId = aiResult.recommendedProjectId;
        }
        if (aiResult.isHandoffRequested) {
          updates.status = 'HANDED_OFF';
          updates.aiHandoffSummary = generateHandoffSummary(existing, extractedReqs);
          updates.handoffReason = 'Buyer requested to speak with sales executive';
        }
        updatedLead = db.updateLead(leadId, updates);
      }
    }

    res.json({
      success: true,
      data: {
        reply: aiResult.reply,
        language: aiResult.language,
        requirements: extractedReqs,
        isHandoffRequested: aiResult.isHandoffRequested,
        recommendedProjectId: aiResult.recommendedProjectId,
        matchedProjects: aiResult.matchedProjects,
        availableSlots: aiResult.availableSlots,
        lead: updatedLead,
      },
    });
  } catch (e: any) {
    console.error('Chat error:', e);
    // AI Fallback rule (Section 38)
    res.json({
      success: true,
      data: {
        reply: "I'm having trouble processing that request right now. I can connect you with a sales executive who can help immediately.",
        language: req.body.language || 'en',
        isHandoffRequested: true,
        requirements: req.body.currentRequirements || {},
      },
    });
  }
});

// HUMAN HANDOFF
apiRouter.post('/ai/handoff', (req, res) => {
  try {
    const { leadId, reason } = req.body;
    let lead = leadId ? db.getLeadById(leadId) : null;
    const users = db.getUsers();
    const assignedExec = users.find(u => u.role === 'SALES_EXECUTIVE') || users[0];

    const summary = lead
      ? generateHandoffSummary(lead, lead.requirements)
      : 'Inbound high-intent buyer enquiry for 3 BHK in Ahmedabad. Requested sales consultation.';

    if (lead) {
      lead = db.updateLead(lead.id, {
        status: 'HANDED_OFF',
        assignedExecutiveId: assignedExec.id,
        assignedExecutiveName: assignedExec.name,
        aiHandoffSummary: summary,
        handoffReason: reason || 'Direct user request',
      });

      db.getActivities(lead.id); // refreshed
    }

    res.json({
      success: true,
      data: {
        executive: assignedExec,
        summary,
        lead,
      },
    });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// SITE VISIT BOOKING (TRANSACTIONAL + CONCURRENCY PROTECTED)
apiRouter.post('/site-visits', async (req, res) => {
  try {
    const { leadId, projectId, slotId, notes, buyerName, buyerPhone, buyerEmail, source } = req.body;

    if (!projectId || !slotId) {
      return res.status(400).json({ success: false, error: 'Project and Slot are required.' });
    }

    let targetLeadId = leadId;

    // If lead doesn't exist yet, create one
    if (!targetLeadId) {
      if (!buyerName || !buyerPhone) {
        return res.status(400).json({ success: false, error: 'Buyer name and phone are required for booking.' });
      }
      const newLead = db.createLead({
        name: buyerName,
        phone: buyerPhone,
        email: buyerEmail,
        source: source || 'WEBSITE',
        requirements: { intent: 'BUY', language: 'en' },
        matchedProjectId: projectId,
        consent: {
          consentGiven: true,
          consentAt: new Date().toISOString(),
          optOut: false,
          termsVersion: 'v1.2-2026',
        },
      });
      targetLeadId = newLead.id;
    }

    // Call transactional booking engine
    const bookingResult = await db.bookSiteVisit({
      leadId: targetLeadId,
      projectId,
      slotId,
      notes,
    });

    const lead = db.getLeadById(targetLeadId);

    res.json({
      success: true,
      data: {
        siteVisit: bookingResult.siteVisit,
        reminders: bookingResult.reminders,
        lead,
      },
    });
  } catch (e: any) {
    // If slot was just taken, this returns the required message
    res.status(409).json({
      success: false,
      error: e.message || 'That slot was just booked. Here are the next available times.',
    });
  }
});

// CONCURRENCY STRESS TEST ENDPOINT
apiRouter.post('/site-visits/simulate-concurrency', async (req, res) => {
  try {
    const { slotId } = req.body;
    const targetSlotId = slotId || 'slot-sat-1130-ae'; // 1 spot remaining

    const buyers = [
      { name: 'Concurrent Buyer A (Aarav Shah)', phone: '98250 99881' },
      { name: 'Concurrent Buyer B (Kinjal Patel)', phone: '98250 99882' },
    ];

    const results = await db.simulateConcurrentBookings(targetSlotId, buyers);

    res.json({
      success: true,
      message: 'Concurrency test completed. Only one booking succeeds; the second receives immediate locked rejection.',
      results,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// SITE VISIT STATUS
apiRouter.patch('/site-visits/:id', (req, res) => {
  try {
    const { status } = req.body;
    if (!['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const updated = db.updateSiteVisitStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// LEADS
apiRouter.get('/leads', (req, res) => {
  const { source, projectId, temperature, status, executiveId, search } = req.query;
  const leads = db.getLeads({
    source: source as LeadSource,
    projectId: projectId as string,
    temperature: temperature as LeadTemperature,
    status: status as string,
    executiveId: executiveId as string,
    search: search as string,
  });
  res.json({ success: true, data: leads });
});

apiRouter.get('/leads/:id', (req, res) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }

  const messages = db.getMessages(lead.id);
  const visits = db.getSiteVisits(lead.id);
  const reminders = db.getReminders(lead.id);
  const activities = db.getActivities(lead.id);
  const duplicates = detectDuplicateLeads(
    { name: lead.name, phone: lead.phone, email: lead.email },
    db.getLeads(),
    lead.id
  );

  res.json({
    success: true,
    data: {
      lead,
      messages,
      visits,
      reminders,
      activities,
      duplicateMatches: duplicates,
    },
  });
});

apiRouter.post('/leads', (req, res) => {
  try {
    const { name, phone, email, source, requirements, consent } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Name and phone are required' });
    }

    const lead = db.createLead({
      name,
      phone,
      email,
      source: source || 'WEBSITE',
      requirements: requirements || {},
      consent: consent || {
        consentGiven: true,
        consentAt: new Date().toISOString(),
        optOut: false,
        termsVersion: 'v1.2-2026',
      },
    });

    res.json({ success: true, data: lead });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

apiRouter.post('/leads/check-duplicate', (req, res) => {
  const { name, phone, email, currentLeadId } = req.body;
  const matches = detectDuplicateLeads({ name, phone, email }, db.getLeads(), currentLeadId);
  res.json({ success: true, data: matches });
});

apiRouter.post('/leads/:id/merge', (req, res) => {
  try {
    const { secondaryLeadId } = req.body;
    if (!secondaryLeadId) {
      return res.status(400).json({ success: false, error: 'secondaryLeadId is required' });
    }
    const merged = db.mergeLeads(req.params.id, secondaryLeadId);
    res.json({ success: true, data: merged });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

apiRouter.post('/leads/:id/opt-out', (req, res) => {
  try {
    const lead = db.optOutLead(req.params.id);
    res.json({ success: true, data: lead });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// DASHBOARD & ANALYTICS
apiRouter.get('/dashboard/metrics', (req, res) => {
  const metrics = db.getDashboardMetrics();
  res.json({ success: true, data: metrics });
});

apiRouter.get('/dashboard/source-performance', (req, res) => {
  const performance = db.getSourcePerformance();
  res.json({ success: true, data: performance });
});

// RESET DEMO
apiRouter.post('/reset-demo', (req, res) => {
  db.resetDemo();
  res.json({ success: true, message: 'Database reset to initial demo seeds' });
});
