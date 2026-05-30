import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/80 backdrop-blur' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">TalentSync AI</span>
          </div>
          <button onClick={() => navigate('/auth')} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-all">Get Started</button>
        </div>
      </nav>

      <section className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">AI-Powered Candidate Matching</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">Find your perfect candidates with semantic AI matching in seconds.</p>
            <div className="flex gap-4">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/auth')} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold flex items-center gap-2">
                Start Hiring <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
