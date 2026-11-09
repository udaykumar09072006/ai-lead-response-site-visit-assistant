import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Send,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  Phone,
  User,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Bell,
  ArrowRight
} from 'lucide-react';
import { api } from '../api.js';
import {
  Language,
  Project,
  VisitSlot,
  Lead,
  SiteVisit,
  Reminder,
  BuyerRequirements,
} from '../types.js';

interface BuyerViewProps {
  initialPrompt?: string;
  onLeadUpdated?: (lead: Lead) => void;
  onViewSalesDashboard?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: Language;
  timestamp: string;
  recommendedProject?: Project;
  availableSlots?: VisitSlot[];
  isHandoff?: boolean;
  handoffExec?: { name: string; title: string };
}

export const BuyerView: React.FC<BuyerViewProps> = ({
  initialPrompt,
  onLeadUpdated,
  onViewSalesDashboard,
}) => {
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [currentRequirements, setCurrentRequirements] = useState<BuyerRequirements>({
    language: 'en',
    intent: 'BUY',
    locationPreference: 'Ahmedabad',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [confirmedVisit, setConfirmedVisit] = useState<{
    visit: SiteVisit;
    reminders: Reminder[];
  } | null>(null);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-14');
  const [availableSlots, setAvailableSlots] = useState<VisitSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [buyerName, setBuyerName] = useState('Hardik Patel');
  const [buyerPhone, setBuyerPhone] = useState('+91 98980 44210');
  const [buyerEmail, setBuyerEmail] = useState('hardik.patel@gujarattech.in');
  const [consentGiven, setConsentGiven] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, confirmedVisit]);

  // Load initial projects & greeting
  useEffect(() => {
    api.getProjects().then(projs => {
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      }
    });

    // Initial Welcome Message
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content:
          "Welcome to Company A. I am your verified property assistant for our Ahmedabad residential developments: **Aura Elysium** (Ambli-Bopal Road) and **The Serene Botanica** (Shela), starting at ₹65 Lakh.\n\nAll details are strictly verified against our approved RERA sales fact sheet. How can I assist you with your home search or site visit today?",
        language: 'en',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // Handle external prompt injection from Demo Scenario Bar
  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Fetch available slots when project or date changes in booking
  useEffect(() => {
    if (selectedProjectId && selectedDate) {
      api.getAvailableSlots(selectedProjectId, selectedDate).then(slots => {
        setAvailableSlots(slots);
        if (slots.length > 0) {
          // Select first available slot that is not full
          setSelectedSlotId(slots[0].id);
        } else {
          setSelectedSlotId('');
        }
      });
    }
  }, [selectedProjectId, selectedDate]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendMessage({
        leadId: currentLead?.id,
        message: text,
        language,
        history,
        currentRequirements,
      });

      if (res.language && res.language !== language) {
        setLanguage(res.language);
      }

      if (res.requirements) {
        setCurrentRequirements(res.requirements);
      }

      if (res.lead) {
        setCurrentLead(res.lead);
        onLeadUpdated?.(res.lead);
      }

      const matchedProj = projects.find(p => p.id === res.recommendedProjectId) || projects[0];

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        language: res.language || language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProject: matchedProj,
        availableSlots: res.availableSlots,
        isHandoff: res.isHandoffRequested,
        handoffExec: res.isHandoffRequested
          ? { name: 'Priya Shah', title: 'Senior Property Consultant' }
          : undefined,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: 'assistant',
          content:
            "I'm having trouble processing that request right now. I can connect you with a sales executive who can help immediately.",
          language,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isHandoff: true,
          handoffExec: { name: 'Priya Shah', title: 'Senior Property Consultant' },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionText: string) => {
    handleSendMessage(actionText);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    let switchNote = '';
    if (newLang === 'hi') {
      switchNote = 'नमस्ते! अब हम हिंदी में बात करेंगे। आप 2 BHK या 3 BHK में क्या देखना चाहते हैं?';
    } else if (newLang === 'gu') {
      switchNote = 'નમસ્તે! હવે આપણે ગુજરાતીમાં વાત કરીશું. તમે 2 BHK કે 3 BHK માં રસ ધરાવો છો?';
    } else {
      switchNote = 'Switched to English. How can I help you find your dream residence in Ahmedabad?';
    }

    setMessages(prev => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        role: 'assistant',
        content: switchNote,
        language: newLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleOpenBooking = (projId?: string) => {
    if (projId) setSelectedProjectId(projId);
    setBookingError(null);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlotId) {
      setBookingError('Please choose an available site visit time slot.');
      return;
    }
    if (!buyerName.trim() || !buyerPhone.trim()) {
      setBookingError('Name and valid phone number are required.');
      return;
    }
    if (!consentGiven) {
      setBookingError('Please provide consent to confirm your site visit appointment.');
      return;
    }

    setIsBookingSubmitting(true);
    setBookingError(null);

    try {
      const res = await api.bookSiteVisit({
        leadId: currentLead?.id,
        projectId: selectedProjectId,
        slotId: selectedSlotId,
        buyerName,
        buyerPhone,
        buyerEmail,
        source: currentLead?.source || 'WEBSITE',
        notes: `Preferred ${currentRequirements.bedrooms || 3} BHK walkthrough requested via AI Assistant`,
      });

      setConfirmedVisit({
        visit: res.siteVisit,
        reminders: res.reminders,
      });

      if (res.lead) {
        setCurrentLead(res.lead);
        onLeadUpdated?.(res.lead);
      }

      setIsBookingOpen(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}

      // Add confirmed message to chat
      setMessages(prev => [
        ...prev,
        {
          id: `book-conf-${Date.now()}`,
          role: 'assistant',
          content: `🎉 **Site Visit Confirmed!**\n\nYour visit to **${res.siteVisit.projectName}** is locked for **${res.siteVisit.dayLabel} at ${res.siteVisit.time}**.\n\nAutomated WhatsApp & SMS reminders have been scheduled (1 day prior and 2 hours prior). Senior Consultant **Priya Shah** will receive you at the Experience Centre.`,
          language,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      // Handles Section 15 Double-Booking Protection message:
      // "That slot was just booked. Here are the next available times."
      setBookingError(e.message || 'That slot was just booked. Here are the next available times.');
      // Refresh available slots
      api.getAvailableSlots(selectedProjectId, selectedDate).then(slots => {
        setAvailableSlots(slots);
        if (slots.length > 0) setSelectedSlotId(slots[0].id);
      });
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleOptOut = async () => {
    if (!currentLead) return;
    try {
      const updated = await api.optOutLead(currentLead.id);
      setCurrentLead(updated);
      onLeadUpdated?.(updated);
      alert('You have been opted out from promotional notifications. Your preference has been saved.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      {/* Mobile-First Chat Shell */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[calc(100vh-10rem)] min-h-[600px]">
        {/* Header (Section 6) */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-slate-900 text-lg tracking-tight">
                Company A
              </h1>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                · Verified Sales Fact Sheet Grounded
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Find the right home and schedule a visit.
            </p>
          </div>

          {/* Language Selector (Section 6 & 7) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                language === 'hi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => handleLanguageChange('gu')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                language === 'gu'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ગુજરાતી
            </button>
          </div>
        </div>

        {/* Live Criteria Kicker Strip (Clean unboxed metadata) */}
        {(currentRequirements.bedrooms || currentRequirements.budgetDisplay || currentLead) && (
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-2 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400 font-sans">Active Criteria:</span>
              {currentRequirements.bedrooms && (
                <span>{currentRequirements.bedrooms} BHK</span>
              )}
              {currentRequirements.budgetDisplay && (
                <>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>{currentRequirements.budgetDisplay}</span>
                </>
              )}
              {currentRequirements.locationPreference && (
                <>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>{currentRequirements.locationPreference}</span>
                </>
              )}
            </div>

            {currentLead && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-sans">Lead:</span>
                <span className="font-mono text-slate-700">{currentLead.id}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="font-medium text-slate-900">
                  {currentLead.score}/100 ({currentLead.temperature})
                </span>
                <button
                  onClick={onViewSalesDashboard}
                  className="text-amber-800 hover:underline font-medium text-[11px] ml-1"
                >
                  View in CRM →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                }`}
              >
                {/* RERA Verified Header on Assistant Message */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-2 pb-1.5 border-b border-slate-100">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fact Sheet Grounded · GujRERA Registered</span>
                  </div>
                )}

                <div className="whitespace-pre-line prose prose-sm max-w-none prose-p:my-1 prose-strong:text-slate-900 dark:prose-strong:text-white">
                  {msg.content}
                </div>

                {/* Inline Recommended Project Card (Section 12) */}
                {msg.recommendedProject && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-900">
                            {msg.recommendedProject.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {msg.recommendedProject.subLocation}, Ahmedabad
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 font-mono">
                            92% Match
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 mt-2 font-mono">
                        {msg.recommendedProject.priceRangeDisplay}
                        <span className="text-slate-400 font-sans mx-1">·</span>
                        {msg.recommendedProject.bhkTypes.join(', ')}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        RERA: {msg.recommendedProject.reraNumber}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => handleOpenBooking(msg.recommendedProject?.id)}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors text-center"
                        >
                          Book Site Visit
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Handoff Box (Section 18) */}
                {msg.isHandoff && msg.handoffExec && (
                  <div className="mt-3 bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                      <User className="w-3.5 h-3.5 text-amber-700" />
                      Assigned Executive: {msg.handoffExec.name}
                    </div>
                    <p className="mt-1 text-amber-800 text-[11px]">
                      {msg.handoffExec.name} has received your enquiry, budget preference, and full conversation briefing.
                    </p>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-slate-500">Checking verified fact sheet...</span>
            </div>
          )}

          {/* Site Visit Confirmed Card (Section 16 & 17) */}
          {confirmedVisit && (
            <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-base">
                      Site Visit Confirmed
                    </h3>
                    <div className="text-xs text-slate-500 font-mono">
                      Booking Ref: {confirmedVisit.visit.id}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                  Slot Locked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Project</span>
                  <span className="font-medium text-slate-900 text-sm">
                    {confirmedVisit.visit.projectName}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Ambli-Bopal Road, Ahmedabad
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Schedule</span>
                  <span className="font-medium text-slate-900 text-sm">
                    {confirmedVisit.visit.dayLabel}
                  </span>
                  <span className="text-[11px] font-mono text-slate-700 block mt-0.5">
                    {confirmedVisit.visit.time}
                  </span>
                </div>
              </div>

              {/* Reminders list (Section 17) */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                  Automated Reminders Scheduled
                </div>
                <div className="space-y-1.5 text-xs">
                  {confirmedVisit.reminders.map(rem => (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between text-slate-600 bg-slate-50 px-3 py-1.5 rounded border border-slate-100"
                    >
                      <span>✓ {rem.label}</span>
                      <span className="text-[11px] text-emerald-700 font-medium font-mono">
                        Scheduled
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions & WhatsApp disclaimer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <a
                  href="https://maps.google.com/?q=Ambli-Bopal+Road+Ahmedabad"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Open Location Pin
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOptOut}
                    className="text-[11px] text-slate-500 hover:text-slate-700 underline"
                  >
                    Opt-out from alerts (DPDP)
                  </button>

                  <button
                    onClick={onViewSalesDashboard}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    View in Sales CRM →
                  </button>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 bg-slate-50 p-2 rounded">
                <strong>WhatsApp Messaging:</strong> Future integration · Opt-in HSM reminder template preview: &ldquo;Namaste Hardik-ji, your Aura Elysium sample flat tour is scheduled for Saturday at 11:30 AM.&rdquo;
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips (Section 6) */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => handleQuickAction('Explore 2 BHK residences and pricing')}
            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            Explore 2 BHK
          </button>
          <button
            onClick={() => handleQuickAction('Explore 3 BHK residences and pricing')}
            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            Explore 3 BHK
          </button>
          <button
            onClick={() => handleQuickAction('Check my budget fit')}
            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            Check my budget
          </button>
          <button
            onClick={() => handleOpenBooking()}
            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap font-medium"
          >
            Book a site visit
          </button>
          <button
            onClick={() => handleQuickAction('I want to talk to a salesperson')}
            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            Talk to a person
          </button>
        </div>

        {/* Message Input Box */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'Apna prashna yahan likhein (jaise 3 BHK, budget, site visit)...'
                  : language === 'gu'
                  ? 'તમારો પ્રશ્ન અહીં લખો (જેમ કે 3 BHK, બજેટ, સાઇટ વિઝિટ)...'
                  : 'Type your enquiry (e.g. 3 BHK in Ahmedabad around ₹1 crore)...'
              }
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 transition-colors text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Booking Modal (Section 13, 14, 15, 16) */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-lg">
                  Schedule an Executive Site Visit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select project, verified available slot, and confirm appointment.
                </p>
              </div>
              <button
                onClick={() => setIsBookingOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Booking Notice</div>
                  <div>{bookingError}</div>
                </div>
              </div>
            )}

            <div className="space-y-4 mt-4">
              {/* 1. Project Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  1. Select Project
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {projects.map(proj => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`p-3 text-left border rounded-lg transition-colors text-xs ${
                        selectedProjectId === proj.id
                          ? 'border-slate-900 bg-slate-50 font-medium text-slate-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{proj.name}</div>
                      <div className="text-[11px] text-slate-500">{proj.subLocation}</div>
                      <div className="font-mono text-[11px] text-slate-600 mt-1">
                        {proj.priceRangeDisplay}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Date Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  2. Select Date
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate('2026-11-14')}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border text-center transition-colors ${
                      selectedDate === '2026-11-14'
                        ? 'border-slate-900 bg-slate-900 text-white font-medium'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Saturday, 14 Nov
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate('2026-11-15')}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border text-center transition-colors ${
                      selectedDate === '2026-11-15'
                        ? 'border-slate-900 bg-slate-900 text-white font-medium'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Sunday, 15 Nov
                  </button>
                </div>
              </div>

              {/* 3. Slot Availability (Section 14 & 15) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    3. Genuinely Available Slots
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Capacity Checked Real-Time
                  </span>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg text-center border border-slate-200">
                    No open slots remaining for this date. Please select another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.map(slot => {
                      const spotsLeft = slot.capacity - slot.bookedCount;
                      const isFull = spotsLeft <= 0;
                      const isSelected = selectedSlotId === slot.id;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isFull}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-2.5 text-center rounded-lg border text-xs transition-colors ${
                            isFull
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : isSelected
                              ? 'border-slate-900 bg-slate-900 text-white font-medium'
                              : 'border-slate-200 text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-mono font-medium">{slot.startTime}</div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              isSelected
                                ? 'text-slate-200'
                                : spotsLeft === 1
                                ? 'text-amber-600 font-medium'
                                : 'text-slate-500'
                            }`}
                          >
                            {isFull ? 'FULL' : `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Buyer Contact Details */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="e.g. Hardik Patel"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={e => setBuyerPhone(e.target.value)}
                      placeholder="+91 98980 44210"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={e => setBuyerEmail(e.target.value)}
                      placeholder="hardik@example.com"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* DPDP Consent Checkbox (Section 4 & 41) */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={e => setConsentGiven(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-0"
                    />
                    <span>
                      <strong>Consent:</strong> I agree to be contacted regarding my enquiry and site visit for Company A projects in compliance with DPDP &amp; RERA guidelines.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBookingSubmitting || !selectedSlotId || !consentGiven}
                onClick={handleConfirmBooking}
                className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isBookingSubmitting ? (
                  <>Locking Slot...</>
                ) : (
                  <>Confirm Site Visit</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
