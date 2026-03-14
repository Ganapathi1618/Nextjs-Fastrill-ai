"use client";
import React, { useState } from 'react';

// Components inside the file for easy "Single File" updates
const NavItem = ({ active, label, onClick }) => (
  <button onClick={onClick} className={`p-4 ${active ? 'text-emerald-500' : 'text-slate-400'}`}>
    {label}
  </button>
);

export default function CampaignManager() {
  const [step, setStep] = useState('audience'); // audience | template | review
  const [bizName] = useState("Your Business");
  const [previewText, setPreviewText] = useState("Hi {{name}}, exclusive offer at {{business}}!");

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* PANE A: Global Navigation */}
      <nav className="w-20 border-r border-slate-200 bg-white flex flex-col items-center py-8 gap-8">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl" />
        <div className="flex flex-col gap-6">
          <NavItem label="Dsh" active={true} />
          <NavItem label="Cmp" />
          <NavItem label="Cust" />
        </div>
      </nav>

      {/* PANE B: Main Workflow */}
      <main className="flex-1 overflow-y-auto p-12">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight">New Campaign</h1>
          <p className="text-slate-500">Design high-intent journeys that drive revenue.</p>
        </header>

        {/* Step Indicator */}
        <div className="flex gap-4 mb-8">
          {['Audience', 'Template', 'Review'].map((s, i) => (
            <div key={s} className={`px-4 py-2 rounded-full text-xs font-bold ${step === s.toLowerCase() ? 'bg-emerald-100 text-emerald-700' : 'bg-white border'}`}>
              {i + 1}. {s}
            </div>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {step === 'audience' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Select Segment</h2>
              {['VIP', 'Abandoned Cart', 'New Leads'].map(seg => (
                <button key={seg} onClick={() => setStep('template')} className="block w-full text-left p-4 border rounded-xl hover:border-emerald-500 transition-all">
                  {seg}
                </button>
              ))}
            </div>
          )}
          {step === 'template' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Choose High-Intent Template</h2>
              <textarea 
                className="w-full p-4 border rounded-xl" 
                value={previewText} 
                onChange={(e) => setPreviewText(e.target.value)}
              />
              <button onClick={() => setStep('review')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg">Next</button>
            </div>
          )}
        </div>
      </main>

      {/* PANE C: Right Side Context (Previewer & Insights) */}
      <aside className="w-96 border-l border-slate-200 bg-slate-100 p-8">
        <h3 className="font-bold mb-6">Campaign Performance</h3>
        
        {/* Phone Preview */}
        <div className="bg-[#0b141a] rounded-[2rem] p-4 w-[280px] mx-auto border-8 border-slate-900 aspect-[9/19]">
          <div className="text-white text-sm p-4 bg-[#005c4b] rounded-xl">{previewText.replace('{{name}}', 'Radhika').replace('{{business}}', bizName)}</div>
        </div>

        {/* Predicted ROI Card */}
        <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200">
          <h4 className="text-xs uppercase font-bold text-slate-400">Projected Impact</h4>
          <div className="text-3xl font-extrabold text-emerald-600 my-2">₹52,000</div>
          <p className="text-sm text-slate-500">Based on historical performance of this segment.</p>
        </div>
      </aside>
    </div>
  );
}
