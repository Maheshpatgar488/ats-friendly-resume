import React, { useState } from "react";
import { 
  Sparkles, FileText, Settings, Award, Layers, ShieldCheck, 
  Upload, CloudLightning, RefreshCw, CheckCircle, FileUp, Sparkle, Globe
} from "lucide-react";

import { useAutosave } from "./hooks/useAutosave";
import FormBuilder from "./components/FormBuilder";
import LivePreview from "./components/LivePreview";
import AIHub from "./components/AIHub";
import { API_URL } from "./config";

export default function App() {
  const {
    resumeData,
    setResumeData,
    customStyles,
    setCustomStyles,
    isSaved,
    clearResume,
    loadSampleData,
    updateResumeData,
    exportBackup
  } = useAutosave();

  const [activePanel, setActivePanel] = useState("builder"); // builder | preview | aihub
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  
  // File upload state for parser
  const [file, setFile] = useState(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Checks if the resume is blank (to render the onboarding portal)
  const isResumeBlank = !resumeData.personalInfo?.fullName && resumeData.experience?.length === 0;

  // Handle file drop for parser
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      triggerParse(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      triggerParse(e.target.files[0]);
    }
  };

  // Sends the PDF/DOCX to backend /api/extract-text and maps JSON into state
  const triggerParse = async (targetFile) => {
    if (!targetFile) return;
    setParseLoading(true);
    
    const formData = new FormData();
    formData.append("file", targetFile);

    try {
      const response = await fetch(`${API_URL}/api/extract-text`, {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON! Status: ${response.status}. Preview: ${text.substring(0, 150)}`);
      }

      const data = await response.json();
      if (response.ok && data.success && data.resumeData) {
        updateResumeData(data.resumeData);
        alert("🎉 Boom! Your old resume was successfully parsed and extracted. All details have been autofilled into the form builder!");
      } else {
        alert(data.error || "Failed to parse the file. Please check if the backend is running and valid.");
      }
    } catch (err) {
      console.error(err);
      alert(`Error during extraction: ${err.message}`);
    } finally {
      setParseLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* 1. PREMIUM HEADER NAVIGATION */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50 select-none">
        
        {/* Brand logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-30 hover:opacity-10 transition-opacity"></div>
            <Sparkle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-widest text-slate-100 uppercase flex items-center gap-1.5 leading-none">
              Antigravity <span className="text-[10px] bg-indigo-900/60 border border-indigo-700/80 text-indigo-400 font-bold px-1.5 py-0.5 rounded">ATS</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">Premium Resume Architect</p>
          </div>
        </div>

        {/* Real-time Workspace Navigation Tabs */}
        {!isResumeBlank && (
          <nav className="flex bg-slate-950/65 rounded-lg border border-slate-800 p-0.5 select-none">
            <button
              onClick={() => setActivePanel("builder")}
              className={`px-4 py-2 text-2xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 ${
                activePanel === "builder" 
                  ? "bg-slate-800 text-slate-100 shadow-md" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              1. Write Resume
            </button>
            <button
              onClick={() => setActivePanel("preview")}
              className={`px-4 py-2 text-2xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 ${
                activePanel === "preview" 
                  ? "bg-slate-800 text-slate-100 shadow-md" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              2. Style & Preview
            </button>
            <button
              onClick={() => setActivePanel("aihub")}
              className={`px-4 py-2 text-2xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 ${
                activePanel === "aihub" 
                  ? "bg-slate-800 text-slate-100 shadow-md" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5" />
              3. AI Keyword Match
            </button>
          </nav>
        )}

        {/* Global Save Indicator Badge & Direct File Import */}
        <div className="flex items-center gap-3 select-none">
          {!isResumeBlank && (
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-indigo-400 text-3xs font-extrabold uppercase tracking-widest rounded-md cursor-pointer transition-colors shadow">
              <input 
                type="file" 
                accept=".pdf,.docx,.doc" 
                className="hidden" 
                onChange={handleFileInputChange}
              />
              {parseLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Import Resume
                </>
              )}
            </label>
          )}

          <div className="flex items-center gap-1.5">
            {isSaved ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/20 border border-emerald-900/50 px-2.5 py-1 rounded-full animate-fadeIn">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Synced Local Cache
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-950/20 border border-amber-900/50 px-2.5 py-1 rounded-full">
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                Autosaving...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION WORKSPACE AREA */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full select-none overflow-hidden flex flex-col h-[calc(100vh-100px)]">
        
        {/* ONBOARDING LOADING PORTAL (If resumeData is empty) */}
        {isResumeBlank ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 animate-fadeIn max-w-xl mx-auto w-full select-none">
            
            <div className="text-center mb-8 select-none">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 mb-4 animate-bounce-slow">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black tracking-wide text-slate-100 uppercase">Scaffold Your Resume</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mt-2.5">
                Generate an A-grade resume. Upload an old version to extract details standardly, load a premium tech pre-filled sample, or craft one from scratch!
              </p>
            </div>

            {/* A. FILE DRAG DROP UPLOAD (AI PARSER ZONE) */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`w-full p-8 border-2 border-dashed rounded-2xl text-center mb-6 transition-all duration-300 relative flex flex-col items-center justify-center min-h-[220px] shadow-2xl ${
                parseLoading 
                  ? "bg-slate-900/40 border-slate-700 cursor-wait" 
                  : dragActive 
                    ? "bg-indigo-950/30 border-indigo-500 scale-102 shadow-indigo-900/10" 
                    : "bg-slate-900/20 border-slate-800 hover:bg-slate-900/35 hover:border-slate-700/60 cursor-pointer"
              }`}
            >
              {parseLoading ? (
                <div className="space-y-3 flex flex-col items-center animate-fadeIn select-none">
                  <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Scanning Resume (AI)</h4>
                  <p className="text-3xs text-slate-500 uppercase tracking-wider">Extracting details and compiling form fields...</p>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer select-none">
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.doc" 
                    className="hidden" 
                    onChange={handleFileInputChange}
                  />
                  <FileUp className="w-12 h-12 text-slate-500 mb-3 animate-pulse" />
                  <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest">Upload Old Resume</h4>
                  <p className="text-3xs text-slate-500 uppercase tracking-wider mt-1.5 mb-3">Accepts PDF or Word (.docx) formats</p>
                  <span className="px-3.5 py-1.5 bg-slate-900/80 border border-slate-700 text-indigo-400 text-3xs font-extrabold uppercase tracking-widest rounded-md hover:bg-slate-800 transition-colors shadow">
                    Browse File
                  </span>
                </label>
              )}
            </div>

            {/* B. SCRATCH & SAMPLE ACTIONS */}
            <div className="grid grid-cols-2 gap-4 w-full select-none">
              <button
                onClick={loadSampleData}
                className="flex flex-col items-center justify-center p-4 bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 rounded-xl transition-all shadow group active:scale-98"
              >
                <CloudLightning className="w-6 h-6 text-indigo-400 mb-1 group-hover:scale-105 transition-transform" />
                <span className="text-2xs font-extrabold text-slate-200 uppercase tracking-wider">Load Sample Profile</span>
                <span className="text-3xs text-slate-500 mt-1 uppercase tracking-widest">Pre-fills a tech profile</span>
              </button>

              <button
                onClick={() => {
                  setResumeData({
                    personalInfo: { fullName: "John Doe", email: "", phone: "", location: "" },
                    summary: "",
                    experience: [],
                    education: [],
                    skills: [],
                    projects: [],
                    certifications: [],
                    languages: []
                  });
                }}
                className="flex flex-col items-center justify-center p-4 bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 rounded-xl transition-all shadow group active:scale-98"
              >
                <FileText className="w-6 h-6 text-slate-400 mb-1 group-hover:scale-105 transition-transform" />
                <span className="text-2xs font-extrabold text-slate-200 uppercase tracking-wider">Start From Scratch</span>
                <span className="text-3xs text-slate-500 mt-1 uppercase tracking-widest">Clean empty workspace</span>
              </button>
            </div>

          </div>
        ) : (
          
          /* ACTIVE RESUME BUILDER WORKSPACE HOUSINGS */
          <div className="flex-1 overflow-hidden h-full">
            
            {activePanel === "builder" && (
              <FormBuilder 
                resumeData={resumeData} 
                setResumeData={setResumeData} 
                jobTitle={jobTitle}
              />
            )}

            {activePanel === "preview" && (
              <LivePreview 
                resumeData={resumeData}
                customStyles={customStyles}
                setCustomStyles={setCustomStyles}
                onExportBackup={exportBackup}
                onLoadSampleData={loadSampleData}
                onClearResume={clearResume}
              />
            )}

            {activePanel === "ihub" || activePanel === "aihub" && (
              <AIHub 
                resumeData={resumeData}
                setResumeData={setResumeData}
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
                jobTitle={jobTitle}
                setJobTitle={setJobTitle}
              />
            )}

          </div>
        )}

      </main>

      {/* 3. CORE SUB-FOOTER BRAND BAR */}
      <footer className="bg-slate-900/30 border-t border-slate-900 py-3 text-center text-3xs font-semibold text-slate-600 uppercase tracking-widest select-none">
        Developed by Antigravity AI &bull; DeepMind Premium Suite &bull; Windows Local Dev
      </footer>

    </div>
  );
}
