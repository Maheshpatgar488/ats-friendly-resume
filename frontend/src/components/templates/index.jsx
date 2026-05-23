import React from "react";
import { SingleColumnLayout, CenteredLayout, SplitSidebarLayout } from "./layouts";

// Custom font family CSS classes injected into templates wrapper
export const fontStyles = {
  "Inter": "font-sans",
  "Roboto": "font-sans font-light",
  "Outfit": "font-sans tracking-wide",
  "Times New Roman": "font-serif",
  "Georgia": "font-serif",
  "Garamond": "font-serif font-light",
  "Calibri": "font-sans",
  "Arial": "font-sans"
};

// Standard system styles presets for the 20 templates
export const templatesList = [
  { id: "1", name: "Classic Serif", desc: "Traditional academic/serif layout with clean solid dividers.", style: { fontFamily: "Times New Roman", primaryColor: "#1e293b", borderStyle: "solid" } },
  { id: "2", name: "Modern Slate", desc: "Clean, left-aligned, slate gray dividers, Lato-style typography.", style: { fontFamily: "Inter", primaryColor: "#475569", borderStyle: "solid" } },
  { id: "3", name: "Tech Indigo", desc: "Modern developer layout, Indigo accents, high-readability Inter stack.", style: { fontFamily: "Inter", primaryColor: "#3730a3", borderStyle: "solid" } },
  { id: "4", name: "Creative Teal", desc: "Asymmetric split layout with a left sidebar for skills & education.", style: { fontFamily: "Outfit", primaryColor: "#0f766e", borderStyle: "solid" } },
  { id: "5", name: "Executive Corporate", desc: "Centered, formal Times New Roman text with premium double borders.", style: { fontFamily: "Times New Roman", primaryColor: "#0f172a", borderStyle: "double" } },
  { id: "6", name: "Academic CV", desc: "High density Georgia CV, designed for extensive publications/education.", style: { fontFamily: "Georgia", primaryColor: "#000000", borderStyle: "solid" } },
  { id: "7", name: "Minimalist Charcoal", desc: "Compact layout, minimal margins, slate black headers, highly readable.", style: { fontFamily: "Inter", primaryColor: "#1e293b", borderStyle: "none" } },
  { id: "8", name: "Startup Emerald", desc: "Active Roboto typeface, vibrant emerald dividers, tech startup design.", style: { fontFamily: "Roboto", primaryColor: "#047857", borderStyle: "solid" } },
  { id: "9", name: "Bold Left Sidebar", desc: "Split grid columns, sidebar left with active colored headings.", style: { fontFamily: "Inter", primaryColor: "#4f46e5", borderStyle: "solid" } },
  { id: "10", name: "Bold Right Sidebar", desc: "Split grid columns, sidebar right with custom spacing.", style: { fontFamily: "Inter", primaryColor: "#7c3aed", borderStyle: "solid" } },
  { id: "11", name: "Elegant Emerald", desc: "Garamond typeface, deep forest green accents, sophisticated vibe.", style: { fontFamily: "Garamond", primaryColor: "#065f46", borderStyle: "dashed" } },
  { id: "12", name: "Double Column Modern", desc: "Splits experience and skills side-by-side using grid floats.", style: { fontFamily: "Inter", primaryColor: "#1e3a8a", borderStyle: "solid" } },
  { id: "13", name: "Compact Professional", desc: "Ultra-compact Calibri setup, small line spacing, heavy text densities.", style: { fontFamily: "Calibri", primaryColor: "#1e293b", borderStyle: "solid" } },
  { id: "14", name: "High-End Consulting", desc: "Classic navy accent lines, elegant margins, premium Garamond stack.", style: { fontFamily: "Garamond", primaryColor: "#0b2545", borderStyle: "solid" } },
  { id: "15", name: "Tech Startup", desc: "Modern Outfit typeface, rounded badged tags, vibrant violet accents.", style: { fontFamily: "Outfit", primaryColor: "#6d28d9", borderStyle: "solid" } },
  { id: "16", name: "Legal Professional", desc: "Highly strict, classic legal standard layout, black accents only.", style: { fontFamily: "Times New Roman", primaryColor: "#000000", borderStyle: "double" } },
  { id: "17", name: "Medical & Clinical", desc: "Clean sans-serif typography, gentle sky-blue dividers, structured.", style: { fontFamily: "Inter", primaryColor: "#0284c7", borderStyle: "solid" } },
  { id: "18", name: "Bordered Classic", desc: "Elegant, thin borders fully enclosing the resume in A4 page limits.", style: { fontFamily: "Inter", primaryColor: "#1e293b", borderStyle: "solid" } },
  { id: "19", name: "Retail & Service", desc: "Modern Calibri face, warm amber badges for active, friendly customer service.", style: { fontFamily: "Calibri", primaryColor: "#b45309", borderStyle: "solid" } },
  { id: "20", name: "Vibrant Modern", desc: "Vibrant header block banner, slate-dark background banner at top, gold accents.", style: { fontFamily: "Inter", primaryColor: "#0f172a", borderStyle: "solid" } }
];

