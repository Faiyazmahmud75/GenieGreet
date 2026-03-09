
import React, { useState } from 'react';
import { Occasion, WishData } from '../types';
import { Sparkles, PenLine } from 'lucide-react';

interface WishFormProps {
  onSubmit: (data: WishData) => void;
  isLoading: boolean;
  aiQuotaReached?: boolean;
}

const WishForm: React.FC<WishFormProps> = ({ onSubmit, isLoading, aiQuotaReached }) => {
  const [formData, setFormData] = useState<WishData>({
    recipientName: '',
    senderName: '',
    occasion: Occasion.Birthday,
    relationship: '',
    manualMessage: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipientName.trim()) {
      setError("Please add a recipient name to weave the magic!");
      return;
    }
    setError(null);
    onSubmit(formData);
  };

  const isManual = formData.manualMessage && formData.manualMessage.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-xl">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 block">Recipient Name <span className="text-rose-400">*</span></label>
        <input
          type="text"
          value={formData.recipientName}
          onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
          placeholder="Who is this for?"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-slate-600"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 block">Sender Name / Signature (Optional)</label>
        <input
          type="text"
          value={formData.senderName}
          onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
          placeholder="Who is this from?"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 block">The Occasion</label>
        <select
          value={formData.occasion}
          onChange={(e) => setFormData({ ...formData, occasion: e.target.value as Occasion })}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
        >
          {Object.values(Occasion).map((occ) => (
            <option key={occ} value={occ} className="bg-slate-900">{occ}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 block">Manual Message (Optional)</label>
        <textarea
          value={formData.manualMessage}
          onChange={(e) => setFormData({ ...formData, manualMessage: e.target.value })}
          placeholder="Write your own heart-felt message here, or leave empty for AI to craft one..."
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none h-24 resize-none placeholder:text-slate-600"
        />
        <p className="text-[10px] text-slate-500 italic">If provided, we'll use your words exactly.</p>
      </div>

      {!isManual && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 block">Relationship for AI (Optional)</label>
          <input
            type="text"
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            placeholder="e.g. Brother, Best Friend, Partner"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-slate-600"
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4" />
          {error}
        </div>
      )}

      {aiQuotaReached && !isManual && (
        <div className="p-4 rounded-xl bg-rose-900/20 border border-rose-500/30 text-rose-300 text-sm shadow-inner shadow-rose-900/20 animate-in fade-in zoom-in duration-500">
          <p className="font-bold flex items-center gap-2 mb-1 text-rose-400">
            <Sparkles className="w-4 h-4" /> Magical Energy Depleted
          </p>
          <p className="opacity-90 leading-relaxed">
            The free AI generation limits have been reached for now.
            <strong> Please write a manual message above </strong>
            to create your card, or consider supporting the project to expand the magic!
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || (aiQuotaReached && !isManual)}
        className={`w-full py-4 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${isLoading || (aiQuotaReached && !isManual)
          ? 'bg-slate-700/80 cursor-not-allowed opacity-50 text-slate-400'
          : isManual
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:scale-[1.02]'
            : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02]'
          } active:scale-[0.98]`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Crafting Magic...
          </div>
        ) : isManual ? (
          <>
            <PenLine className="w-5 h-5" />
            Create Card
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate with AI
          </>
        )}
      </button>
    </form>
  );
};

export default WishForm;
