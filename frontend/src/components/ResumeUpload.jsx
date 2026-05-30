import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { resumeAPI } from '../services/api';

export default function ResumeUpload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const fileInputRef = useRef(null);

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
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    // Basic validations
    if (file.type !== "application/pdf") {
      setError("Invalid file format. Only PDF resumes are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum limit of 10MB.");
      return;
    }

    setError(null);
    setUploading(true);
    setSuccess(false);
    setProgress(15);
    setFileName(file.name);

    try {
      // Periodic progress simulation for smooth UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Perform API upload
      const result = await resumeAPI.upload(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // Bind to at least 15 for visible progress
        setProgress(Math.max(15, percentCompleted));
      });

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);
      
      // Delay success callback for animation satisfaction
      setTimeout(() => {
        onUploadSuccess(result);
        setUploading(false);
      }, 1000);

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Failed to upload and parse the resume. Ensure it is a valid, readable PDF."
      );
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? triggerFileInput : undefined}
        className={`w-full py-10 px-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
          dragActive 
            ? 'border-primary-glow bg-primary-600/10 shadow-glow shadow-primary-500/10 scale-[1.01]' 
            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/10'
        } ${uploading ? 'pointer-events-none' : ''}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="w-10 h-10 text-primary-glow animate-spin mb-4" />
            <p className="text-sm font-bold text-white mb-2">Analyzing Resume & Extracting Skills...</p>
            <p className="text-xs text-slate-400 mb-4 truncate max-w-xs">{fileName}</p>
            
            {/* Custom glowing progress bar */}
            <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-600 to-primary-glow h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-primary-glow mt-2">{progress}% completed</span>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4 animate-bounce" />
            <p className="text-sm font-bold text-emerald-400 mb-1">Parsing Pipeline Succeeded!</p>
            <p className="text-xs text-slate-300 mb-2 truncate max-w-xs">{fileName}</p>
            <p className="text-[10px] text-slate-500">Structured data saved, vector embeddings generated.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4 group-hover:text-primary-glow transition-colors duration-300">
              <Upload className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-white mb-1.5">
              Drag & drop your resume PDF here, or <span className="text-primary-glow hover:underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 max-w-sm mb-1 leading-normal">
              Accepts PDF files only. Maximum file size 10MB.
            </p>
            <p className="text-[10px] text-slate-600 bg-slate-950 px-2 py-0.5 rounded border border-slate-900 mt-2">
              AUTO-PARSING EDUCATION, EXPERIENCE, SKILLS, AND CERTIFICATIONS
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-semibold text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
