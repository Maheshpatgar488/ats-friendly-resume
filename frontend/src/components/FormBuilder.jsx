import React, { useState } from "react";
import { 
  User, Briefcase, GraduationCap, Code, FolderGit2, Award, 
  Plus, Trash2, Sparkles, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import { API_URL } from "../config";

export default function FormBuilder({ resumeData, setResumeData, jobTitle }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [aiLoading, setAiLoading] = useState({}); // Track loading state for specific experience bullets

  const tabs = [
    { id: "personal", label: "Personal", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "skills", label: "Skills", icon: Code },
    { id: "projects", label: "Projects", icon: FolderGit2 },
    { id: "more", label: "More", icon: Award },
  ];

  // Helper: update deep state fields
  const updatePersonalInfo = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  // ----------------------------------------------------------------------
  // EXPERIENCE HELPERS
  // ----------------------------------------------------------------------
  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: "", position: "", location: "", startDate: "", endDate: "", description: [""], highlights: [""] }
      ]
    }));
  };

  const removeExperience = (idx) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx)
    }));
  };

  const updateExperience = (idx, field, value) => {
    setResumeData(prev => {
      const updated = [...prev.experience];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const addHighlight = (expIdx) => {
    setResumeData(prev => {
      const updated = [...prev.experience];
      updated[expIdx].highlights = [...updated[expIdx].highlights, ""];
      return { ...prev, experience: updated };
    });
  };

  const removeHighlight = (expIdx, hIdx) => {
    setResumeData(prev => {
      const updated = [...prev.experience];
      updated[expIdx].highlights = updated[expIdx].highlights.filter((_, i) => i !== hIdx);
      return { ...prev, experience: updated };
    });
  };

  const updateHighlight = (expIdx, hIdx, value) => {
    setResumeData(prev => {
      const updated = [...prev.experience];
      const updatedHighlights = [...updated[expIdx].highlights];
      updatedHighlights[hIdx] = value;
      updated[expIdx].highlights = updatedHighlights;
      return { ...prev, experience: updated };
    });
  };

  // Optimize specific experience bullet with STAR method (AI)
  const optimizeBullet = async (expIdx, hIdx) => {
    const bulletText = resumeData.experience[expIdx].highlights[hIdx];
    if (!bulletText.trim()) return;

    const loadingKey = `${expIdx}-${hIdx}`;
    setAiLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const response = await fetch(`${API_URL}/api/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bullet",
          content: bulletText,
          jobTitle: jobTitle
        })
      });

      const data = await response.json();
      if (data.success && data.enhancedText) {
        updateHighlight(expIdx, hIdx, data.enhancedText);
      } else {
        alert(data.error || "Failed to optimize bullet point. Please check your API key.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the backend optimization engine.");
    } finally {
      setAiLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // ----------------------------------------------------------------------
  // EDUCATION HELPERS
  // ----------------------------------------------------------------------
  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { institution: "", degree: "", fieldOfStudy: "", location: "", startDate: "", endDate: "", gpa: "" }
      ]
    }));
  };

  const removeEducation = (idx) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  const updateEducation = (idx, field, value) => {
    setResumeData(prev => {
      const updated = [...prev.education];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, education: updated };
    });
  };

  // ----------------------------------------------------------------------
  // SKILLS HELPERS
  // ----------------------------------------------------------------------
  const addSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (resumeData.skills.includes(newSkill.trim())) {
      setNewSkill("");
      return;
    }
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()]
    }));
    setNewSkill("");
  };

  const removeSkill = (skillToRemove) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // ----------------------------------------------------------------------
  // PROJECTS HELPERS
  // ----------------------------------------------------------------------
  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        { name: "", description: [""], highlights: [""], technologies: [], url: "" }
      ]
    }));
  };

  const removeProject = (idx) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx)
    }));
  };

  const updateProject = (idx, field, value) => {
    setResumeData(prev => {
      const updated = [...prev.projects];
      if (field === "technologies") {
        // split technologies by comma
        const techArray = value.split(",").map(t => t.trim()).filter(Boolean);
        updated[idx] = { ...updated[idx], [field]: techArray };
      } else {
        updated[idx] = { ...updated[idx], [field]: value };
      }
      return { ...prev, projects: updated };
    });
  };

  const addProjectHighlight = (projIdx) => {
    setResumeData(prev => {
      const updated = [...prev.projects];
      updated[projIdx].highlights = [...(updated[projIdx].highlights || []), ""];
      return { ...prev, projects: updated };
    });
  };

  const removeProjectHighlight = (projIdx, hIdx) => {
    setResumeData(prev => {
      const updated = [...prev.projects];
      updated[projIdx].highlights = updated[projIdx].highlights.filter((_, i) => i !== hIdx);
      return { ...prev, projects: updated };
    });
  };

  const updateProjectHighlight = (projIdx, hIdx, value) => {
    setResumeData(prev => {
      const updated = [...prev.projects];
      const updatedHighlights = [...(updated[projIdx].highlights || [])];
      updatedHighlights[hIdx] = value;
      updated[projIdx].highlights = updatedHighlights;
      return { ...prev, projects: updated };
    });
  };

  // ----------------------------------------------------------------------
  // CERTIFICATIONS & LANGUAGES HELPERS
  // ----------------------------------------------------------------------
  const addCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { name: "", issuer: "", date: "" }
      ]
    }));
  };

  const removeCertification = (idx) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx)
    }));
  };

  const updateCertification = (idx, field, value) => {
    setResumeData(prev => {
      const updated = [...prev.certifications];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, certifications: updated };
    });
  };

  const addLanguage = (e) => {
    e.preventDefault();
    if (!newLanguage.trim()) return;
    if (resumeData.languages.includes(newLanguage.trim())) {
      setNewLanguage("");
      return;
    }
    setResumeData(prev => ({
      ...prev,
      languages: [...prev.languages, newLanguage.trim()]
    }));
    setNewLanguage("");
  };

  const removeLanguage = (langToRemove) => {
    setResumeData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== langToRemove)
    }));
  };

  // ----------------------------------------------------------------------
  // AI SUMMARY ENHANCER
  // ----------------------------------------------------------------------
  // ----------------------------------------------------------------------
  // EXPERIENCE DESCRIPTION BULLETS HELPERS
  // ----------------------------------------------------------------------
  const toArray = (val) => Array.isArray(val) ? val : [];

  const addDescriptionBullet = (expIdx) => {
    setResumeData(prev => {
      const updated = [...prev.experience];
      const bullets = toArray(updated[expIdx].description);
      updated[expIdx].description = [...bullets, ""];
      return { ...prev, experience: updated };
    });
  };

  const removeDescriptionBullet = (expIdx, bIdx) => {
    setResumeData(prev => {
      const updated = [...prev.experience];
      const bullets = toArray(updated[expIdx].description).filter((_, i) => i !== bIdx);
      updated[expIdx].description = bullets;
      return { ...prev, experience: updated };
    });
  };

  const updateDescriptionBullet = (expIdx, bIdx, value) => {
    setResumeData(prev => {
      const updated = [...prev.experience];
      const bullets = [...toArray(updated[expIdx].description)];
      bullets[bIdx] = value;
      updated[expIdx].description = bullets;
      return { ...prev, experience: updated };
    });
  };

  // ----------------------------------------------------------------------
  // PROJECT DESCRIPTION BULLETS HELPERS
  // ----------------------------------------------------------------------
  const addProjectDescBullet = (projIdx) => {
    setResumeData(prev => {
      const updated = [...prev.projects];
      const bullets = toArray(updated[projIdx].description);
      updated[projIdx].description = [...bullets, ""];
      return { ...prev, projects: updated };
    });
  };

  const removeProjectDescBullet = (projIdx, bIdx) => {
    setResumeData(prev => {
      const updated = [...prev.projects];
      const bullets = toArray(updated[projIdx].description).filter((_, i) => i !== bIdx);
      updated[projIdx].description = bullets;
      return { ...prev, projects: updated };
    });
  };

  const updateProjectDescBullet = (projIdx, bIdx, value) => {
    setResumeData(prev => {
      const updated = [...prev.projects];
      const bullets = [...toArray(updated[projIdx].description)];
      bullets[bIdx] = value;
      updated[projIdx].description = bullets;
      return { ...prev, projects: updated };
    });
  };

  const [summaryLoading, setSummaryLoading] = useState(false);
  const enhanceSummary = async () => {
    if (!resumeData.summary.trim()) {
      alert("Please enter a basic summary first so the AI can improve it.");
      return;
    }
    setSummaryLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "summary",
          content: resumeData.summary,
          jobTitle: jobTitle
        })
      });
      const data = await response.json();
      if (data.success && data.enhancedText) {
        setResumeData(prev => ({ ...prev, summary: data.enhancedText }));
      } else {
        alert(data.error || "Failed to enhance summary.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the AI summary enhancer.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Input styling variables for quick premium look
  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelStyle = "block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider";

  return (
    <div className="flex flex-col bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-700/80 overflow-hidden shadow-2xl h-full min-h-0">
      {/* Dynamic Tab Navigation Headers */}
      <div className="flex border-b border-slate-700/80 overflow-x-auto bg-slate-900/40">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "border-indigo-500 text-indigo-400 bg-slate-800/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content Panel */}
      <div className="flex-1 p-6 overflow-y-auto h-full min-h-0">
        
        {/* 1. PERSONAL INFORMATION */}
        {activeTab === "personal" && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700/60 pb-1.5 mb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Full Name *</label>
                <input 
                  type="text" 
                  className={inputStyle} 
                  placeholder="John Doe" 
                  value={resumeData.personalInfo.fullName || ""}
                  onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelStyle}>Target Job Title</label>
                <input 
                  type="text" 
                  className={inputStyle} 
                  placeholder="Senior React Engineer" 
                  value={resumeData.personalInfo.title || ""}
                  onChange={(e) => updatePersonalInfo("title", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelStyle}>Email Address</label>
                <input 
                  type="email" 
                  className={inputStyle} 
                  placeholder="john.doe@example.com" 
                  value={resumeData.personalInfo.email || ""}
                  onChange={(e) => updatePersonalInfo("email", e.target.value)}
                />
              </div>
              <div>
                <label className={labelStyle}>Phone Number</label>
                <input 
                  type="text" 
                  className={inputStyle} 
                  placeholder="+1 (555) 123-4567" 
                  value={resumeData.personalInfo.phone || ""}
                  onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelStyle}>Location</label>
                <input 
                  type="text" 
                  className={inputStyle} 
                  placeholder="San Francisco, CA" 
                  value={resumeData.personalInfo.location || ""}
                  onChange={(e) => updatePersonalInfo("location", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">Portfolio / Website</span>
                <div className="space-y-2">
                  <div>
                    <label className={labelStyle}>Display Text</label>
                    <input 
                      type="text" 
                      className={inputStyle} 
                      placeholder="johndoe.dev" 
                      value={resumeData.personalInfo.website || ""}
                      onChange={(e) => updatePersonalInfo("website", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Hyperlink URL</label>
                    <input 
                      type="text" 
                      className={inputStyle} 
                      placeholder="https://johndoe.dev" 
                      value={resumeData.personalInfo.websiteUrl || ""}
                      onChange={(e) => updatePersonalInfo("websiteUrl", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">LinkedIn Profile</span>
                <div className="space-y-2">
                  <div>
                    <label className={labelStyle}>Display Text</label>
                    <input 
                      type="text" 
                      className={inputStyle} 
                      placeholder="LinkedIn" 
                      value={resumeData.personalInfo.linkedin || ""}
                      onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Hyperlink URL</label>
                    <input 
                      type="text" 
                      className={inputStyle} 
                      placeholder="https://linkedin.com/in/johndoe" 
                      value={resumeData.personalInfo.linkedinUrl || ""}
                      onChange={(e) => updatePersonalInfo("linkedinUrl", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/50">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">GitHub Profile</span>
                <div className="space-y-2">
                  <div>
                    <label className={labelStyle}>Display Text</label>
                    <input 
                      type="text" 
                      className={inputStyle} 
                      placeholder="GitHub" 
                      value={resumeData.personalInfo.github || ""}
                      onChange={(e) => updatePersonalInfo("github", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Hyperlink URL</label>
                    <input 
                      type="text" 
                      className={inputStyle} 
                      placeholder="https://github.com/johndoe" 
                      value={resumeData.personalInfo.githubUrl || ""}
                      onChange={(e) => updatePersonalInfo("githubUrl", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-1">
                <label className={labelStyle}>Professional Summary</label>
                <button
                  onClick={enhanceSummary}
                  disabled={summaryLoading}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors uppercase tracking-wider"
                >
                  <Sparkles className="w-3 h-3" />
                  {summaryLoading ? "Enhancing..." : "Optimize with AI"}
                </button>
              </div>
              <textarea 
                className={`${inputStyle} h-28 resize-none`}
                placeholder="A detail-oriented software engineer with 5+ years of experience..."
                value={resumeData.summary || ""}
                onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* 2. WORK EXPERIENCE */}
        {activeTab === "experience" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5 mb-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Work History</h3>
              <button 
                onClick={addExperience}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold tracking-wide transition-all shadow-md hover:shadow-indigo-500/10"
              >
                <Plus className="w-3.5 h-3.5" /> ADD WORK
              </button>
            </div>

            {resumeData.experience.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/20 border border-dashed border-slate-700/60 rounded-xl">
                <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No work experience added yet.</p>
                <button onClick={addExperience} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider">
                  Add Your First Job
                </button>
              </div>
            ) : (
              resumeData.experience.map((exp, idx) => (
                <div key={idx} className="bg-slate-900/30 border border-slate-700/80 rounded-xl p-5 relative shadow-inner animate-fadeIn">
                  <button 
                    onClick={() => removeExperience(idx)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelStyle}>Company Name *</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="Google" 
                        value={exp.company || ""}
                        onChange={(e) => updateExperience(idx, "company", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Job Position / Title *</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="Senior Software Engineer" 
                        value={exp.position || ""}
                        onChange={(e) => updateExperience(idx, "position", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className={labelStyle}>Location</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="Mountain View, CA" 
                        value={exp.location || ""}
                        onChange={(e) => updateExperience(idx, "location", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Start Date</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="2022-01" 
                        value={exp.startDate || ""}
                        onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>End Date</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="Present" 
                        value={exp.endDate || ""}
                        onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Experience Description (Bullet Points) */}
                  <div className="mt-4 border-t border-slate-700/40 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className={labelStyle}>Role Overview (Bullet Points)</label>
                      <button 
                        onClick={() => addDescriptionBullet(idx)}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD BULLET
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(!Array.isArray(exp.description) || exp.description.length === 0) && (
                        <div className="text-xs text-slate-500 italic py-2">No role overview bullets added yet.</div>
                      )}
                      {Array.isArray(exp.description) && exp.description.map((descBullet, bIdx) => (
                        <div key={bIdx} className="flex gap-2 items-start relative animate-fadeIn">
                          <textarea 
                            className={`${inputStyle} h-16 flex-1 py-1.5`}
                            placeholder="Describe your overall role, team size, and key responsibilities..."
                            value={descBullet}
                            onChange={(e) => updateDescriptionBullet(idx, bIdx, e.target.value)}
                          />
                          <div className="flex flex-col gap-1.5 pt-1.5">
                            <button 
                              onClick={() => removeDescriptionBullet(idx, bIdx)}
                              title="Delete bullet"
                              className="p-1.5 bg-slate-800 border border-slate-700 text-slate-500 hover:text-red-400 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights (bullet points) */}
                  <div className="mt-4 border-t border-slate-700/40 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className={labelStyle}>Responsibilities & Accomplishments</label>
                      <button 
                        onClick={() => addHighlight(idx)}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD BULLET
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(exp.highlights || []).map((highlight, hIdx) => {
                        const loadingKey = `${idx}-${hIdx}`;
                        const isLoading = aiLoading[loadingKey];
                        return (
                          <div key={hIdx} className="flex gap-2 items-start relative animate-fadeIn">
                            <textarea 
                              className={`${inputStyle} h-16 flex-1 py-1.5`}
                              placeholder="Spearheaded development of backend API scaling capacity..."
                              value={highlight}
                              onChange={(e) => updateHighlight(idx, hIdx, e.target.value)}
                            />
                            
                            <div className="flex flex-col gap-1.5 pt-1.5">
                              <button
                                onClick={() => optimizeBullet(idx, hIdx)}
                                disabled={isLoading}
                                title="Optimize with STAR methodology (AI)"
                                className={`p-1.5 rounded transition-all shadow ${
                                  isLoading 
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                                    : "bg-indigo-900/60 border border-indigo-700/80 text-indigo-300 hover:bg-indigo-800 hover:text-indigo-200"
                                }`}
                              >
                                <Sparkles className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                              </button>
                              <button 
                                onClick={() => removeHighlight(idx, hIdx)}
                                title="Delete bullet"
                                className="p-1.5 bg-slate-800 border border-slate-700 text-slate-500 hover:text-red-400 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. EDUCATION */}
        {activeTab === "education" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5 mb-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Education History</h3>
              <button 
                onClick={addEducation}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold tracking-wide transition-all shadow-md hover:shadow-indigo-500/10"
              >
                <Plus className="w-3.5 h-3.5" /> ADD EDUCATION
              </button>
            </div>

            {resumeData.education.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/20 border border-dashed border-slate-700/60 rounded-xl">
                <GraduationCap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No education records added yet.</p>
              </div>
            ) : (
              resumeData.education.map((edu, idx) => (
                <div key={idx} className="bg-slate-900/30 border border-slate-700/80 rounded-xl p-5 relative shadow-inner animate-fadeIn">
                  <button 
                    onClick={() => removeEducation(idx)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelStyle}>Institution / University *</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="State University" 
                        value={edu.institution || ""}
                        onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Degree / Certification *</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="Bachelor of Science" 
                        value={edu.degree || ""}
                        onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelStyle}>Field of Study</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="Computer Science" 
                        value={edu.fieldOfStudy || ""}
                        onChange={(e) => updateEducation(idx, "fieldOfStudy", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Start Date</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="2018-09" 
                        value={edu.startDate || ""}
                        onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>End Date</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="2021-12" 
                        value={edu.endDate || ""}
                        onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className={labelStyle}>Location</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="Austin, TX" 
                        value={edu.location || ""}
                        onChange={(e) => updateEducation(idx, "location", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>GPA (Optional)</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="3.85 / 4.0" 
                        value={edu.gpa || ""}
                        onChange={(e) => updateEducation(idx, "gpa", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. SKILLS & EXPERTISE */}
        {activeTab === "skills" && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700/60 pb-1.5 mb-2">Skills & Expertise</h3>
            
            <form onSubmit={addSkill} className="flex gap-2">
              <input 
                type="text" 
                className={inputStyle} 
                placeholder="Type a skill and press Enter (e.g. React.js, Python, Project Management)..." 
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
              <button 
                type="submit"
                className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs uppercase tracking-wide transition-all shadow-md"
              >
                ADD
              </button>
            </form>

            <div className="bg-slate-900/30 border border-slate-700/80 rounded-xl p-5 min-h-[150px]">
              <div className="text-xs text-slate-500 font-semibold mb-3 uppercase tracking-wider">Active Skill Tags (Click tag to remove)</div>
              {resumeData.skills.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">No skills added yet. Use the bar above to enter skills.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, idx) => (
                    <button 
                      key={idx}
                      onClick={() => removeSkill(skill)}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-red-950 hover:text-red-300 hover:border-red-800 rounded-md text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      {skill}
                      <span className="text-2xs font-extrabold opacity-60">X</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. PROJECTS */}
        {activeTab === "projects" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5 mb-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Key Projects</h3>
              <button 
                onClick={addProject}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold tracking-wide transition-all shadow-md hover:shadow-indigo-500/10"
              >
                <Plus className="w-3.5 h-3.5" /> ADD PROJECT
              </button>
            </div>

            {resumeData.projects.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/20 border border-dashed border-slate-700/60 rounded-xl">
                <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No project records added yet.</p>
              </div>
            ) : (
              resumeData.projects.map((proj, idx) => (
                <div key={idx} className="bg-slate-900/30 border border-slate-700/80 rounded-xl p-5 relative shadow-inner animate-fadeIn">
                  <button 
                    onClick={() => removeProject(idx)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelStyle}>Project Name *</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="E-Commerce API Service" 
                        value={proj.name || ""}
                        onChange={(e) => updateProject(idx, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Project URL / Repo Link</label>
                      <input 
                        type="text" 
                        className={inputStyle} 
                        placeholder="github.com/myusername/project" 
                        value={proj.url || ""}
                        onChange={(e) => updateProject(idx, "url", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className={labelStyle}>Technologies (Comma-separated)</label>
                    <input 
                      type="text" 
                      className={inputStyle} 
                      placeholder="Node.js, Express, React, MongoDB" 
                      value={(proj.technologies || []).join(", ") || ""}
                      onChange={(e) => updateProject(idx, "technologies", e.target.value)}
                    />
                  </div>

                  {/* Project Description (Bullet Points) */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className={labelStyle}>Project Overview (Bullet Points)</label>
                      <button 
                        onClick={() => addProjectDescBullet(idx)}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD BULLET
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(!Array.isArray(proj.description) || proj.description.length === 0) && (
                        <div className="text-xs text-slate-500 italic py-2">No project overview bullets added yet.</div>
                      )}
                      {Array.isArray(proj.description) && proj.description.map((descBullet, bIdx) => (
                        <div key={bIdx} className="flex gap-2 items-start relative animate-fadeIn">
                          <textarea 
                            className={`${inputStyle} h-16 flex-1 py-1.5`}
                            placeholder="Describe the project purpose, your contributions, and outcomes..."
                            value={descBullet}
                            onChange={(e) => updateProjectDescBullet(idx, bIdx, e.target.value)}
                          />
                          <div className="flex flex-col gap-1.5 pt-1.5">
                            <button 
                              onClick={() => removeProjectDescBullet(idx, bIdx)}
                              title="Delete bullet"
                              className="p-1.5 bg-slate-800 border border-slate-700 text-slate-500 hover:text-red-400 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Highlights (bullet points) */}
                  <div className="mt-4 border-t border-slate-700/40 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className={labelStyle}>Project Highlights & Features</label>
                      <button 
                        onClick={() => addProjectHighlight(idx)}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD BULLET
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(proj.highlights || []).map((highlight, hIdx) => (
                        <div key={hIdx} className="flex gap-2 items-start relative animate-fadeIn">
                          <textarea 
                            className={`${inputStyle} h-16 flex-1 py-1.5`}
                            placeholder="Built a responsive e-commerce platform with real-time inventory tracking..."
                            value={highlight}
                            onChange={(e) => updateProjectHighlight(idx, hIdx, e.target.value)}
                          />
                          
                          <div className="flex flex-col gap-1.5 pt-1.5">
                            <button 
                              onClick={() => removeProjectHighlight(idx, hIdx)}
                              title="Delete bullet"
                              className="p-1.5 bg-slate-800 border border-slate-700 text-slate-500 hover:text-red-400 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 6. CERTIFICATIONS & LANGUAGES */}
        {activeTab === "more" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Certifications Block */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Certifications</h3>
                <button 
                  onClick={addCertification}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded text-2xs font-bold tracking-wide transition-all shadow"
                >
                  <Plus className="w-3 h-3" /> ADD CERT
                </button>
              </div>

              {resumeData.certifications.length === 0 ? (
                <div className="text-center py-4 bg-slate-900/10 border border-dashed border-slate-700/40 rounded-xl text-slate-500 text-xs">
                  No certifications added yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumeData.certifications.map((cert, idx) => (
                    <div key={idx} className="bg-slate-900/30 border border-slate-700/80 rounded-xl p-4 relative animate-fadeIn">
                      <button 
                        onClick={() => removeCertification(idx)}
                        className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-2.5">
                        <div>
                          <label className={labelStyle}>Certification Name *</label>
                          <input 
                            type="text" 
                            className={inputStyle} 
                            placeholder="AWS Certified Solutions Architect" 
                            value={cert.name || ""}
                            onChange={(e) => updateCertification(idx, "name", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelStyle}>Issuer</label>
                            <input 
                              type="text" 
                              className={inputStyle} 
                              placeholder="Amazon Web Services" 
                              value={cert.issuer || ""}
                              onChange={(e) => updateCertification(idx, "issuer", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className={labelStyle}>Date / Year</label>
                            <input 
                              type="text" 
                              className={inputStyle} 
                              placeholder="2024" 
                              value={cert.date || ""}
                              onChange={(e) => updateCertification(idx, "date", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Languages Block */}
            <div className="space-y-4 border-t border-slate-700/40 pt-6">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700/60 pb-1.5">Languages</h3>
              
              <form onSubmit={addLanguage} className="flex gap-2">
                <input 
                  type="text" 
                  className={inputStyle} 
                  placeholder="Enter a language (e.g. English (Native), Spanish (Conversational)) and press Enter..." 
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                />
                <button 
                  type="submit"
                  className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded font-bold text-xs uppercase tracking-wide transition-all shadow"
                >
                  ADD
                </button>
              </form>

              <div className="bg-slate-900/30 border border-slate-700/80 rounded-xl p-4 min-h-[100px]">
                <div className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Active Languages (Click to remove)</div>
                {resumeData.languages.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs">No languages added yet. Use the bar above to enter languages.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {resumeData.languages.map((lang, idx) => (
                      <button 
                        key={idx}
                        onClick={() => removeLanguage(lang)}
                        className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-red-950 hover:text-red-300 hover:border-red-800 rounded-md text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        {lang}
                        <span className="text-2xs font-extrabold opacity-60">X</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
