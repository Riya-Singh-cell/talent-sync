import React from 'react';
import { X, Briefcase, GraduationCap, Folder, Award, ExternalLink, Code2 } from 'lucide-react';

export default function ResumePreview({ candidate, onClose }) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-dark-850 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header Section */}
        <div className="glass-panel py-5 px-6 flex justify-between items-center border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{candidate.candidate_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">Source File: {candidate.filename}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8">
          {/* Header Card / Bio */}
          <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-primary-glow bg-primary-600/10 px-2 py-0.5 rounded border border-primary-500/20">
                AI MATCH RATING: {candidate.match_percentage}%
              </span>
              <p className="text-sm text-slate-300 italic leading-relaxed mt-2.5">
                "{candidate.explanation}"
              </p>
            </div>
            
            {/* Social Links */}
            {candidate.github_links && candidate.github_links.length > 0 && (
              <div className="flex flex-col gap-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Links</span>
                {candidate.github_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary-glow hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {link.replace('https://', '').replace('www.', '').substring(0, 25)}...
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Core Technical Stack */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3.5">
              <Code2 className="w-4 h-4 text-primary-glow" />
              Technical Competency Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, idx) => {
                const isMatched = candidate.matched_skills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                return (
                  <span
                    key={idx}
                    className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
                      isMatched 
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Two-Column Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Professional Experience */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-primary-glow" />
                Work History
              </h3>
              <div className="space-y-4">
                {candidate.experience && candidate.experience.length > 0 ? (
                  candidate.experience.map((exp, idx) => (
                    <div key={idx} className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white">{exp.role}</h4>
                        <span className="text-[10px] font-bold text-slate-500">{exp.duration}</span>
                      </div>
                      <p className="text-xs text-primary-glow font-semibold">{exp.company}</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-normal mt-2">{exp.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No experience records found.</p>
                )}
              </div>
            </div>

            {/* Academic Education */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-primary-glow" />
                Academic History
              </h3>
              <div className="space-y-4">
                {candidate.education && candidate.education.length > 0 ? (
                  candidate.education.map((edu, idx) => (
                    <div key={idx} className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                        <span className="text-[10px] font-bold text-slate-500">{edu.year}</span>
                      </div>
                      <p className="text-xs text-primary-glow font-semibold">{edu.school}</p>
                      <p className="text-xs text-slate-400 font-normal">{edu.field_of_study}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No academic records found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Project Work */}
          {candidate.projects && candidate.projects.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Folder className="w-4 h-4 text-primary-glow" />
                Key Project Implementations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidate.projects.map((proj, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-normal">{proj.description}</p>
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {proj.technologies.map((t, i) => (
                          <span key={i} className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {t.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {candidate.certifications && candidate.certifications.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary-glow" />
                Industry Certifications & Credentials
              </h3>
              <div className="flex flex-wrap gap-3">
                {candidate.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-950/40 border border-slate-900 py-2 px-3.5 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-glow shadow-glow shadow-primary-glow"></span>
                    <span className="text-xs text-slate-300 font-semibold">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/60 py-3.5 px-6 border-t border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
