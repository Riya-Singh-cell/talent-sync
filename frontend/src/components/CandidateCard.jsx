import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp, Github, Sparkles } from 'lucide-react';

export default function CandidateCard({ candidate, onViewResume }) {
  const [expanded, setExpanded] = useState(false);

  // Score styling logic
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20';
    if (score >= 70) return 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20';
    if (score >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-950/20';
    return 'text-slate-400 border-slate-500/20 bg-slate-950/20';
  };

  const getRingColor = (score) => {
    if (score >= 80) return 'stroke-emerald-400';
    if (score >= 70) return 'stroke-cyan-400';
    if (score >= 50) return 'stroke-amber-400';
    return 'stroke-slate-500';
  };

  const scoreClass = getScoreColor(candidate.match_percentage);
  const ringStroke = getRingColor(candidate.match_percentage);

  // SVG parameters for radial circle
  const radius = 24;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (candidate.match_percentage / 100) * circumference;

  return (
    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
      
      {/* Top Main Row */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Name and Core Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-white truncate max-w-sm">
              {candidate.candidate_name}
            </h3>
            {candidate.match_percentage >= 80 && (
              <span className="text-[9px] font-extrabold bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                Elite Match
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate max-w-xs mb-2">
            File: {candidate.filename}
          </p>
          
          {/* Quick Stats Summary */}
          <div className="flex items-center gap-3.5 text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {candidate.matched_skills?.length || 0} Matches
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              {candidate.missing_skills?.length || 0} Gaps
            </span>
          </div>
        </div>

        {/* Circular Percentage Ring */}
        <div className="relative shrink-0 flex items-center justify-center w-16 h-16 rounded-xl border border-slate-800 bg-slate-950/40">
          <svg className="w-12 h-12 -rotate-90">
            {/* Background Track Ring */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="stroke-slate-900 fill-none"
              strokeWidth={strokeWidth}
            />
            {/* Highlighted Match Ring */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              className={`fill-none transition-all duration-1000 ${ringStroke}`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[10px] font-extrabold text-white text-glow-indigo">
            {Math.round(candidate.match_percentage)}%
          </span>
        </div>

      </div>

      {/* AI Explanation / Reasoning Preview */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-primary-glow uppercase tracking-wider">AI SOURCING ASSESSMENT</span>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {candidate.explanation}
          </p>
        </div>
      </div>

      {/* Expandable Skills and Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-4 border-t border-slate-900 space-y-4">
              {/* Matched Skills */}
              {candidate.matched_skills && candidate.matched_skills.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Matching Competencies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.matched_skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-400">
                        {skill.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {candidate.missing_skills && candidate.missing_skills.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2">Missing Skills (Gaps)</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.missing_skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-400">
                        {skill.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* parsed summary overview */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/20 p-3 rounded-xl border border-slate-900">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Education</span>
                  <span className="font-semibold text-slate-300">
                    {candidate.education?.[0]?.degree || "Bachelor's Degree"} in {candidate.education?.[0]?.field_of_study || "Computer Science"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Experience</span>
                  <span className="font-semibold text-slate-300">
                    {candidate.experience?.[0]?.role || "Software Engineer"} at {candidate.experience?.[0]?.company || "Innovative Inc."}
                  </span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Row Buttons */}
      <div className="flex items-center gap-3 mt-5 pt-3 border-t border-slate-900/60 justify-between">
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-300"
        >
          {expanded ? (
            <>Hide Match Gaps <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>Show Match Gaps <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>

        <button
          onClick={onViewResume}
          className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 text-xs font-bold text-slate-200 hover:text-white transition-all duration-300 flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          View Full CV
        </button>

      </div>

    </div>
  );
}
