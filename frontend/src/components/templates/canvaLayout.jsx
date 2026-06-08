import React from "react";

// ----------------------------------------------------------------------
// 4. CANVA-STYLE PREMIUM LAYOUT (Single Page, Dual-Tone)
// ----------------------------------------------------------------------
export const CanvaLayout = ({ resumeData, customStyles }) => {
  const {
    personalInfo = {}, summary = "", experience = [], education = [],
    skills = [], projects = [], certifications = [], languages = []
  } = resumeData;

  const primaryColor = customStyles.primaryColor || "#3730a3";
  const secSpacing = customStyles.sectionSpacing || "12px";
  const entSpacing = customStyles.entrySpacing || "8px";
  const lineHeight = customStyles.lineHeight || "1.4";
  const bodyFs = customStyles.fontSize || "9.5pt";

  const mTop = customStyles.margins?.top || "0.5in";
  const mBottom = customStyles.margins?.bottom || "0.5in";
  const mLeft = customStyles.margins?.left || "0.5in";
  const mRight = customStyles.margins?.right || "0.5in";

  // Lighten primary color for badges or text backgrounds in the sidebar
  const bgBadge = "rgba(255, 255, 255, 0.15)";

  const SideTitle = ({ title }) => (
    <h3 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255, 255, 255, 0.9)", margin: `0 0 6px 0`, paddingBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
      {title}
    </h3>
  );

  const MainTitle = ({ title }) => (
    <h2 style={{ fontSize: "12pt", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: primaryColor, margin: `0 0 8px 0`, paddingBottom: "2px", borderBottom: `2px solid ${primaryColor}20` }}>
      {title}
    </h2>
  );

  return (
    <div style={{ width: "100%", display: "table", tableLayout: "fixed", fontSize: bodyFs, lineHeight: lineHeight, background: "#fff", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "table-row" }}>
        
        {/* LEFT SIDEBAR (Dual Tone) */}
        <div style={{ display: "table-cell", width: "31%", verticalAlign: "top", backgroundColor: primaryColor, padding: `${mTop} 24px ${mBottom} 24px`, color: "#fff" }}>
          
          {/* Header Info in Sidebar */}
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "20pt", fontWeight: 800, lineHeight: "1.1", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
              {personalInfo.fullName || "Your Name"}
            </h1>
            {personalInfo.title && (
              <div style={{ fontSize: "10pt", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {personalInfo.title}
              </div>
            )}
          </div>

          {/* Contact */}
          <div style={{ marginBottom: secSpacing }}>
            <SideTitle title="Contact" />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "8.5pt", color: "rgba(255,255,255,0.8)" }}>
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
              {personalInfo.linkedin && (
                <a href={personalInfo.linkedinUrl || (personalInfo.linkedin.startsWith("http") ? personalInfo.linkedin : `https://${personalInfo.linkedin}`)} style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontWeight: 500 }}>
                  {personalInfo.linkedin}
                </a>
              )}
              {personalInfo.website && (
                <a href={personalInfo.websiteUrl || (personalInfo.website.startsWith("http") ? personalInfo.website : `https://${personalInfo.website}`)} style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontWeight: 500 }}>
                  {personalInfo.website}
                </a>
              )}
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ marginBottom: secSpacing }}>
              <SideTitle title="Expertise" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "4px" }}>
                {skills.map((s, i) => (
                  <span key={i} style={{ backgroundColor: bgBadge, padding: "3px 8px", borderRadius: "12px", fontSize: "8pt", fontWeight: 500, color: "#fff" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div style={{ marginBottom: secSpacing }}>
              <SideTitle title="Education" />
              {education.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: "8px", fontSize: "8.5pt" }}>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: "9pt" }}>{edu.degree}</div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}>{edu.institution}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)" }}>{edu.startDate} - {edu.endDate}</div>
                  {edu.gpa && <div style={{ color: "rgba(255,255,255,0.6)" }}>GPA: {edu.gpa}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div style={{ marginBottom: secSpacing }}>
              <SideTitle title="Certifications" />
              {certifications.map((cert, idx) => (
                <div key={idx} style={{ marginBottom: "6px", fontSize: "8.5pt" }}>
                  <div style={{ fontWeight: 700, color: "#fff" }}>{cert.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.7)" }}>{cert.issuer}</div>
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div style={{ marginBottom: secSpacing }}>
              <SideTitle title="Languages" />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "8.5pt", color: "rgba(255,255,255,0.8)" }}>
                {languages.map((lang, idx) => <span key={idx}>&bull; {lang}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT MAIN CONTENT (White Background) */}
        <div style={{ display: "table-cell", width: "69%", verticalAlign: "top", backgroundColor: "#fff", padding: `${mTop} 32px ${mBottom} 32px`, color: "#1e293b" }}>
          
          {/* Summary */}
          {summary && (
            <div style={{ marginBottom: secSpacing }}>
              <MainTitle title="Profile" />
              <div style={{ fontSize: "9.5pt", color: "#475569", textAlign: "justify" }}>{summary}</div>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div style={{ marginBottom: secSpacing }}>
              <MainTitle title="Experience" />
              {experience.map((exp, idx) => (
                <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "10pt", fontWeight: 700, color: "#0f172a" }}>{exp.position || exp.title}</div>
                    <div style={{ fontSize: "8.5pt", fontWeight: 600, color: primaryColor, whiteSpace: "nowrap", marginLeft: "8px" }}>
                      {exp.startDate} - {exp.endDate || "Present"}
                    </div>
                  </div>
                  <div style={{ fontSize: "9pt", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                    {exp.company} {exp.location ? `| ${exp.location}` : ""}
                  </div>
                  {(Array.isArray(exp.description) && exp.description.length > 0) && (
                    <ul style={{ margin: "2px 0 0 14px", padding: 0, listStyleType: "disc", color: "#475569", fontSize: "9pt" }}>
                      {exp.description.map((d, i) => (
                        <li key={i} style={{ marginBottom: "3px", textAlign: "justify" }}>{d}</li>
                      ))}
                    </ul>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul style={{ margin: "2px 0 0 14px", padding: 0, listStyleType: "disc", color: "#475569", fontSize: "9pt" }}>
                      {exp.highlights.map((h, i) => (
                        <li key={i} style={{ marginBottom: "3px", textAlign: "justify" }}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div style={{ marginBottom: secSpacing }}>
              <MainTitle title="Projects" />
              {projects.map((proj, idx) => (
                <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "10pt", fontWeight: 700, color: "#0f172a" }}>{proj.name}</div>
                    {proj.url && (
                      <a href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`} target="_blank" rel="noreferrer" style={{ fontSize: "8.5pt", color: primaryColor, textDecoration: "underline", fontWeight: 500 }}>
                        {proj.url}
                      </a>
                    )}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={{ fontSize: "8pt", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>
                      Tech: {proj.technologies.join(", ")}
                    </div>
                  )}
                  {(Array.isArray(proj.description) && proj.description.length > 0) && (
                    <ul style={{ margin: "2px 0 0 14px", padding: 0, listStyleType: "disc", color: "#475569", fontSize: "9pt" }}>
                      {proj.description.map((d, i) => (
                        <li key={i} style={{ marginBottom: "3px", textAlign: "justify" }}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
