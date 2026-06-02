import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Loader2, Sparkles, LogOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker from local bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function ResumeMatcher({ user, onLogout }) {
  const [dragActive, setDragActive] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  // Extract text from PDF using pdf.js
  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (err) {
      throw new Error('Failed to extract text from PDF: ' + err.message);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setUploading(true);
    setResumeFile(file);

    try {
      const text = await extractTextFromPDF(file);
      setResumeText(text);
      setUploading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process resume PDF");
      setUploading(false);
    }
  };

  const handleMatch = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      setError("Please upload a resume and enter a job description");
      return;
    }

    setError(null);
    setMatching(true);

    try {
      // Call the matching API
      const response = await fetch('/api/resume/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jdText,
          candidate_name: 'Candidate'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to match resume');
      }

      const result = await response.json();
      setMatchResult(result);
      setMatching(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to match resume with job description");
      setMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Resume Matcher
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Welcome back,</p>
                <p className="font-semibold text-white">{user.full_name}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Check Your Resume Against Job Descriptions
            </h2>
            <p className="text-xl text-slate-400">
              Upload your resume and paste a job description to see how well you match
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 ml-3">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Resume Upload Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">1. Upload Your Resume</h3>
              
              {!resumeText ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    dragActive 
                      ? "border-cyan-400 bg-cyan-400/10" 
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 font-semibold mb-2">
                    Drag and drop your PDF resume here
                  </p>
                  <p className="text-slate-500 text-sm mb-4">or</p>
                  <label className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold inline-block cursor-pointer transition-colors">
                    Browse Files
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-slate-500 text-xs mt-4">PDF files up to 10MB</p>
                </div>
              ) : (
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <span className="font-semibold">{resumeFile.name}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-slate-400 mb-2">Preview:</p>
                    <div className="bg-slate-900/50 p-3 rounded text-sm text-slate-300 max-h-40 overflow-y-auto">
                      {resumeText.substring(0, 300)}...
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setResumeText('');
                      setResumeFile(null);
                      setMatchResult(null);
                    }}
                    className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Upload Different Resume
                  </button>
                </div>
              )}

              {uploading && (
                <div className="flex items-center justify-center gap-2 text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing resume...</span>
                </div>
              )}
            </div>

            {/* Job Description Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">2. Paste Job Description</h3>
              
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job description here... (required skills, experience, qualifications, etc.)"
                className="w-full h-64 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none resize-none"
              />
              
              <button
                onClick={handleMatch}
                disabled={!resumeText || !jdText.trim() || matching}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {matching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Check Match
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {matchResult && (
            <div className="mt-12 p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
              <h3 className="text-2xl font-semibold mb-6">Match Results</h3>
              
              {matchResult.match_score !== undefined && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold">Overall Match Score</span>
                    <span className="text-3xl font-bold text-cyan-400">
                      {Math.round(matchResult.match_score)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${matchResult.match_score}%` }}
                    />
                  </div>
                </div>
              )}

              {matchResult.matched_skills && matchResult.matched_skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-green-400 mb-3">✓ Matched Skills ({matchResult.matched_skills.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matched_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-sm text-green-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchResult.missing_skills && matchResult.missing_skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-orange-400 mb-3">⚠ Missing Skills ({matchResult.missing_skills.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missing_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-sm text-orange-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchResult.summary && (
                <div>
                  <h4 className="font-semibold text-slate-300 mb-3">AI Analysis</h4>
                  <p className="text-slate-400 leading-relaxed">{matchResult.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
