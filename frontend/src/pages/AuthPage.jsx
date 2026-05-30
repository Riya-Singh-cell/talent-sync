import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ArrowLeft, Loader2, Mail, Lock, User, Sparkles } from 'lucide-react';
import { authAPI } from '../services/api';

export default function AuthPage({ setPage, userRole, setUserRole, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Forms State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Register Call
        const registerData = {
          email,
          username,
          full_name: fullName,
          password,
          role: userRole
        };
        await authAPI.register(registerData);
        
        // Auto sign-in or switch to login
        setIsSignUp(false);
        setError('Account created successfully! Please sign in.');
      } else {
        // Login Call
        const loginData = {
          username_or_email: username || email,
          password
        };
        const result = await authAPI.login(loginData);
        
        // Save to Storage
        localStorage.setItem('token', result.access_token);
        localStorage.setItem('user', JSON.stringify({
          username: result.username,
          full_name: result.full_name,
          role: result.role
        }));
        
        onLoginSuccess(result);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'An error occurred during authentication. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid-bg overflow-hidden flex items-center justify-center py-12 px-6">
      {/* Decorative Orbs */}
      <div className="orb-indigo top-[10%] left-[10%]"></div>
      <div className="orb-cyan bottom-[10%] right-[10%]"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <button 
          onClick={() => setPage('landing')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {/* Auth Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="glass-panel p-8 rounded-3xl"
        >
          {/* Brand logo */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-glow flex items-center justify-center shadow-glow shadow-primary-500/30 mb-3">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isSignUp ? 'Create your Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete your TalentSync profile to proceed
            </p>
          </div>

          {/* Role Toggle Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl mb-6 border border-slate-900">
            <button
              type="button"
              onClick={() => setUserRole('recruiter')}
              className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-300 ${
                userRole === 'recruiter' 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recruiter Access
            </button>
            <button
              type="button"
              onClick={() => setUserRole('candidate')}
              className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-300 ${
                userRole === 'candidate' 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candidate Access
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className={`p-3.5 rounded-xl text-xs font-medium border ${
                error.includes('successfully')
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300'
              }`}>
                {error}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary-500 transition-colors duration-300"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary-500 transition-colors duration-300"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary-500 transition-colors duration-300"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary-500 transition-colors duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white rounded-xl py-3 font-semibold text-sm shadow-glow shadow-primary-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:opacity-55 transition-all duration-300 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isSignUp ? 'Create Free Account' : 'Authenticate Profile'}
                </>
              )}
            </button>
          </form>

          {/* Toggle register/login */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {isSignUp ? 'Already registered?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-primary-glow font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In instead' : 'Create an Account'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
