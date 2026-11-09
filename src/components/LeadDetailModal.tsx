import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Building,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  UserCheck,
  GitMerge,
  MessageSquare,
  AlertTriangle,
  Send,
  User,
  History,
  Tag
} from 'lucide-react';
import { api } from '../api.js';
import {
  Lead,
  SiteVisit,
  Reminder,
  DuplicateMatch,
} from '../types.js';

interface LeadDetailModalProps {
  leadId: string;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  onClose,
  onLeadUpdated,
}) => {
  const [data, setData] = useState<{
    lead: Lead;
    messages: any[];
    visits: SiteVisit[];
    reminders: Reminder[];
    activities: any[];
    duplicateMatches: DuplicateMatch[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversation' | 'activity'>('overview');
  const [isMerging, setIsMerging] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadDetail = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLeadDetail(leadId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [leadId]);

  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-sm text-slate-500">Loading lead dossier...</div>
        </div>
      </div>
    );
  }

  const { lead, messages, visits, reminders, activities, duplicateMatches } = data;
  const activeVisit = visits.find(v => v.status === 'SCHEDULED') || visits[0];

  const handleMerge = async (secondaryId: string) => {
    if (!confirm(`Confirm merge of duplicate lead ${secondaryId} into canonical lead ${lead.id}? Chat and visit history will be unified.`)) {
      return;
    }
    setIsMerging(true);
    try {
      await api.mergeLeads(lead.id, secondaryId);
      await loadDetail();
      onLeadUpdated();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsMerging(false);
    }
  };

  const handleUpdateVisitStatus = async (visitId: string, status: 'COMPLETED' | 'NO_SHOW') => {
    setStatusUpdating(true);
    try {
      await api.updateSiteVisitStatus(visitId, status);
      await loadDetail();
      onLeadUpdated();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleOptOut = async () => {
    if (!confirm('Opt-out this buyer from future automated marketing communications? (DPDP Compliance)')) {
      return;
    }
    try {
      await api.optOutLead(lead.id);
      await loadDetail();
      onLeadUpdated();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-display font-bold text-base">
              {lead.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-slate-900 text-lg">
                  {lead.name}
                </h2>
                <span className="font-mono text-xs text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                  {lead.id}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {lead.source.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-mono">{lead.phone}</span>
                {lead.email && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{lead.email}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>Assigned: {lead.assignedExecutiveName || 'Priya Shah'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Call Buyer</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Duplicate Warning Banner (Section 21) */}
        {duplicateMatches.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Possible duplicate lead detected:</strong> Matches{' '}
                <span className="font-mono font-bold">{duplicateMatches[0].existingLead.id}</span> (
                {duplicateMatches[0].existingLead.name} · {duplicateMatches[0].existingLead.source}) with{' '}
                <strong>{duplicateMatches[0].matchScore}% match</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={isMerging}
                onClick={() => handleMerge(duplicateMatches[0].existingLead.id)}
                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium transition-colors flex items-center gap-1"
              >
                <GitMerge className="w-3 h-3" />
                Merge Leads
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview &amp; AI Briefing
          </button>
          <button
            onClick={() => setActiveTab('conversation')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'conversation'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Complete Conversation ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Timeline ({activities.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: AI Qualification & Requirements */}
              <div className="md:col-span-2 space-y-6">
                {/* AI Handoff Summary (Section 19) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Structured AI Sales Briefing
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Auto-Generated from Fact-Sheet Engine
                    </span>
                  </div>

                  <div className="mt-3 text-xs space-y-2 text-slate-800 font-sans">
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 font-mono">
                      <div>
                        <span className="text-slate-500 font-sans block text-[11px]">Configuration</span>
                        <span className="font-semibold text-slate-900">
                          {lead.requirements.bedrooms ? `${lead.requirements.bedrooms} BHK` : '2 or 3 BHK'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans block text-[11px]">Budget Target</span>
                        <span className="font-semibold text-slate-900">
                          {lead.requirements.budgetDisplay || '₹65L–₹1.2Cr'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans block text-[11px]">Timeline</span>
                        <span className="font-semibold text-slate-900">
                          {lead.requirements.purchaseTimeline || '0–6 months'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans block text-[11px]">Recommended Project</span>
                        <span className="font-semibold text-slate-900">
                          {lead.matchedProjectId === 'proj-2' ? 'The Serene Botanica' : 'Aura Elysium'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-slate-700 leading-relaxed">
                      <strong>Executive Context:</strong>{' '}
                      {lead.requirements.specificNotes ||
                        'Buyer expressed keen interest in weekend site visit with focus on prime Ambli-Bopal road connectivity and 3 BHK sample flat walkthrough.'}
                    </div>
                  </div>
                </div>

                {/* Deterministic Qualification Breakdown (Section 9) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-semibold text-slate-900 text-sm">
                        Deterministic Lead Qualification Score
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mathematical business scoring engine (0–100)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-2xl text-slate-900 font-mono">
                        {lead.score}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          lead.temperature === 'HOT'
                            ? 'bg-amber-100 text-amber-800'
                            : lead.temperature === 'WARM'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {lead.temperature}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Score Justification:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {lead.scoreReasons?.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Consent & DPDP Record (Section 4 & 41) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      DPDP Contact Consent
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono">
                      Granted on {new Date(lead.consent.consentAt).toLocaleString()} · Status:{' '}
                      {lead.consent.optOut ? (
                        <span className="text-red-600 font-semibold">OPTED OUT</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">ACTIVE</span>
                      )}
                    </div>
                  </div>

                  {!lead.consent.optOut && (
                    <button
                      onClick={handleOptOut}
                      className="px-2.5 py-1 text-slate-600 hover:text-red-700 border border-slate-200 rounded hover:bg-white transition-colors"
                    >
                      Opt-out Buyer
                    </button>
                  )}
                </div>
              </div>

              {/* Right Col: Site Visit & Reminders (Section 27) */}
              <div className="space-y-6">
                {/* Site Visit Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Site Visit Booking
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        activeVisit?.status === 'SCHEDULED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : activeVisit?.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-800'
                          : activeVisit?.status === 'NO_SHOW'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {activeVisit?.status || 'No Visit Booked'}
                    </span>
                  </div>

                  {activeVisit ? (
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">
                          {activeVisit.projectName}
                        </div>
                        <div className="text-slate-500 mt-0.5 font-mono">
                          {activeVisit.dayLabel} at {activeVisit.time}
                        </div>
                      </div>

                      {/* Action buttons (Section 27) */}
                      {activeVisit.status === 'SCHEDULED' && (
                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            disabled={statusUpdating}
                            onClick={() => handleUpdateVisitStatus(activeVisit.id, 'COMPLETED')}
                            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors text-center"
                          >
                            Mark Visited (Showed Up)
                          </button>
                          <button
                            disabled={statusUpdating}
                            onClick={() => handleUpdateVisitStatus(activeVisit.id, 'NO_SHOW')}
                            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-center"
                          >
                            Mark No-Show
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">
                      No active site visit appointment booked yet.
                    </div>
                  )}
                </div>

                {/* Automated Reminder Status (Section 17 & 42) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Automated Reminders
                  </div>

                  {reminders.length === 0 ? (
                    <div className="text-xs text-slate-400">No scheduled reminders.</div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {reminders.map(r => (
                        <div
                          key={r.id}
                          className="bg-white p-2.5 rounded border border-slate-200 text-slate-700"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-900">
                            <span>{r.type === '24_HOURS_BEFORE' ? '24h Prior' : '2h Prior'}</span>
                            <span className="text-emerald-700 font-mono">
                              {r.status === 'SCHEDULED' ? '✓ Scheduled' : 'Delivered'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">{r.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversation' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 pb-2 border-b border-slate-100">
                Full authenticated interaction history between buyer and AI agent.
              </div>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No conversation logs recorded for this lead.
                  </div>
                ) : (
                  messages.map(m => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl text-xs max-w-xl ${
                        m.role === 'user'
                          ? 'bg-slate-900 text-white ml-auto'
                          : 'bg-slate-100 border border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-70 mb-1 font-mono">
                        <span>{m.role === 'user' ? 'Buyer' : 'AI Assistant'}</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed">{m.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 pb-2 border-b border-slate-100">
                Immutable audit trail of lead ingestion, AI qualification, and executive actions.
              </div>
              <div className="space-y-2">
                {activities.map(act => (
                  <div
                    key={act.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{act.title}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{act.description}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Actor: {act.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Company A CRM · Confidential RERA &amp; DPDP Compliant Data
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
