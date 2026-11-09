import React, { useState } from 'react';
import { Navbar } from './components/Navbar.js';
import { DemoScenariosBar } from './components/DemoScenariosBar.js';
import { BuyerView } from './components/BuyerView.js';
import { SalesDashboard } from './components/SalesDashboard.js';
import { LeadDetailModal } from './components/LeadDetailModal.js';
import { FactSheetEditorModal } from './components/FactSheetEditorModal.js';
import { ConcurrencyTestModal } from './components/ConcurrencyTestModal.js';
import { Lead } from './types.js';
import { api } from './api.js';

export function App() {
  const [currentView, setCurrentView] = useState<'buyer' | 'sales'>('buyer');
  const [activePrompt, setActivePrompt] = useState<string | undefined>(undefined);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isFactSheetOpen, setIsFactSheetOpen] = useState(false);
  const [isConcurrencyTestOpen, setIsConcurrencyTestOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRunScenario = (text: string, title: string) => {
    setCurrentView('buyer');
    setActivePrompt(text);
    showToast(`Triggered: ${title}`);
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset entire prototype database back to initial seed state?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemo();
      showToast('Database reset to fresh demo state.');
      window.location.reload();
    } catch (e: any) {
      alert(`Error resetting: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Demo Scenarios Runner Bar */}
      <DemoScenariosBar
        onRunScenario={handleRunScenario}
        onOpenConcurrencyTest={() => setIsConcurrencyTestOpen(true)}
      />

      {/* 2. Top Bar (Top Bar Contract) */}
      <Navbar
        currentView={currentView}
        onViewChange={view => {
          setCurrentView(view);
          setActivePrompt(undefined);
        }}
        onOpenFactSheet={() => setIsFactSheetOpen(true)}
        onOpenConcurrencyTest={() => setIsConcurrencyTestOpen(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* 3. Main Body */}
      <main className="flex-1 pb-12">
        {currentView === 'buyer' ? (
          <BuyerView
            initialPrompt={activePrompt}
            onViewSalesDashboard={() => setCurrentView('sales')}
            onLeadUpdated={lead => {
              // optional live notification
            }}
          />
        ) : (
          <SalesDashboard
            onSelectLead={lead => setSelectedLeadId(lead.id)}
            onOpenFactSheet={() => setIsFactSheetOpen(true)}
            onOpenConcurrencyTest={() => setIsConcurrencyTestOpen(true)}
          />
        )}
      </main>

      {/* 4. Modals */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={() => {
            // refresh data
          }}
        />
      )}

      {isFactSheetOpen && (
        <FactSheetEditorModal
          onClose={() => setIsFactSheetOpen(false)}
        />
      )}

      {isConcurrencyTestOpen && (
        <ConcurrencyTestModal
          onClose={() => setIsConcurrencyTestOpen(false)}
          onRefresh={() => {
            // Refresh slot state if needed
          }}
        />
      )}
    </div>
  );
}

export default App;
