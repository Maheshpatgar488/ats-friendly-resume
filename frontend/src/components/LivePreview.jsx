import { useState } from "react";
import { 
  Download, Settings, FileText, ZoomIn, ZoomOut, RotateCcw, 
  Sliders, Palette, RefreshCw
} from "lucide-react";
import { ResumeRenderer, templatesList } from "./templates/index";
import { API_URL } from "../config";

export default function LivePreview({ resumeData, customStyles, setCustomStyles, onExportBackup, onLoadSampleData, onClearResume }) {
  const [zoom, setZoom] = useState(85);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("templates");
  const [previewHeight, setPreviewHeight] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  // A4 page height in pixels at 96dpi = 297mm = ~1123px
  // Calculate pages based on actual content height (not minHeight)
  const A4_PX = 1123;
  const estimatedPages = previewHeight > 0 ? Math.ceil(previewHeight / A4_PX) : 1;
  const fitsOnePage = estimatedPages <= 1;

  // Curated color palette
  const colors = [
    { name: "Navy", hex: "#1e3a8a" },
    { name: "Indigo", hex: "#3730a3" },
    { name: "Emerald", hex: "#065f46" },
    { name: "Violet", hex: "#6d28d9" },
    { name: "Charcoal", hex: "#1e293b" },
    { name: "Amber", hex: "#9a3412" },
    { name: "Crimson", hex: "#991b1b" },
    { name: "Pitch Black", hex: "#000000" }
  ];

  // Fonts list
  const fonts = ["Inter", "Roboto", "Outfit", "Times New Roman", "Georgia", "Garamond", "Calibri", "Arial"];

  // Margins list
  const marginPresets = [
    { name: "Compact (0.35in)", val: { top: "0.35in", bottom: "0.35in", left: "0.35in", right: "0.35in" } },
    { name: "Standard (0.5in)", val: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" } },
    { name: "Wide (0.75in)", val: { top: "0.75in", bottom: "0.75in", left: "0.75in", right: "0.75in" } }
  ];

  // Native Browser PDF Generation (Bulletproof)
  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          templateId: customStyles.templateId || "3",
          customStyles,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "PDF generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.personalInfo?.fullName?.replace(/\s+/g, "_") || "Resume"}_ATS_Friendly.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error:", error);
      alert("PDF generation failed: " + error.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadDOCX = async () => {
    setDocxLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/export-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "DOCX generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.personalInfo?.fullName?.replace(/\s+/g, "_") || "Resume"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("DOCX download error:", error);
      alert("DOCX generation failed: " + error.message);
    } finally {
      setDocxLoading(false);
    }
  };

  const handleStyleChange = (key, value) => {
    setCustomStyles(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const subTabClass = (id) => `flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${
    activeSubTab === id 
      ? "bg-slate-700 text-slate-100 border border-slate-600 shadow-md" 
      : "text-slate-400 hover:text-slate-200"
  }`;

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full animate-fadeIn select-none">
      
      {/* 1. LAYOUT & STYLE CUSTOMIZATION SIDE PANEL */}
      <div className="w-full xl:w-80 flex flex-col bg-slate-800/60 backdrop-blur-md border border-slate-700/80 rounded-xl p-5 shadow-xl select-none xl:h-[calc(100vh-250px)] overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3 mb-4">
          <Settings className="w-5 h-5 text-indigo-400 animate-spin-slow" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Customize Design</h2>
        </div>

        {/* Customization Subtabs */}
        <div className="flex gap-1.5 bg-slate-900/40 p-1 rounded-lg mb-4 border border-slate-700/30">
          <button onClick={() => setActiveSubTab("templates")} className={subTabClass("templates")}>
            <FileText className="w-3.5 h-3.5" /> Presets
          </button>
          <button onClick={() => setActiveSubTab("typography")} className={subTabClass("typography")}>
            <Palette className="w-3.5 h-3.5" /> Colors & Font
          </button>
          <button onClick={() => setActiveSubTab("margins")} className={subTabClass("margins")}>
            <Sliders className="w-3.5 h-3.5" /> Page
          </button>
        </div>

        {/* SUBTAB 1: 21 ATS TEMPLATE PRESETS */}
        {activeSubTab === "templates" && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select from 21 ATS templates</label>
            <div className="space-y-2 max-h-[400px] xl:max-h-none overflow-y-auto">
              {templatesList.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    handleStyleChange("templateId", t.id);
                    handleStyleChange("fontFamily", t.style.fontFamily);
                    handleStyleChange("primaryColor", t.style.primaryColor);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    customStyles.templateId === t.id
                      ? "bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/30"
                      : "bg-slate-900/30 border-slate-700/50 hover:bg-slate-900/55 hover:border-slate-600/80"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-200">{t.name}</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">ID {t.id}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 2: TYPOGRAPHY AND ACCENT COLORS */}
        {activeSubTab === "typography" && (
          <div className="space-y-5 animate-fadeIn">
            {/* Primary Accent Color */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Accent Theme Color</label>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleStyleChange("primaryColor", c.hex)}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    className={`h-8 w-full rounded border-2 transition-all ${
                      customStyles.primaryColor === c.hex 
                        ? "border-white scale-105 shadow-lg shadow-white/10" 
                        : "border-slate-800/80 hover:scale-102"
                    }`}
                  />
                ))}
              </div>
              
              {/* Hex input */}
              <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-500 font-bold uppercase">Custom:</span>
                <input 
                  type="text" 
                  value={customStyles.primaryColor}
                  onChange={(e) => handleStyleChange("primaryColor", e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs w-28 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Font Family Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Typography Font Stack</label>
              <div className="grid grid-cols-2 gap-1.5">
                {fonts.map(font => (
                  <button
                    key={font}
                    onClick={() => handleStyleChange("fontFamily", font)}
                    className={`px-3 py-2 rounded text-left border text-xs font-semibold tracking-wide transition-all ${
                      customStyles.fontFamily === font
                        ? "bg-slate-700 border-indigo-500 text-indigo-300"
                        : "bg-slate-900/30 border-slate-700/50 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: MARGINS, SIZES, AND LINE HEIGHT */}
        {activeSubTab === "margins" && (
          <div className="space-y-5 animate-fadeIn">

            {/* Font Size Stepper */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Font Size</label>
              <p className="text-[9px] text-slate-500 mb-2">Affects all body text, bullet points, and descriptions</p>
              <div className="flex items-center gap-2 bg-slate-900/40 rounded-lg border border-slate-700/50 p-1">
                <button
                  onClick={() => {
                    const cur = parseFloat(customStyles.fontSize) || 10;
                    const next = Math.max(7, cur - 0.5);
                    handleStyleChange("fontSize", `${next}pt`);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-lg transition-colors"
                >−</button>
                <span className="flex-1 text-center text-sm font-bold text-indigo-300 font-mono">{customStyles.fontSize || "10pt"}</span>
                <button
                  onClick={() => {
                    const cur = parseFloat(customStyles.fontSize) || 10;
                    const next = Math.min(14, cur + 0.5);
                    handleStyleChange("fontSize", `${next}pt`);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-lg transition-colors"
                >+</button>
              </div>
              {/* Quick presets */}
              <div className="grid grid-cols-4 gap-1 mt-2">
                {["8pt","9pt","10pt","11pt","12pt","13pt"].map(sz => (
                  <button
                    key={sz}
                    onClick={() => handleStyleChange("fontSize", sz)}
                    className={`py-1 rounded border text-[10px] font-bold transition-all ${
                      customStyles.fontSize === sz
                        ? "bg-indigo-700 border-indigo-500 text-white"
                        : "bg-slate-900/30 border-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                  >{sz}</button>
                ))}
              </div>
            </div>

            {/* Line Height Stepper */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Line Spacing</label>
              <p className="text-[9px] text-slate-500 mb-2">Space between lines of text — lower = more content fits</p>
              <div className="flex items-center gap-2 bg-slate-900/40 rounded-lg border border-slate-700/50 p-1">
                <button
                  onClick={() => {
                    const cur = parseFloat(customStyles.lineHeight) || 1.4;
                    const next = Math.max(1.0, Math.round((cur - 0.05) * 100) / 100);
                    handleStyleChange("lineHeight", `${next}`);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-lg transition-colors"
                >−</button>
                <span className="flex-1 text-center text-sm font-bold text-indigo-300 font-mono">{customStyles.lineHeight || "1.4"}</span>
                <button
                  onClick={() => {
                    const cur = parseFloat(customStyles.lineHeight) || 1.4;
                    const next = Math.min(2.0, Math.round((cur + 0.05) * 100) / 100);
                    handleStyleChange("lineHeight", `${next}`);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-lg transition-colors"
                >+</button>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2">
                {["1.2","1.3","1.4","1.5"].map(lh => (
                  <button
                    key={lh}
                    onClick={() => handleStyleChange("lineHeight", lh)}
                    className={`py-1 rounded border text-[10px] font-bold transition-all ${
                      customStyles.lineHeight === lh
                        ? "bg-indigo-700 border-indigo-500 text-white"
                        : "bg-slate-900/30 border-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                  >{lh}</button>
                ))}
              </div>
            </div>

            {/* Section Spacing Stepper */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Section Spacing</label>
              <p className="text-[9px] text-slate-500 mb-2">Gap between sections (Experience, Education, Skills…)</p>
              <div className="flex items-center gap-2 bg-slate-900/40 rounded-lg border border-slate-700/50 p-1">
                <button
                  onClick={() => {
                    const cur = parseInt(customStyles.sectionSpacing) || 10;
                    const next = Math.max(2, cur - 2);
                    handleStyleChange("sectionSpacing", `${next}px`);
                    handleStyleChange("entrySpacing", `${Math.max(2, next - 2)}px`);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-lg transition-colors"
                >−</button>
                <span className="flex-1 text-center text-sm font-bold text-indigo-300 font-mono">{customStyles.sectionSpacing || "10px"}</span>
                <button
                  onClick={() => {
                    const cur = parseInt(customStyles.sectionSpacing) || 10;
                    const next = Math.min(32, cur + 2);
                    handleStyleChange("sectionSpacing", `${next}px`);
                    handleStyleChange("entrySpacing", `${Math.max(2, next - 2)}px`);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-lg transition-colors"
                >+</button>
              </div>
            </div>

            {/* Margin Presets */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Page Margins</label>
              <div className="flex flex-col gap-1.5">
                {marginPresets.map((mp, i) => {
                  const active = JSON.stringify(customStyles.margins) === JSON.stringify(mp.val);
                  return (
                    <button
                      key={i}
                      onClick={() => handleStyleChange("margins", mp.val)}
                      className={`w-full py-2 px-3 text-left rounded border text-xs font-semibold tracking-wide transition-all ${
                        active
                          ? "bg-slate-700 border-indigo-500 text-indigo-300"
                          : "bg-slate-900/30 border-slate-700/50 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {mp.name}
                    </button>
                  );
                })}
              </div>
              {/* Custom margin sliders */}
              <div className="mt-3 pt-3 border-t border-slate-700/40">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Custom Margins</label>
                <div className="space-y-2">
                  {["top", "bottom", "left", "right"].map(dir => {
                    const cur = customStyles.margins?.[dir] || "0.5in";
                    const curVal = parseFloat(cur) || 0.5;
                    const label = dir === "top" ? "Top" : dir === "bottom" ? "Bottom" : dir === "left" ? "Left" : "Right";
                    return (
                      <div key={dir} className="flex items-center gap-2 bg-slate-900/40 rounded-lg border border-slate-700/50 p-1">
                        <span className="w-12 text-[10px] font-bold text-slate-400 uppercase">{label}</span>
                        <button
                          onClick={() => {
                            const next = Math.max(0.1, Math.round((curVal - 0.05) * 100) / 100);
                            const newMargins = { ...(customStyles.margins || { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" }), [dir]: `${next.toFixed(2)}in` };
                            handleStyleChange("margins", newMargins);
                          }}
                          className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-base transition-colors"
                        >−</button>
                        <span className="flex-1 text-center text-xs font-bold text-indigo-300 font-mono">{cur}</span>
                        <button
                          onClick={() => {
                            const next = Math.min(1.0, Math.round((curVal + 0.05) * 100) / 100);
                            const newMargins = { ...(customStyles.margins || { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" }), [dir]: `${next.toFixed(2)}in` };
                            handleStyleChange("margins", newMargins);
                          }}
                          className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-base transition-colors"
                        >+</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Fit Presets */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Fit Presets</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { name: "Fit to 1 Page", sec: "6px", ent: "4px", fs: "9pt", lh: "1.2" },
                  { name: "Compact", sec: "10px", ent: "6px", fs: "9.5pt", lh: "1.3" },
                  { name: "Standard", sec: "14px", ent: "8px", fs: "10pt", lh: "1.4" },
                  { name: "Spacious", sec: "20px", ent: "12px", fs: "11pt", lh: "1.5" }
                ].map((sp, i) => {
                  const active = customStyles.sectionSpacing === sp.sec && customStyles.fontSize === sp.fs;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        handleStyleChange("sectionSpacing", sp.sec);
                        handleStyleChange("entrySpacing", sp.ent);
                        handleStyleChange("fontSize", sp.fs);
                        handleStyleChange("lineHeight", sp.lh);
                      }}
                      className={`w-full py-2 px-3 text-left rounded border text-xs font-semibold tracking-wide transition-all ${
                        active
                          ? "bg-slate-700 border-indigo-500 text-indigo-300"
                          : "bg-slate-900/30 border-slate-700/50 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {sp.name} <span className="text-slate-500 font-normal">({sp.fs}, {sp.lh} lh)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Global actions */}
        <div className="border-t border-slate-700/40 pt-4 mt-6 space-y-2 text-center select-none">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Onboarding Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onLoadSampleData}
              className="px-2.5 py-1.5 bg-slate-900/30 border border-slate-700 hover:bg-slate-800 text-[10px] font-bold text-indigo-300 rounded uppercase tracking-wider transition-colors"
            >
              Reset Sample
            </button>
            <button
              onClick={onClearResume}
              className="px-2.5 py-1.5 bg-slate-900/30 border border-slate-700 hover:bg-red-950/30 hover:border-red-900 hover:text-red-300 text-[10px] font-bold text-slate-400 rounded uppercase tracking-wider transition-colors"
            >
              Empty Slate
            </button>
          </div>
          <button
            onClick={onExportBackup}
            className="w-full mt-1.5 text-center text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest"
          >
            Export Backup (JSON)
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME PREVIEW WORKSPACE */}
      <div className="flex-1 flex flex-col bg-slate-800/30 rounded-xl border border-slate-700/60 overflow-hidden shadow-2xl h-full xl:max-h-[calc(100vh-250px)]">
        {/* Preview Actions bar */}
        <div className="flex flex-wrap justify-between items-center bg-slate-900/50 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-700/80 gap-2">
          <div className="flex items-center gap-2 select-none flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-2xs text-emerald-400 font-bold uppercase tracking-widest hidden sm:inline">Real-time previewer</span>
            <span className="text-2xs text-emerald-400 font-bold uppercase tracking-widest sm:hidden">Preview</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800/80 rounded-md border border-slate-700 p-0.5 select-none">
              <button 
                onClick={() => setZoom(prev => Math.max(prev - 10, 50))} 
                title="Zoom Out"
                className="p-1 hover:bg-slate-700 text-slate-400 rounded transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-300 px-1 sm:px-2 min-w-[35px] sm:min-w-[40px] text-center">{zoom}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(prev + 10, 150))} 
                title="Zoom In"
                className="p-1 hover:bg-slate-700 text-slate-400 rounded transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setZoom(85)} 
                title="Reset Zoom"
                className="p-1 hover:bg-slate-700 text-slate-400 rounded border-l border-slate-700/50 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={downloadPDF}
                disabled={pdfLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300 group ${
                  pdfLoading 
                    ? "bg-slate-700 cursor-not-allowed border-slate-600" 
                    : "bg-slate-800 hover:bg-slate-700 border-slate-600 hover:border-indigo-500/50"
                }`}
              >
                {pdfLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                )}
                <span className="font-semibold text-[13px] tracking-wide text-white uppercase flex items-center gap-2">
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </span>
              </button>
              
              <button 
                onClick={downloadDOCX}
                disabled={docxLoading}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg
                  bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500
                  border border-blue-500/30 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]
                  transition-all duration-300 group
                  ${docxLoading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}
                `}
                title="Download DOCX"
              >
                {docxLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
                  <Download className="w-4 h-4 text-blue-300 group-hover:text-blue-200 transition-colors" />
                )}
                <span className="font-semibold text-[13px] tracking-wide text-white uppercase flex items-center gap-2">
                  <span className="hidden sm:inline">Download DOCX</span>
                  <span className="sm:hidden">DOCX</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-slate-950/65 flex justify-center items-start p-2 sm:p-4 md:p-8 select-all">
          <div 
            className="resume-preview-container origin-top relative max-w-full"
            style={{ 
              transform: `scale(${zoom / 100})`, 
              transformOrigin: "top center",
              marginBottom: `${Math.max(0, (zoom / 100 - 1) * 297)}mm`
            }}
          >
            {/* Page count overlay */}
            <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider select-none pointer-events-none ${
              fitsOnePage 
                ? "bg-emerald-600/90 text-white" 
                : "bg-red-600/90 text-white"
            }`} style={{ position: "absolute" }}>
              {fitsOnePage ? "✓ 1 Page" : `⚠ ~${estimatedPages} Pages — reduce font/spacing`}
            </div>
            <div 
              id="resume-pdf-content" 
              className="bg-white shadow-2xl max-w-full"
              style={{ width: "210mm", minHeight: "297mm", padding: "0", boxSizing: "border-box" }}
              ref={(el) => {
                if (el) {
                  // Measure the actual content height, not the container with minHeight
                  const measureHeight = () => {
                    const inner = el.firstElementChild;
                    if (inner) {
                      // Get the actual rendered height of the content
                      const rect = inner.getBoundingClientRect();
                      setPreviewHeight(rect.height);
                    }
                  };
                  
                  const observer = new ResizeObserver(measureHeight);
                  observer.observe(el);
                  if (el.firstElementChild) {
                    observer.observe(el.firstElementChild);
                  }
                  
                  // Initial measurement
                  measureHeight();
                }
              }}
            >
              {/* Semantic templates mapper compiler */}
              <ResumeRenderer 
                resumeData={resumeData} 
                customStyles={customStyles} 
              />
            </div>
          </div>
        </div>
        {/* DEBUG: shows current resumeData highlights for verification */}
        <div className="mt-2 flex justify-center">
          <button onClick={() => setShowDebug(d => !d)} className="text-[9px] text-slate-600 hover:text-slate-400 underline">
            {showDebug ? "Hide" : "Show"} data debug
          </button>
        </div>
        {showDebug && (
          <div className="mt-1 mx-auto max-w-lg bg-slate-900 border border-slate-700 rounded p-2 text-[9px] font-mono text-slate-400 overflow-auto max-h-40">
            <div className="text-[8px] text-indigo-400 uppercase font-bold mb-1">Preview resumeData highlights[0]:</div>
            {resumeData.experience?.map((e, i) => (
              <div key={i} className="mb-1 border-b border-slate-800 pb-1 last:border-0">
                <span className="text-slate-300">{e.company}: </span>
                <span>{(e.highlights?.[0] || "(empty)").slice(0, 100)}</span>
              </div>
            ))}
            <div className="text-[8px] text-indigo-400 uppercase font-bold mt-2 mb-1">sectionSpacing:</div>
            <span>{customStyles.sectionSpacing} | entrySpacing: {customStyles.entrySpacing}</span>
          </div>
        )}
      </div>
    </div>
  );
}
