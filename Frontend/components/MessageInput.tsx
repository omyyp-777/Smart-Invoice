import React, { useState } from 'react';
import { Sparkles, Shield, ArrowRight, Lightbulb, AlertTriangle, CheckCircle, Clock, Check } from 'lucide-react';

interface MessageInputProps {
  onAnalyze: (message: string) => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onAnalyze, isLoading }) => {
  const [message, setMessage] = useState<string>(
    "Hi, I'm Rahul Sharma. I need two logo designs and one promotional video. My email is rahul@gmail.com and this is an urgent delivery."
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  React.useEffect(() => {
    if (!isLoading) {
      setActiveStepIndex(0);
      return;
    }
    setActiveStepIndex(0);
    const t1 = setTimeout(() => setActiveStepIndex(1), 200);
    const t2 = setTimeout(() => setActiveStepIndex(2), 450);
    const t3 = setTimeout(() => setActiveStepIndex(3), 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isLoading]);

  const presets = [
    {
      title: 'Demo 1: Standard Agency Order',
      tag: 'Full Catalog Match',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: "Hi, I'm Rahul Sharma. I need two logo designs and one promotional video. My email is rahul@gmail.com and this is an urgent delivery for Apex Media.",
    },
    {
      title: 'Demo 2: Price Protection Demo',
      tag: 'Triggers Missing Catalog Alert ⚠',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
      text: "Hey, I'm Ananya Sen from Creatix. Please invoice us for two logo designs and one 3D animation sequence. Email is ananya@creatix.io.",
    },
    {
      title: 'Demo 3: Missing Email / Rush',
      tag: 'Human Review Test',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      text: "Need 4 poster designs and 1 brochure design right away for our college festival launch. Needs to be delivered by tomorrow afternoon.",
    },
    {
      title: 'Demo 4: Digital Agency Bundle',
      tag: 'Multi-Item Order',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      text: "Hello! I am Vikram from TechNova (vikram@technova.com). We'd like to book 1 website development, 2 landing pages, and 1 social media management for Q4.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    onAnalyze(message);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Deterministic Invoice Automation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create New Invoice
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Turn messy natural language customer requests into structured, verified, catalog-backed invoices ready for human sign-off.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="customer-message" className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>Describe what your customer needs...</span>
            </label>
            <span className="text-xs text-slate-400 dark:text-slate-500">Natural language text, WhatsApp, or email snippet</span>
          </div>

          <div className="relative">
            <textarea
              id="customer-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='e.g., "Hi, I&apos;m Rahul Sharma. I need two logo designs and one promotional video. Email is rahul@gmail.com..."'
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60 transition-all font-sans text-sm sm:text-base leading-relaxed resize-y"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>AI understands.</strong> Your pricing database decides.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 dark:shadow-indigo-950/60 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Request...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-100" />
                  <span>Analyze Request</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {/* Screen 2: Real-time Analysis Progress */}
          {isLoading && (
            <div className="mt-4 p-4 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-900/60 rounded-xl space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Analyzing customer request...</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300 font-semibold bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  gemini-3.1-flash-lite
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium pt-1 border-t border-indigo-100 dark:border-indigo-900/60">
                <div className={`flex items-center gap-1.5 ${activeStepIndex >= 0 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {activeStepIndex > 0 ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
                  )}
                  <span>Reading text</span>
                </div>
                <div className={`flex items-center gap-1.5 ${activeStepIndex >= 1 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {activeStepIndex > 1 ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  ) : activeStepIndex === 1 ? (
                    <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                  <span>Parsing customer</span>
                </div>
                <div className={`flex items-center gap-1.5 ${activeStepIndex >= 2 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {activeStepIndex > 2 ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  ) : activeStepIndex === 2 ? (
                    <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                  <span>Detecting items</span>
                </div>
                <div className={`flex items-center gap-1.5 ${activeStepIndex >= 3 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {activeStepIndex === 3 ? (
                    <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                  <span>Matching catalog</span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Trust signal banner */}
        <div className="mt-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex items-start gap-3 transition-colors">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Deterministic Price Guarantee</p>
            <p>
              AI extracts quantities and requirements from natural language. All unit prices are strictly retrieved from your approved <code className="bg-slate-200/70 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">pricing.csv</code>. The AI is never permitted to guess prices or calculate arithmetic.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Presets Section (for Competition Evaluators) */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Quick Competition Test Scenarios
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {presets.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => setMessage(preset.text)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-slate-800/60 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {preset.title}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${preset.tagColor}`}>
                  {preset.tag}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                "{preset.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
