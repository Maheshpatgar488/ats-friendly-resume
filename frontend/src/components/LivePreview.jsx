import React, { useState } from "react";
import { 
  Download, Settings, FileText, ZoomIn, ZoomOut, RotateCcw, 
  ChevronRight, Sparkles, Sliders, Palette, Type, RefreshCw
} from "lucide-react";
import { ResumeRenderer, templatesList } from "./templates/index";

export default function LivePreview({ resumeData, customStyles, setCustomStyles, onExportBackup, onLoadSampleData, onClearResume }) {
  const [zoom, setZoom] = useState(85); // Default zoom level to see the whole A4 page nicely
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("templates"); // templates | typography | margins

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

  // Size list
  const fontSizes = [
    { label: "Small (9pt)", val: "9pt" },
    { label: "Standard (10pt)", val: "10pt" },
    { label: "Medium (11pt)", val: "11pt" },
    { label: "Large (12pt)", val: "12pt" }
  ];

  // Margins list
  const marginPresets = [
    { name: "Compact (0.35in)", val: { top: "0.35in", bottom: "0.35in", left: "0.35in", right: "0.35in" } },
    { name: "Standard (0.5in)", val: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" } },
    { name: "Wide (0.75in)", val: { top: "0.75in", bottom: "0.75in", left: "0.75in", right: "0.75in" } }
  ];

  // Native Browser PDF Generation (Bulletproof)
  const downloadPDF = () => {
    setPdfLoading(true);
    
    // Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.visibility = 'hidden';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const element = document.getElementById("resume-pdf-content");
    const contentHtml = element.outerHTML;

    // Get all stylesheets from the main document
    let stylesHtml = '';
    for (const styleSheet of document.styleSheets) {
      try {
        if (styleSheet.href) {
          stylesHtml += `<link rel="stylesheet" type="text/css" href="${styleSheet.href}">`;
        } else {
          stylesHtml += `<style>${Array.from(styleSheet.cssRules).map(r => r.cssText).join('')}</style>`;
        }
      } catch (e) {
        // Ignore CORS issues on fonts
      }
    }

    const title = `${resumeData.personalInfo?.fullName?.replace(/\s+/g, '_') || 'Resume'}_ATS_Friendly`;

    // Write content into iframe with strict A4 print rules
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>${title}</title>
          ${stylesHtml}
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            #resume-pdf-content { 
              transform: none !important; 
              box-shadow: none !important; 
              margin: 0 !important; 
              min-height: 0 !important; 
              height: auto !important; 
              width: 100% !important;
              max-width: 100% !important;
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `);
    doc.close();

    // Wait a moment for styles and fonts to apply, then trigger print
    setTimeout(() => {
      const iframeDoc = iframe.contentWindow.document;
      const content = iframeDoc.getElementById("resume-pdf-content");
      // Auto-Scale to Fit Single Page Logic
      if (content) {
        // Since iframe is 210mm wide, scrollHeight represents the true vertical height
        const contentHeight = content.scrollHeight;
        const A4_HEIGHT = 1120; // safe pixel height for A4 at 96dpi
        
        if (contentHeight > A4_HEIGHT) {
          // Calculate exact ratio to shrink the content onto 1 page
          const scaleFactor = (A4_HEIGHT - 20) / contentHeight; // Leave a tiny 20px padding
          
          // Apply scaling (Zoom for Webkit/Blink, Transform for Firefox)
          content.style.zoom = scaleFactor;
          content.style.transform = `scale(${scaleFactor})`;
          content.style.transformOrigin = "top center"; // Keep it centered
          
          // Hardcap to prevent overflow blank pages
          content.style.height = `${A4_HEIGHT}px`;
          content.style.overflow = "hidden";
        }
      }

      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(iframe);
        setPdfLoading(false);
      }, 500);
    }, 800);
  };

  const handleStyleChange = (key, value) => {
    setCustomStyles(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Trigger browser-native print dialog (client-side pathway)
  const printClientSide = () => {
    window.print();
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

        {/* SUBTAB 1: 20 ATS TEMPLATE PRESETS */}
        {activeSubTab === "templates" && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select from 20 ATS templates</label>
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
            {/* Font Size Preset */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Base Font Size (ATS Standard)</label>
              <div className="flex flex-col gap-1.5">
                {fontSizes.map(sz => (
                  <button
                    key={sz.val}
                    onClick={() => handleStyleChange("fontSize", sz.val)}
                    className={`w-full py-2 px-3 text-left rounded border text-xs font-semibold tracking-wide transition-all ${
                      customStyles.fontSize === sz.val
                        ? "bg-slate-700 border-indigo-500 text-indigo-300"
                        : "bg-slate-900/30 border-slate-700/50 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Line Spacing Ratio</label>
              <div className="grid grid-cols-4 gap-1.5">
                {["1.2", "1.4", "1.5", "1.6"].map(lh => (
                  <button
                    key={lh}
                    onClick={() => handleStyleChange("lineHeight", lh)}
                    className={`py-1.5 rounded border text-xs font-semibold tracking-wide transition-all ${
                      customStyles.lineHeight === lh
                        ? "bg-slate-700 border-indigo-500 text-indigo-300"
                        : "bg-slate-900/30 border-slate-700/50 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {lh}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin Presets */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Page Margins Presets</label>
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
            </div>

            {/* Vertical Spacing Presets */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vertical Spacing (Single-Page Fit)</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { name: "Compact Spacing (Single-Page)", sec: "6px", ent: "3px" },
                  { name: "Standard Spacing", sec: "12px", ent: "6px" },
                  { name: "Loose Spacing", sec: "18px", ent: "9px" }
                ].map((sp, i) => {
                  const active = customStyles.sectionSpacing === sp.sec;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        handleStyleChange("sectionSpacing", sp.sec);
                        handleStyleChange("entrySpacing", sp.ent);
                      }}
                      className={`w-full py-2 px-3 text-left rounded border text-xs font-semibold tracking-wide transition-all ${
                        active
                          ? "bg-slate-700 border-indigo-500 text-indigo-300"
                          : "bg-slate-900/30 border-slate-700/50 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {sp.name}
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
        <div className="flex justify-between items-center bg-slate-900/50 px-5 py-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2 select-none">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-2xs text-emerald-400 font-bold uppercase tracking-widest">Real-time previewer</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800/80 rounded-md border border-slate-700 p-0.5 select-none">
              <button 
                onClick={() => setZoom(prev => Math.max(prev - 10, 50))} 
                title="Zoom Out"
                className="p-1 hover:bg-slate-700 text-slate-400 rounded transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-300 px-2 min-w-[40px] text-center">{zoom}%</span>
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

            {/* Direct A4 PDF download button */}
            <button
              onClick={downloadPDF}
              disabled={pdfLoading}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-md shadow-lg transition-all ${
                pdfLoading 
                  ? "bg-slate-700 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/20 active:scale-98"
              }`}
            >
              {pdfLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-slate-950/65 flex justify-center items-start p-8 select-all">
          <div 
            className="resume-preview-container origin-top"
            style={{ 
              transform: `scale(${zoom / 100})`, 
              marginBottom: `${Math.max(0, (zoom / 100) * 297 - 297)}mm` // offsets layout jump
            }}
          >
            <div 
              id="resume-pdf-content" 
              className="bg-white" 
              style={{ width: "210mm", minHeight: "297mm", padding: "0" }}
            >
              {/* Semantic templates mapper compiler */}
              <ResumeRenderer 
                resumeData={resumeData} 
                customStyles={customStyles} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
