import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              TalentSync AI
            </span>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Candidate Matching
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Find your perfect candidates with semantic AI matching in seconds. Powered by advanced NLP and vector search.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              Start Hiring
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 border border-slate-600 rounded-lg font-semibold hover:border-cyan-400 transition-all">
              Learn More
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 transition-all">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Matching</h3>
              <p className="text-slate-400">Semantic understanding of skills and experience</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 transition-all">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-slate-400">Get results in seconds, not hours</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 transition-all">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
              <p className="text-slate-400">Data-driven insights for better hiring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-slate-800/30 border-t border-slate-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">10K+</div>
              <p className="text-slate-400">Resumes Processed</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">98%</div>
              <p className="text-slate-400">Match Accuracy</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">50+</div>
              <p className="text-slate-400">Active Companies</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">0.2s</div>
              <p className="text-slate-400">Avg Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Hiring?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Join hundreds of companies using TalentSync AI to find their best talent faster.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-slate-400">
          <p>&copy; 2026 TalentSync AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
