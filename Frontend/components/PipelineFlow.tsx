import React from 'react';
import { MessageSquare, Sparkles, Database, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { StepState } from '../types/index.js';

interface PipelineFlowProps {
  currentStep: StepState;
  hasUnpricedItems?: boolean;
}

export const PipelineFlow: React.FC<PipelineFlowProps> = ({ currentStep, hasUnpricedItems = false }) => {
  const steps = [
    { id: 'input', label: '1. Customer Message', icon: MessageSquare },
    { id: 'extraction', label: '2. AI Extraction', icon: Sparkles },
    {
      id: 'builder',
      label: hasUnpricedItems ? '3. Price Resolution ⚠' : '3. Price Resolution',
      icon: Database,
    },
    { id: 'review', label: '4. Human Review', icon: FileSpreadsheet },
    { id: 'approved', label: '5. Approved Invoice', icon: CheckCircle2 },
  ];

  const stepOrder: StepState[] = ['input', 'extraction', 'builder', 'review', 'approved'];
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div id="pipeline-flow" className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 mb-6 shadow-xs no-print transition-colors">
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = step.id === currentStep;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900/60'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="whitespace-nowrap">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-4 sm:w-8 h-0.5 rounded-full ${
                    index < currentIndex ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
