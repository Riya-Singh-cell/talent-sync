import React, { useState } from 'react';
import { Search, SlidersHorizontal, BarChart3, Users, Sparkles } from 'lucide-react';
import CandidateCard from './CandidateCard';
import SkillCharts from './SkillCharts';
import ResumePreview from './ResumePreview';

export default function RankingResults({ rankingData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatch, setMinMatch] = useState(30);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics'
  const [previewCandidate, setPreviewCandidate] = useState(null);

  if (!rankingData) return null;

  const { job_title, rankings = [] } = rankingData;

  // Filter candidates based on query and threshold
  const filteredCandidates = rankings.filter(c => {
    const matchesSearch = c.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesScore = c.match_percentage >= minMatch;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/40 p-6 rounded-2xl border border-slate-900">
        <div>
          <span className="text-[10px] font-bold text-primary-glow bg-primary-600/10 px-2.5 py-1 rounded-xl border border-primary-500/25">
            SEMANTIC AI PIPELINE RESULTS
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2">
            Candidates Ranked for: <span className="text-primary-glow">{job_title}</span>
          </h2>
        </div>

        {/* Tab Switching */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
              activeTab === 'list'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Talent Match ({filteredCandidates.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
              activeTab === 'analytics'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Pool Analytics
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950/20 p-4 rounded-xl border border-slate-900">
            {/* Search Input */}
            <div className="relative md:col-span-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter candidates by name or core skills..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 transition-all duration-300"
              />
            </div>

            {/* Range Slider Threshold */}
            <div className="flex items-center gap-3 md:col-span-6 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-900">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex-grow flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 shrink-0">MIN FIT:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minMatch}
                  onChange={(e) => setMinMatch(Number(e.target.value))}
                  className="flex-grow h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-primary-glow"
                />
                <span className="text-[10px] font-bold text-primary-glow bg-primary-600/10 px-2 py-0.5 rounded border border-primary-500/20 w-10 text-center shrink-0">
                  {minMatch}%
                </span>
              </div>
            </div>
          </div>

          {/* Candidates Cards List */}
          {filteredCandidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCandidates.map((candidate, idx) => (
                <CandidateCard
                  key={idx}
                  candidate={candidate}
                  onViewResume={() => setPreviewCandidate(candidate)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel py-16 text-center rounded-2xl">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No candidates match your active filters.</p>
              <p className="text-xs text-slate-600 mt-1">Try lowering the minimum match rating or clearing search fields.</p>
            </div>
          )}
        </>
      ) : (
        /* Analytics View */
        <SkillCharts 
          candidates={rankings} 
          jobRequirements={rankings?.[0]?.matched_skills.concat(rankings?.[0]?.missing_skills) || []} 
        />
      )}

      {/* Resume Preview Popup Modal Overlay */}
      {previewCandidate && (
        <ResumePreview
          candidate={previewCandidate}
          onClose={() => setPreviewCandidate(null)}
        />
      )}

    </div>
  );
}
