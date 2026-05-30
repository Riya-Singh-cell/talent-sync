import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, LogOut, Plus, Briefcase, Users, RefreshCw, Loader2, Sparkles, Building, MapPin, Layers } from 'lucide-react';
import { jobAPI } from '../services/api';
import RankingResults from '../components/RankingResults';

export default function RecruiterDashboard({ user, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  
  // Job Post Form State
  const [showPostForm, setShowPostForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Active Screen / Ranking results state
  const [activeJob, setActiveJob] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Initial Fetch of posted jobs
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await jobAPI.list();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();
    setPostLoading(true);
    setFormError(null);

    try {
      const newJob = await jobAPI.create({
        title: jobTitle,
        company: company || "TalentSync Corp",
        location: location || "Remote",
        description: description,
        requirements: [] // Left empty so backend auto-extracts skills from description text!
      });

      setJobs([newJob, ...jobs]);
      setShowPostForm(false);
      
      // Clear inputs
      setJobTitle('');
      setCompany('');
      setLocation('');
      setDescription('');
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || "Failed to publish job details.");
    } finally {
      setPostLoading(false);
    }
  };

  const handleRankJob = async (job) => {
    setActiveJob(job);
    setRankingLoading(true);
    setRankingData(null);

    try {
      const results = await jobAPI.rank(job.id);
      setRankingData(results);
    } catch (err) {
      console.error(err);
      alert("Error compiling candidate rankings. Please ensure resumes exist in database.");
    } finally {
      setRankingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 grid-bg text-slate-100 flex flex-col justify-between py-6 px-4 md:px-8">
      
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto w-full flex justify-between items-center mb-8 bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-glow flex items-center justify-center shadow-glow shadow-primary-500/50">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">
            TalentSync <span className="text-primary-glow">Recruiter</span>
          </span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{user.full_name}</p>
            <p className="text-[10px] text-slate-500 font-medium">Recruiter Account</p>
          </div>
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-all duration-300"
            title="Logout Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full flex-grow space-y-8 mb-12">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-glow shadow-glow shadow-primary-500/5">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active JDs Posted</span>
              <span className="text-xl font-bold text-white mt-1 block">{jobs.length} Positions</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-glow/10 border border-secondary-glow/20 flex items-center justify-center text-secondary-glow">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Candidate Pipeline</span>
              <span className="text-xl font-bold text-white mt-1 block">Active Pool</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Matching Core</span>
              <span className="text-xl font-bold text-white mt-1 block">FAISS Accelerated</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Active JDs List */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-900">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Posted Vacancies</h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchJobs}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                  disabled={loadingJobs}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowPostForm(!showPostForm)}
                  className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all duration-300 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Post Role
                </button>
              </div>
            </div>

            {/* Post Job Description Form Drawer */}
            <AnimatePresence>
              {showPostForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="glass-panel p-5 rounded-2xl overflow-hidden border border-primary-500/20"
                >
                  <h4 className="text-xs font-bold text-primary-glow uppercase tracking-wider mb-4">Post a New Vacancy</h4>
                  
                  {formError && (
                    <p className="p-2 mb-3 bg-rose-950/80 text-[10px] text-rose-300 rounded border border-rose-800 font-semibold">{formError}</p>
                  )}

                  <form onSubmit={handlePostJob} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
                      <input
                        type="text"
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Lead ML Engineer"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company</label>
                        <div className="relative">
                          <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                          <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="AI Labs"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-primary-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Remote"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Job Description & Skill Needs</label>
                      <textarea
                        required
                        rows="5"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe technical requirements, frameworks, databases, and responsibilities. The AI parsing module will automatically identify required skills from this text (e.g. FastAPI, Python, PyTorch)."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-primary-500 leading-normal"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={postLoading}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-glow text-white py-2 rounded-xl text-xs font-bold shadow shadow-primary-500/10 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      {postLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>Publish Posting</>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Jobs Cards List */}
            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleRankJob(job)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                      activeJob?.id === job.id
                        ? 'bg-primary-600/10 border-primary-500 shadow-glow shadow-primary-500/5'
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-950/60'
                    }`}
                  >
                    <h4 className="text-xs font-bold text-white mb-1.5 leading-snug">{job.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-500 mb-3.5">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" /> {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </span>
                    </div>

                    {/* Skill tag list */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {job.requirements.slice(0, 4).map((req, i) => (
                          <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                            {req.toUpperCase()}
                          </span>
                        ))}
                        {job.requirements.length > 4 && (
                          <span className="text-[8px] text-slate-600 font-semibold px-1 py-0.5">+ {job.requirements.length - 4} more</span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] pt-2.5 border-t border-slate-900/60">
                      <span className="text-slate-600 font-medium">Published: {new Date(job.created_at).toLocaleDateString()}</span>
                      <span className="text-primary-glow font-bold hover:underline flex items-center gap-1">
                        View Match <Sparkles className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              ) : !loadingJobs ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No jobs published yet. Click "Post Role" to create one.</p>
              ) : (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-primary-glow animate-spin" />
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Candidates Semantic Screening Listings */}
          <div className="lg:col-span-8">
            {rankingLoading ? (
              /* Glowing Scanning AI Loading State */
              <div className="glass-panel py-24 rounded-2xl flex flex-col items-center justify-center border border-primary-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary-600/5 to-transparent animate-pulse-slow"></div>
                <div className="w-16 h-16 rounded-2xl bg-primary-600/10 border border-primary-glow/20 flex items-center justify-center text-primary-glow mb-6 relative animate-bounce shadow-glow shadow-primary-500/25">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">AI Semantic Screening Active</h3>
                <p className="text-xs text-slate-400 max-w-sm text-center leading-relaxed">
                  Querying FAISS vector index database. Executing dense embeddings cosine alignment, processing skill gaps, and generating natural justifications.
                </p>
                <div className="mt-6 flex items-center gap-2 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800 text-[10px] font-bold text-slate-400 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-primary-glow" /> SECURING MATCHER MATCHES...
                </div>
              </div>
            ) : rankingData ? (
              /* Display matching list results */
              <RankingResults rankingData={rankingData} />
            ) : (
              /* Empty display */
              <div className="glass-panel py-28 rounded-2xl text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-500 mb-6 shadow-md">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">No Active Screening Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-normal">
                  Select an active vacancy posting from the left sidebar to run the semantic candidate ranking pipeline, or post a new vacancy JD.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 max-w-7xl mx-auto w-full mt-8">
        &copy; {new Date().getFullYear()} TalentSync AI. Powered by MongoDB, FAISS and SentenceTransformers.
      </footer>

    </div>
  );
}
