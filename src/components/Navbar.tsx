import React from 'react';
import { Building2, Users, FileText, Zap, RotateCcw } from 'lucide-react';

interface NavbarProps {
  currentView: 'buyer' | 'sales';
  onViewChange: (view: 'buyer' | 'sales') => void;
  onOpenFactSheet: () => void;
  onOpenConcurrencyTest: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenFactSheet,
  onOpenConcurrencyTest,
  onResetDemo,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center font-display font-bold text-lg tracking-wider">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-display font-semibold text-slate-900 text-base tracking-tight whitespace-nowrap">
              Company A
            </span>
            <span className="text-[11px] text-slate-500 tracking-wide font-medium">
              Ahmedabad · 420 Residences
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => onViewChange('buyer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              currentView === 'buyer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Buyer Assistant
          </button>

          <button
            onClick={() => onViewChange('sales')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              currentView === 'sales'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Sales Executive CRM
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <button
            onClick={onOpenFactSheet}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            Fact Sheet &amp; Slots
          </button>

          <button
            onClick={onOpenConcurrencyTest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors whitespace-nowrap"
            title="Demonstrate Double-Booking Prevention"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            Concurrency Demo
          </button>
        </nav>

        {/* Zone 3: Primary Action & Reset */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile view switch buttons */}
          <div className="flex md:hidden items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
            <button
              onClick={() => onViewChange('buyer')}
              className={`px-2.5 py-1 rounded ${currentView === 'buyer' ? 'bg-white font-medium text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Buyer
            </button>
            <button
              onClick={() => onViewChange('sales')}
              className={`px-2.5 py-1 rounded ${currentView === 'sales' ? 'bg-white font-medium text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Sales
            </button>
          </div>

          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap disabled:opacity-50"
            title="Reset database to initial demo state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
