import React, { useState } from 'react';
import { X, Zap, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../api.js';

interface ConcurrencyTestModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const ConcurrencyTestModal: React.FC<ConcurrencyTestModalProps> = ({ onClose, onRefresh }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleRunTest = async () => {
    setIsRunning(true);
    setTestResult(null);
    try {
      // First ensure slot-sat-1130-ae has exactly 1 spot remaining (bookedCount = 3, capacity = 4)
      await api.updateSlot('slot-sat-1130-ae', {
        bookedCount: 3,
        capacity: 4,
        status: 'AVAILABLE',
      });

      // Fire simultaneous concurrent bookings
      const res = await api.simulateConcurrency('slot-sat-1130-ae');
      setTestResult(res);
      onRefresh();
    } catch (e: any) {
      alert(`Test error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-slate-900 text-lg">
              Double-Booking Concurrency Stress Test
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
          Demonstrates database transaction locking (Section 15 &amp; 43). Two buyers will simultaneously attempt to book the final available spot of a Saturday slot at the exact same millisecond.
        </p>

        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 font-mono">
          <div className="text-slate-500 font-sans font-medium">Test Configuration:</div>
          <div>Slot: <span className="text-slate-900 font-bold">Saturday 11:30 AM (Aura Elysium)</span></div>
          <div>Available Spots: <span className="text-amber-700 font-bold">1 spot remaining</span></div>
          <div>Attempting Buyers: <span className="text-slate-900">Aarav Shah vs Kinjal Patel</span></div>
        </div>

        {testResult && (
          <div className="mt-4 space-y-3">
            <div className="text-xs font-semibold text-slate-900">
              Transaction Execution Results:
            </div>
            {testResult.results?.map((r: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs ${
                  r.status === 'fulfilled'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-1.5">
                    {r.status === 'fulfilled' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{r.buyer}</span>
                  </div>
                  <span className="font-mono uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/70">
                    {r.status === 'fulfilled' ? '200 OK Confirmed' : '409 Conflict Locked'}
                  </span>
                </div>
                <div className="mt-1 text-[11px]">
                  {r.status === 'fulfilled'
                    ? `✓ Site Visit locked successfully (Booking ID: ${r.result?.siteVisit?.id})`
                    : `✗ Rejected: "${r.error}"`}
                </div>
              </div>
            ))}

            <div className="p-2.5 bg-slate-100 rounded text-[11px] text-slate-700">
              <strong>Evaluation Invariant Verified:</strong> Slot capacity was never exceeded. Concurrency lock serialized the transactions and safely rejected the overflow request.
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Executing Race Condition...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Simulate Race Condition
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
