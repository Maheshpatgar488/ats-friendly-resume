import React, { useState } from "react";
import { 
  Sparkles, CheckCircle2, XCircle, ArrowRight, RefreshCw, 
  HelpCircle, ChevronRight, FileEdit, Award, Target, HelpCircle as HelpIcon 
} from "lucide-react";
import { API_URL } from "../config";

export default function AIHub({ resumeData, setResumeData, jobDescription, setJobDescription, jobTitle, setJobTitle, setCustomStyles }) {
  const [atsLoading, setAtsLoading] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [tailoredResume, setTailoredResume] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // Calls the backend /api/ats-score endpoint
  const analyzeATS = async () => {
    if (!jobDescription.trim()) {
      alert("Please paste a Job Description first to analyze your resume.");
      return;
    }
    setAtsLoading(true);
    setScoreData(null);
    try {
      const response = await fetch(`${API_URL}/api/ats-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription
        })
      });
      const data = await response.json();
      if (data.success) {
        setScoreData(data);
      } else {
        alert(data.error || "Failed to analyze ATS compatibility score.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the backend ATS analyzer.");
    } finally {
      setAtsLoading(false);
    }
  };

  // Calls the backend /api/tailor endpoint
  const tailorResume = async () => {
    if (!jobDescription.trim()) {
      alert("Please paste a Job Description first so the AI can tailor your resume.");
      return;
    }
    setTailorLoading(true);
    setTailoredResume(null);
    setShowComparison(false);
    try {
      const response = await fetch(`${API_URL}/api/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription,
          missingKeywords: scoreData?.keywordsMissing || []
        })
      });
      const data = await response.json();
      if (data.success && data.tailoredResumeData) {
        setTailoredResume(data.tailoredResumeData);
        setShowComparison(true);
      } else {
        alert(data.error || "Failed to tailor resume points.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the backend tailoring engine.");
    } finally {
      setTailorLoading(false);
    }
  };

  // Overwrites the active form builder resume state with the AI-optimized one
  const applyTailoring = () => {
    if (!tailoredResume) return;
    setResumeData(tailoredResume);
    if (setCustomStyles) {
      setCustomStyles(prev => ({
        ...prev,
        sectionSpacing: "6px",
        entrySpacing: "5px",
        fontSize: "9pt",
        lineHeight: "1.25",
      }));
    }
    setShowComparison(false);
    setTailoredResume(null);
    alert("✨ Awesome! Your resume has been optimized and tailored! Spacing was compacted to keep it on one page. Adjust in the Preview panel if needed.");
  };

  // Helper: return colored ring based on score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500/30";
    if (score >= 60) return "text-amber-500 border-amber-500/30";
    return "text-red-500 border-red-500/30";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-fadeIn select-none">
      
      {/* 1. INPUT PANEL (Job Details & paste JD) */}
      <div className="lg:col-span-5 flex flex-col bg-slate-800/60 backdrop-blur-md border border-slate-700/80 rounded-xl p-5 shadow-xl select-none h-auto min-h-[300px] lg:h-[calc(100vh-180px)] xl:h-[calc(100vh-250px)] overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3 mb-4">
          <Target className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Job Specifications</h2>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Target Job Title</label>
            <input 
              type="text" 
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Architect"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Paste Job Description</label>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or requirements list here to scan for matched keywords, compute your ATS score, and auto-tailor your text..."
              className="w-full flex-1 min-h-[250px] xl:min-h-0 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-normal"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-700/40 pt-4 mt-4">
          <button
            onClick={analyzeATS}
            disabled={atsLoading || tailorLoading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-indigo-300 rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {atsLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Award className="w-3.5 h-3.5" />
            )}
            Analyze Score
          </button>
          
          <button
            onClick={tailorResume}
            disabled={atsLoading || tailorLoading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg hover:shadow-indigo-500/10 active:scale-98"
          >
            {tailorLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Tailor Resume
          </button>
        </div>
      </div>

      {/* 2. RESULTS & DYNAMIC COMPARATIVE PANEL */}
      <div className="lg:col-span-7 flex flex-col bg-slate-800/30 border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl h-auto min-h-[300px] lg:h-[calc(100vh-180px)] xl:max-h-[calc(100vh-250px)]">
        
        {/* Header indicator */}
        <div className="bg-slate-900/50 px-5 py-3 border-b border-slate-700/80 flex items-center justify-between">
          <span className="text-2xs text-slate-400 font-bold uppercase tracking-widest">Optimization Hub</span>
          {showComparison && (
            <button 
              onClick={applyTailoring}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-3xs font-extrabold uppercase tracking-widest rounded transition-colors shadow-md shadow-emerald-950/20"
            >
              Apply Tailoring
            </button>
          )}
        </div>

        {/* Dynamic Panels Switch */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/20">
          
          {/* Default Screen (Waiting for actions) */}
          {!scoreData && !showComparison && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Awaiting Analysis</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed mt-2">
                Paste a job description on the left and select either <strong>"Analyze Score"</strong> to scan keywords or <strong>"Tailor Resume"</strong> to auto-align experiences.
              </p>
            </div>
          )}

          {/* PANEL A: ATS ANALYSIS RESULTS CARD */}
          {scoreData && !showComparison && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Radial Score Gauge Card */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6 shadow-inner">
                <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-slate-800 shadow-xl">
                  <div className={`text-2xl font-black font-mono ${getScoreColor(scoreData.score)}`}>
                    {scoreData.score ?? "N/A"}%
                  </div>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">ATS Match Index</h4>
                    {scoreData.fallback && (
                      <span className="px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/60 text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded">
                        Local Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Your resume has a semantic match coefficient of {scoreData.score ?? "N/A"}% against the requirements. Aim for 80%+ to comfortably clear automated screening.
                    {scoreData.fallback && (
                      <span className="block mt-1 text-amber-400/80 text-[10px]">
                        Running in offline mode. Connect a Gemini API key for enhanced AI analysis.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Keywords Matching Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/25 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    Matched Keywords ({scoreData.keywordsMatched?.length || 0})
                  </div>
                  {scoreData.keywordsMatched?.length === 0 ? (
                    <div className="text-slate-500 text-xs">No keywords found overlapping.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {scoreData.keywordsMatched?.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-900/80 rounded text-emerald-300 text-3xs font-semibold uppercase">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/25 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
                    <XCircle className="w-4 h-4" />
                    Missing Key Terms ({scoreData.keywordsMissing?.length || 0})
                  </div>
                  {scoreData.keywordsMissing?.length === 0 ? (
                    <div className="text-slate-500 text-xs">Wow! No major missing terms found.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {scoreData.keywordsMissing?.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-950/40 border border-red-900/80 rounded text-red-300 text-3xs font-semibold uppercase">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions List */}
              <div className="bg-slate-900/25 border border-slate-800 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Improvement Checklist</h4>
                <ul className="space-y-3.5">
                  {scoreData.suggestions?.map((sug, i) => (
                    <li key={i} className="flex gap-2 items-start text-xs text-slate-400 leading-normal">
                      <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* PANEL B: SIDE-BY-SIDE TAILORING COMPARATIVE REVIEW */}
          {showComparison && tailoredResume && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-indigo-950/30 border border-indigo-900/60 rounded-xl p-4 text-center">
                <Sparkles className="w-5 h-5 text-indigo-400 mx-auto mb-1.5 animate-pulse" />
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Tailoring Complete!</h4>
                  {tailoredResume?.engine === "local" && (
                    <span className="px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/60 text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded">
                      Local Mode
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto leading-normal">
                  Review the optimized side-by-side bullet comparisons below. Click **&quot;Apply Tailoring&quot;** at the top right to save these changes to your active resume builder!
                  {tailoredResume?.engine === "local" && (
                    <span className="block mt-1 text-amber-400/80">
                      Local mode: Skills were auto-populated from keywords. Connect a Gemini API key for full AI rewrites.
                    </span>
                  )}
                </p>
              </div>

              {/* Summary Tailor comparison */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1.5 mb-3">Professional Summary Tailoring</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Original</div>
                    <p className="text-xs text-slate-500 text-justify leading-relaxed italic bg-slate-950/20 p-3 rounded-md">{resumeData.summary || "No original summary present."}</p>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> Tailored</div>
                    <p className="text-xs text-indigo-200 text-justify leading-relaxed font-semibold bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-md">{tailoredResume.summary}</p>
                  </div>
                </div>
              </div>

              {/* Work Experience highlights comparison */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1.5 mb-3">Work History Bullet Tailoring</h4>
                {tailoredResume.experience?.map((exp, expIdx) => {
                  const originalExp = resumeData.experience?.[expIdx];
                  if (!originalExp) return null;

                  return (
                    <div key={expIdx} className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 space-y-3.5">
                      <div className="text-xs font-bold text-slate-200">{exp.position} &bull; <span className="text-slate-400 font-medium italic">{exp.company}</span></div>
                      
                      <div className="space-y-3 border-t border-slate-800/60 pt-3">
                        {exp.highlights?.map((high, hIdx) => {
                          const origHigh = originalExp.highlights?.[hIdx] || "";
                          return (
                            <div key={hIdx} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-800/30 pb-3 last:border-0 last:pb-0">
                              <div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Original Bullet</div>
                                <div className="text-xs text-slate-500 leading-normal">{origHigh || "(Empty)"}</div>
                              </div>
                              <div>
                                <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> Keyword Optimized (STAR)</div>
                                <div className="text-xs text-indigo-200 leading-normal font-medium bg-indigo-950/10 p-2 border border-indigo-900/20 rounded">{high}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </div>
      
    </div>
  );
}
