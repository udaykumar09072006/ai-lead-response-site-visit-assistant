import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Calendar, Clock, AlertCircle, Shield, Check } from 'lucide-react';
import { api } from '../api.js';
import { FactSheet, VisitSlot, Project } from '../types.js';

interface FactSheetEditorModalProps {
  onClose: () => void;
}

export const FactSheetEditorModal: React.FC<FactSheetEditorModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'factsheet' | 'slots'>('factsheet');
  const [factSheet, setFactSheet] = useState<FactSheet | null>(null);
  const [slots, setSlots] = useState<VisitSlot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Slot Form State
  const [newProjectId, setNewProjectId] = useState('proj-1');
  const [newDate, setNewDate] = useState('2026-11-21');
  const [newDayLabel, setNewDayLabel] = useState('Saturday, 21 Nov');
  const [newStartTime, setNewStartTime] = useState('11:00 AM');
  const [newEndTime, setNewEndTime] = useState('12:15 PM');
  const [newCapacity, setNewCapacity] = useState(4);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sheetRes, slotsRes, projsRes] = await Promise.all([
        api.getFactSheet(),
        api.getSlots(),
        api.getProjects(),
      ]);
      setFactSheet(sheetRes);
      setSlots(slotsRes);
      setProjects(projsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveFactSheet = async () => {
    if (!factSheet) return;
    setIsSaving(true);
    try {
      const updated = await api.updateFactSheet(factSheet);
      setFactSheet(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(`Error saving fact sheet: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addSlot({
        projectId: newProjectId,
        date: newDate,
        dayLabel: newDayLabel,
        startTime: newStartTime,
        endTime: newEndTime,
        capacity: newCapacity,
      });
      const updatedSlots = await api.getSlots();
      setSlots(updatedSlots);
      alert('New slot added successfully.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleSlotStatus = async (slot: VisitSlot) => {
    const nextStatus = slot.status === 'DISABLED' ? 'AVAILABLE' : 'DISABLED';
    try {
      await api.updateSlot(slot.id, { status: nextStatus });
      const updatedSlots = await api.getSlots();
      setSlots(updatedSlots);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (isLoading || !factSheet) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center text-xs text-slate-500">
          Loading Sales Head Fact Sheet &amp; Slots...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-700" />
              <h2 className="font-display font-bold text-slate-900 text-lg">
                Fact Sheet &amp; Slot Governance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              The AI Assistant strictly answers from this database fact sheet. Changes take effect immediately.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between gap-4 text-xs font-medium">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('factsheet')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'factsheet'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sales Head Fact Sheet
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'slots'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Site Visit Slots Management ({slots.length})
            </button>
          </div>

          {activeTab === 'factsheet' && (
            <button
              onClick={handleSaveFactSheet}
              disabled={isSaving}
              className="my-1 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Saved to Database
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'factsheet' && (
            <div className="space-y-5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>AI Fact-Sheet Grounding Rule:</strong> The AI model will NEVER invent or hallucinate data outside these exact fields. If an enquirer asks for unlisted discounts or payment plans, the assistant will refuse and offer human handoff.
                </span>
              </div>

              {/* RERA Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Approved GujRERA Registration Numbers
                </label>
                <input
                  type="text"
                  value={factSheet.reraNumber}
                  onChange={e => setFactSheet({ ...factSheet, reraNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono text-slate-900"
                />
              </div>

              {/* Registered Pricing Range */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Price Range (RERA Base Rates)
                </label>
                <input
                  type="text"
                  value={factSheet.registeredPriceRange}
                  onChange={e => setFactSheet({ ...factSheet, registeredPriceRange: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono text-slate-900"
                />
              </div>

              {/* Possession Info */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Possession Information
                </label>
                <input
                  type="text"
                  value={factSheet.possessionInformation}
                  onChange={e => setFactSheet({ ...factSheet, possessionInformation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 text-slate-900"
                />
              </div>

              {/* Location & Address */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Projects Location &amp; Corridors
                  </label>
                  <input
                    type="text"
                    value={factSheet.location}
                    onChange={e => setFactSheet({ ...factSheet, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sales Experience Centre Address
                  </label>
                  <input
                    type="text"
                    value={factSheet.address}
                    onChange={e => setFactSheet({ ...factSheet, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 text-slate-900"
                  />
                </div>
              </div>

              {/* Explicit Restrictions (Section 3) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Explicit Restrictions (AI Safety Invariants)
                </label>
                <div className="space-y-1.5">
                  {factSheet.explicitRestrictions.map((restriction, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={restriction}
                        onChange={e => {
                          const updated = [...factSheet.explicitRestrictions];
                          updated[idx] = e.target.value;
                          setFactSheet({ ...factSheet, explicitRestrictions: updated });
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved FAQs */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Approved Sales FAQs
                </label>
                <div className="space-y-3">
                  {factSheet.approvedFaqs.map((faq, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={e => {
                          const updated = [...factSheet.approvedFaqs];
                          updated[idx].question = e.target.value;
                          setFactSheet({ ...factSheet, approvedFaqs: updated });
                        }}
                        className="w-full px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded text-slate-900"
                        placeholder="Question"
                      />
                      <textarea
                        value={faq.answer}
                        rows={2}
                        onChange={e => {
                          const updated = [...factSheet.approvedFaqs];
                          updated[idx].answer = e.target.value;
                          setFactSheet({ ...factSheet, approvedFaqs: updated });
                        }}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded text-slate-700"
                        placeholder="Approved Answer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'slots' && (
            <div className="space-y-6 text-xs">
              {/* Add New Slot Form */}
              <form onSubmit={handleAddSlot} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-slate-600" />
                  Add New Site-Visit Slot
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Project</label>
                    <select
                      value={newProjectId}
                      onChange={e => setNewProjectId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={e => {
                        setNewDate(e.target.value);
                        setNewDayLabel(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Start Time</label>
                    <input
                      type="text"
                      value={newStartTime}
                      onChange={e => setNewStartTime(e.target.value)}
                      placeholder="e.g. 11:30 AM"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Capacity</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newCapacity}
                      onChange={e => setNewCapacity(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium transition-colors"
                >
                  Create Slot
                </button>
              </form>

              {/* Slot Table (Section 30) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="py-2.5 px-4">Date &amp; Day</th>
                      <th className="py-2.5 px-4">Time Window</th>
                      <th className="py-2.5 px-4">Project</th>
                      <th className="py-2.5 px-4">Capacity / Booked</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {slots.map(slot => {
                      const isFull = slot.bookedCount >= slot.capacity;
                      return (
                        <tr key={slot.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-sans text-slate-800">{slot.dayLabel}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{slot.startTime}</td>
                          <td className="py-2.5 px-4 font-sans text-slate-600">
                            {slot.projectId === 'proj-1' ? 'Aura Elysium' : 'The Serene Botanica'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={isFull ? 'text-red-700 font-bold' : 'text-slate-800'}>
                              {slot.bookedCount} / {slot.capacity}
                            </span>
                            {isFull && <span className="ml-1.5 text-[10px] text-red-600 font-sans font-medium">(FULL)</span>}
                          </td>
                          <td className="py-2.5 px-4 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                slot.status === 'AVAILABLE'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : slot.status === 'FULL'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {slot.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-sans">
                            <button
                              onClick={() => handleToggleSlotStatus(slot)}
                              className="text-xs text-slate-600 hover:text-slate-900 underline"
                            >
                              {slot.status === 'DISABLED' ? 'Enable' : 'Disable'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">
            Last Updated: {new Date(factSheet.updatedAt).toLocaleString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
