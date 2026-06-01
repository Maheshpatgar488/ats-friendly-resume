import React from "react";

// ----------------------------------------------------------------------
// 4. CANVA-STYLE PREMIUM LAYOUT
// ----------------------------------------------------------------------
export const CanvaLayout = ({ resumeData, customStyles }) => {
  const {
    personalInfo = {}, summary = "", experience = [], education = [],
    skills = [], projects = [], certifications = [], languages = []
  } = resumeData;
  const primaryColor = customStyles.primaryColor || "#3730a3";

  return (
    <div style={{ padding: "0.4em", fontFamily: "Outfit, sans-serif", color: "#1e293b", background: "#ffffff", height: "100%", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: "1.2em" }}>
        <h1 style={{ fontSize: "2.2em", color: "#0f172a", fontWeight: 800, letterSpacing: "-0.5px", margin: 0, paddingBottom: "2px" }}>
          {personalInfo.fullName || "Your Name"}
        </h1>
        {personalInfo.title && (
          <div style={{ fontSize: "0.85em", color: primaryColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", margin: "4px 0 8px 0" }}>
            {personalInfo.title}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", fontSize: "0.75em", color: "#64748b", flexWrap: "wrap", marginTop: "4px" }}>
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>&bull; {personalInfo.phone}</span>}
          {personalInfo.location && <span>&bull; {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>&bull; {personalInfo.linkedin}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: "2em" }}>
        {/* Left Column */}
        <div style={{ flex: "2 1 0" }}>
          {summary && (
            <div style={{ marginBottom: "1.2em" }}>
              <h2 style={{ fontSize: "0.9em", color: primaryColor, borderBottom: "2px solid #e2e8f0", paddingBottom: "4px", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Profile</h2>
              <div style={{ fontSize: "0.75em", lineHeight: 1.6, color: "#334155" }}>{summary}</div>
            </div>
          )}

          {experience.length > 0 && (
            <div style={{ marginBottom: "1.2em" }}>
              <h2 style={{ fontSize: "0.9em", color: primaryColor, borderBottom: "2px solid #e2e8f0", paddingBottom: "4px", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Experience</h2>
              {experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: "1em" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "0.85em", fontWeight: 700, color: "#0f172a" }}>{exp.title}</div>
                    <div style={{ fontSize: "0.75em", color: primaryColor, fontWeight: 600 }}>{exp.startDate} - {exp.endDate}</div>
                  </div>
                  <div style={{ fontSize: "0.75em", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
                    {exp.company} {exp.location ? `| ${exp.location}` : ""}
                  </div>
                  {Array.isArray(exp.description) && (
                    <ul style={{ paddingLeft: "1.2em", margin: 0, fontSize: "0.75em", color: "#475569", lineHeight: 1.5 }}>
                      {exp.description.filter(Boolean).map((d, idx) => <li key={idx} style={{ marginBottom: "3px" }}>{d}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div style={{ marginBottom: "1.2em" }}>
              <h2 style={{ fontSize: "0.9em", color: primaryColor, borderBottom: "2px solid #e2e8f0", paddingBottom: "4px", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Projects</h2>
              {projects.map((proj, i) => (
                <div key={i} style={{ marginBottom: "1em" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "0.85em", fontWeight: 700, color: "#0f172a" }}>{proj.name}</div>
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={{ fontSize: "0.7em", color: "#64748b", marginBottom: "4px" }}>Tech: {proj.technologies.join(", ")}</div>
                  )}
                  {Array.isArray(proj.description) && (
                    <ul style={{ paddingLeft: "1.2em", margin: 0, fontSize: "0.75em", color: "#475569", lineHeight: 1.5 }}>
                      {proj.description.filter(Boolean).map((d, idx) => <li key={idx} style={{ marginBottom: "3px" }}>{d}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ flex: "1 1 0" }}>
          {skills.length > 0 && (
            <div style={{ marginBottom: "1.2em" }}>
              <h2 style={{ fontSize: "0.9em", color: primaryColor, borderBottom: "2px solid #e2e8f0", paddingBottom: "4px", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Expertise</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {skills.map((s, i) => (
                  <span key={i} style={{ backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "3px 8px", fontWeight: 500, fontSize: "0.7em" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div style={{ marginBottom: "1.2em" }}>
              <h2 style={{ fontSize: "0.9em", color: primaryColor, borderBottom: "2px solid #e2e8f0", paddingBottom: "4px", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Education</h2>
              {education.map((edu, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "0.8em", fontWeight: 700, color: "#0f172a" }}>{edu.degree}</div>
                  <div style={{ fontSize: "0.75em", color: "#64748b" }}>{edu.institution}</div>
                  <div style={{ fontSize: "0.7em", color: "#94a3b8" }}>{edu.startDate} - {edu.endDate}</div>
                </div>
              ))}
            </div>
          )}
          
          {certifications.length > 0 && (
            <div style={{ marginBottom: "1.2em" }}>
              <h2 style={{ fontSize: "0.9em", color: primaryColor, borderBottom: "2px solid #e2e8f0", paddingBottom: "4px", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Certifications</h2>
              {certifications.map((cert, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "0.8em", fontWeight: 700, color: "#0f172a" }}>{cert.name}</div>
                  <div style={{ fontSize: "0.75em", color: "#64748b" }}>{cert.issuer}</div>
                </div>
              ))}
            </div>
          )}

          {languages.length > 0 && (
            <div style={{ marginBottom: "1.2em" }}>
              <h2 style={{ fontSize: "0.9em", color: primaryColor, borderBottom: "2px solid #e2e8f0", paddingBottom: "4px", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Languages</h2>
              <ul style={{ paddingLeft: "1.2em", margin: 0, fontSize: "0.75em", color: "#475569" }}>
                {languages.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