/**
 * High-fidelity, WYSWYG resume renderer mapping 20 separate template styles to React components.
 */
export function ResumeRenderer({ resumeData, customStyles }) {
  const templateId = customStyles.templateId || "3";
  const primaryColor = customStyles.primaryColor || "#3730a3";
  const fontFamily = customStyles.fontFamily || "Inter";
  
  // Custom font stack class injection
  const fontClass = fontStyles[fontFamily] || "font-sans";

  // Margins conversion to standard tailwind padding
  const marginStyles = {
    paddingTop: customStyles.margins?.top || "0.5in",
    paddingBottom: customStyles.margins?.bottom || "0.5in",
    paddingLeft: customStyles.margins?.left || "0.5in",
    paddingRight: customStyles.margins?.right || "0.5in",
  };

  const tid = parseInt(templateId) || 3;

  // Compile container styles (e.g. template 18 has an outer border)
  const isBordered = tid === 18;
  const isBannerTop = tid === 20;

  let content = null;

  if (tid === 1 || tid === 2 || tid === 3 || tid === 7 || tid === 8 || tid === 11 || tid === 13 || tid === 14 || tid === 15 || tid === 17 || tid === 19) {
    // Single column templates with custom borders/colors
    let bStyle = "solid";
    if (tid === 7) bStyle = "none";
    if (tid === 11) bStyle = "dashed";
    content = (
      <SingleColumnLayout 
        resumeData={resumeData} 
        customStyles={customStyles} 
        borderStyle={bStyle} 
      />
    );
  } else if (tid === 5 || tid === 6 || tid === 16) {
    // Centered templates
    let bStyle = "solid";
    if (tid === 5 || tid === 16) bStyle = "double";
    content = (
      <CenteredLayout 
        resumeData={resumeData} 
        customStyles={customStyles} 
        borderStyle={bStyle} 
      />
    );
  } else if (tid === 4 || tid === 9) {
    // Split layout left sidebars
    content = (
      <SplitSidebarLayout 
        resumeData={resumeData} 
        customStyles={customStyles} 
        sidebarPosition="left" 
      />
    );
  } else if (tid === 10) {
    // Split layout right sidebars
    content = (
      <SplitSidebarLayout 
        resumeData={resumeData} 
        customStyles={customStyles} 
        sidebarPosition="right" 
      />
    );
  } else if (tid === 12) {
    // Double Column Floating Layout
    content = (
      <SingleColumnLayout 
        resumeData={resumeData} 
        customStyles={customStyles} 
        borderStyle="solid" 
      />
    );
  } else if (tid === 20) {
    // Vibrant Banner Top Layout
    content = (
      <SingleColumnLayout 
        resumeData={resumeData} 
        customStyles={customStyles} 
        borderStyle="solid" 
        headerBanner={true} 
      />
    );
  } else if (tid === 18) {
    // Bordered Outline layout
    content = (
      <div className="border border-slate-300 p-4 min-h-[270mm] rounded-sm select-all">
        <SingleColumnLayout 
          resumeData={resumeData} 
          customStyles={customStyles} 
          borderStyle="solid" 
        />
      </div>
    );
  }

  // Wrap in print formatting and custom padding
  return (
    <div 
      className={`w-full bg-white text-slate-800 ${fontClass} leading-normal`}
      style={isBannerTop ? {} : marginStyles}
    >
      {content}
    </div>
  );
}
