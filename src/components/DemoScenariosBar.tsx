import React from 'react';
import { Sparkles, ShieldAlert, Languages, UserCheck, Flame } from 'lucide-react';

interface DemoScenariosBarProps {
  onRunScenario: (text: string, title: string) => void;
  onOpenConcurrencyTest: () => void;
}

export const DemoScenariosBar: React.FC<DemoScenariosBarProps> = ({
  onRunScenario,
  onOpenConcurrencyTest,
}) => {
  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium text-white">Client Evaluation Scenarios:</span>
          <span className="text-slate-400 hidden lg:inline">
            1-click test of end-to-end real estate qualification &amp; safety rules
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scenario 1: Primary Demo */}
          <button
            onClick={() =>
              onRunScenario(
                'Mujhe Ahmedabad mein 3 BHK chahiye. Budget 1 crore ke aas paas hai. Main is weekend site visit kar sakta hoon.',
                'Scenario 1: Primary Hindi Weekend 3 BHK Enquiry'
              )
            }
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-md transition-colors whitespace-nowrap"
            title="Primary brief scenario: Hindi extraction, ₹1 Cr 3 BHK, weekend slot booking"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="font-medium">1. Primary Demo (Hindi 3 BHK)</span>
          </button>

          {/* Scenario 2: Safety Refusal */}
          <button
            onClick={() =>
              onRunScenario(
                'I want the cheapest 2BHK. What is the final price including everything?',
                'Scenario 2: AI Safety Test (Refuses to invent final price/discount)'
              )
            }
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
            title="Tests fact-sheet safety rule: refuses unverified discounts/all-inclusive price"
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>2. Safety Price Refusal</span>
          </button>

          {/* Scenario 3: Gujarati Switch */}
          <button
            onClick={() =>
              onRunScenario('Gujarati ma vaat karo.', 'Scenario 3: Multilingual Context Switch')
            }
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
            title="Tests seamless language transition while preserving structured context"
          >
            <Languages className="w-3 h-3 text-emerald-400" />
            <span>3. ગુજરાતી Switch</span>
          </button>

          {/* Scenario 4: Human Handoff */}
          <button
            onClick={() =>
              onRunScenario('Can I speak to someone?', 'Scenario 4: Instant Sales Handoff')
            }
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
            title="Assigns Priya Shah with structured AI summary"
          >
            <UserCheck className="w-3 h-3 text-sky-400" />
            <span>4. Talk to Person</span>
          </button>

          {/* Concurrency Test */}
          <button
            onClick={onOpenConcurrencyTest}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/40 text-purple-200 hover:bg-purple-900/60 border border-purple-700/50 rounded-md transition-colors whitespace-nowrap"
            title="Simulate simultaneous bookings on 1 available slot"
          >
            <span>Race Condition Test</span>
          </button>
        </div>
      </div>
    </div>
  );
};
