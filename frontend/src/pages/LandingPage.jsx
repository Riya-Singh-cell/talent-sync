import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronDown, Briefcase, User } from 'lucide-react';
import '../index.css';

export default function LandingPage({ setPage, setUserRole }) {
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRecruiterClick = () => {
    setUserRole('recruiter');
    setPage('auth');
  };

  const handleCandidateClick = () => {
    setUserRole('candidate');
    setPage('auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/80 backdrop-blur' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">TalentSync AI</span>
          </div>
          <button onClick={handleRecruiterClick} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-all">Get Started</button>
        </div>
      </nav>

      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <section className="relative min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Candidate Matching
              </span>
            </h1>
            <p className="text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Find your perfect candidates with semantic AI matching in seconds.
            </p>
          </motion.div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Recruiter Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              onClick={handleRecruiterClick}
              className="cursor-pointer group"
            >
              <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Recruiter Access</h3>
                  <p className="text-slate-300 mb-6">
                    Post jobs, screen resumes with AI, and find the perfect candidates efficiently.
                  </p>
                  <div className="flex items-center gap-2 text-cyan-400 group-hover:gap-3 transition-all">
                    <span className="font-semibold">Sign Up / Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Candidate Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              onClick={handleCandidateClick}
              className="cursor-pointer group"
            >
              <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Candidate Access</h3>
                  <p className="text-slate-300 mb-6">
                    Upload your resume and match with opportunities that fit your skills.
                  </p>
                  <div className="flex items-center gap-2 text-purple-400 group-hover:gap-3 transition-all">
                    <span className="font-semibold">Sign Up / Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 pt-20 border-t border-slate-700"
          >
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose TalentSync AI?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700">
                <h4 className="font-bold text-lg mb-2 text-cyan-400">⚡ Lightning Fast</h4>
                <p className="text-slate-400">AI-powered semantic matching in seconds</p>
              </div>
              <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700">
                <h4 className="font-bold text-lg mb-2 text-cyan-400">🎯 Accurate</h4>
                <p className="text-slate-400">Advanced NLP ensures perfect candidate matches</p>
              </div>
              <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700">
                <h4 className="font-bold text-lg mb-2 text-cyan-400">🔒 Secure</h4>
                <p className="text-slate-400">JWT authentication and encrypted data storage</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
