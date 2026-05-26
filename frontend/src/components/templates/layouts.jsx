import React from "react";

// ----------------------------------------------------------------------
// COMMON SUB-COMPONENTS — all inline styles for PDF compatibility
// ----------------------------------------------------------------------

const ContactBar = ({ personalInfo, layoutType = "row", color = "#475569" }) => {
  const items = [];

  if (personalInfo.email) {
    items.push(
      <a key="email" href={`mailto:${personalInfo.email}`} style={{ color, textDecoration: "none" }}>
        {personalInfo.email}
      </a>
    );
  }
  if (personalInfo.phone) items.push(<span key="phone">{personalInfo.phone}</span>);
  if (personalInfo.location) items.push(<span key="location">{personalInfo.location}</span>);
  if (personalInfo.website) {
    const href = personalInfo.websiteUrl || (personalInfo.website.startsWith("http") ? personalInfo.website : `https://${personalInfo.website}`);
    items.push(
      <a key="portfolio" href={href} target="_blank" rel="noreferrer" style={{ color, fontWeight: 600, textDecoration: "underline" }}>
        Portfolio: {personalInfo.website}
      </a>
    );
  }
  if (personalInfo.linkedin) {
    const href = personalInfo.linkedinUrl || (personalInfo.linkedin.startsWith("http") ? personalInfo.linkedin : `https://${personalInfo.linkedin}`);
    items.push(
      <a key="linkedin" href={href} target="_blank" rel="noreferrer" style={{ color, fontWeight: 600, textDecoration: "underline" }}>
        {personalInfo.linkedin}
      </a>
    );
  }
  if (personalInfo.github) {
    const href = personalInfo.githubUrl || (personalInfo.github.startsWith("http") ? personalInfo.github : `https://${personalInfo.github}`);
    items.push(
      <a key="github" href={href} target="_blank" rel="noreferrer" style={{ color, fontWeight: 600, textDecoration: "underline" }}>
        {personalInfo.github}
      </a>
    );
  }

  if (layoutType === "col") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px", fontSize: "0.8em", color }}>
        {items.map((item, i) => <div key={i}>{item}</div>)}
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", fontSize: "0.82em", color, marginTop: "5px", lineHeight: "1.6" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "inline-block", margin: "0 6px" }}>
          {i > 0 && <span style={{ marginRight: "6px", color: "#94a3b8" }}>&bull;</span>}
          {item}
        </span>
      ))}
    </div>
  );
};

const SectionHeader = ({ title, primaryColor, borderStyle = "solid" }) => {
  const borderMap = {
    solid: `1px solid #cbd5e1`,
    dashed: `1px dashed #94a3b8`,
    double: `3px double #0f172a`,
    none: "none",
  };

  return (
    <div style={{
      marginTop: "10px",
      marginBottom: "5px",
      paddingBottom: "2px",
      borderBottom: borderMap[borderStyle] || borderMap.solid,
      pageBreakAfter: "avoid",
      breakAfter: "avoid",
    }}>
      <h2 style={{
        fontSize: "0.85em",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: primaryColor,
        margin: 0,
      }}>
        {title}
      </h2>
    </div>
  );
};

// ----------------------------------------------------------------------
// 1. SINGLE COLUMN LAYOUT
// ----------------------------------------------------------------------
export const SingleColumnLayout = ({ resumeData, customStyles, borderStyle = "solid", headerBanner = false }) => {
  const {
    personalInfo = {}, summary = "", experience = [], education = [],
    skills = [], projects = [], certifications = [], languages = []
  } = resumeData;

  const primaryColor = customStyles.primaryColor || "#1e3a8a";
  const secSpacing = customStyles.sectionSpacing || "10px";
  const entSpacing = customStyles.entrySpacing || "6px";

  const fs = {
    name: "20pt",
    contact: "8.5pt",
    sectionTitle: "9.5pt",
    body: "9.5pt",
    entryTitle: "10pt",
    entryMeta: "9pt",
    skill: "8.5pt",
    small: "8.5pt",
  };

  return (
    <div style={{ width: "100%", color: "#1e293b", background: "#fff", fontSize: fs.body, lineHeight: customStyles.lineHeight || "1.4" }}>

      {/* Header */}
      {headerBanner ? (
        <div style={{ textAlign: "center", padding: "14px 20px", backgroundColor: primaryColor, color: "#fff" }}>
          <h1 style={{ fontSize: fs.name, fontWeight: 800, textTransform: "uppercase", margin: 0, color: "#fff", letterSpacing: "-0.3px" }}>
            {personalInfo.fullName || "Your Name"}
          </h1>
          <ContactBar personalInfo={personalInfo} color="#e2e8f0" />
        </div>
      ) : (
        <div style={{ textAlign: "center", paddingBottom: "6px" }}>
          <h1 style={{ fontSize: fs.name, fontWeight: 800, textTransform: "uppercase", margin: 0, color: primaryColor, letterSpacing: "-0.3px" }}>
            {personalInfo.fullName || "Your Name"}
          </h1>
          <ContactBar personalInfo={personalInfo} color="#475569" />
        </div>
      )}

      {/* Body */}
      <div style={{ paddingTop: "2px" }}>

        {/* Summary */}
        {summary && (
          <div style={{ marginBottom: secSpacing }}>
            <SectionHeader title="Professional Summary" primaryColor={primaryColor} borderStyle={borderStyle} />
            <p style={{ color: "#334155", margin: "3px 0 0 0", textAlign: "justify", fontSize: fs.body }}>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div style={{ marginBottom: secSpacing }}>
            <SectionHeader title="Professional Experience" primaryColor={primaryColor} borderStyle={borderStyle} />
            {experience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 700, fontSize: fs.entryTitle, color: "#0f172a" }}>
                  <span>{exp.position}</span>
                  <span style={{ fontWeight: 500, fontSize: fs.entryMeta, color: "#475569", whiteSpace: "nowrap", marginLeft: "8px" }}>{exp.startDate} - {exp.endDate || "Present"}</span>
                </div>
                <div style={{ fontStyle: "italic", color: "#475569", fontSize: fs.entryMeta, marginBottom: "3px" }}>
                  {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                </div>
{(Array.isArray(exp.description) && exp.description.length > 0) && (
                  <ul style={{ margin: "0 0 0 16px", padding: 0, color: "#334155", fontSize: fs.body, marginBottom: "3px" }}>
                    {exp.description.map((d, i) => (
                      <li key={i} style={{ marginBottom: "1px", textAlign: "justify" }}>{d}</li>
                    ))}
                  </ul>
                )}
                <ul style={{ margin: "0 0 0 16px", padding: 0, color: "#334155", fontSize: fs.body }}>
                  {(exp.highlights || []).map((h, i) => (
                    <li key={i} style={{ marginBottom: "1px", textAlign: "justify" }}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div style={{ marginBottom: secSpacing }}>
            <SectionHeader title="Education" primaryColor={primaryColor} borderStyle={borderStyle} />
            {education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: "3px", pageBreakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 700, fontSize: fs.entryTitle, color: "#0f172a" }}>
                  <span>{edu.institution}</span>
                  <span style={{ fontWeight: 500, fontSize: fs.entryMeta, color: "#475569", whiteSpace: "nowrap", marginLeft: "8px" }}>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: fs.entryMeta, color: "#475569" }}>
                  <span>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}{edu.location ? ` | ${edu.location}` : ""}</span>
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{ marginBottom: secSpacing }}>
            <SectionHeader title="Skills & Expertise" primaryColor={primaryColor} borderStyle={borderStyle} />
            <div style={{ marginTop: "4px" }}>
              {skills.map((skill, idx) => (
                <span key={idx} style={{
                  display: "inline-block",
                  margin: "2px 4px 2px 0",
                  padding: "2px 8px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  fontSize: fs.skill,
                  color: "#334155",
                  fontWeight: 500,
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div style={{ marginBottom: secSpacing }}>
            <SectionHeader title="Projects" primaryColor={primaryColor} borderStyle={borderStyle} />
            {projects.map((proj, idx) => (
              <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 700, fontSize: fs.entryTitle, color: "#0f172a" }}>
                  <span>{proj.name}</span>
                  {proj.url && (
                    <a href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: fs.small, fontWeight: 600, color: primaryColor, textDecoration: "underline", marginLeft: "8px", whiteSpace: "nowrap" }}>
                      {proj.url}
                    </a>
                  )}
                </div>
{(Array.isArray(proj.description) && proj.description.length > 0) && (
                  <ul style={{ margin: "2px 0 2px 16px", padding: 0, color: "#334155", fontSize: fs.body }}>
                    {proj.description.map((d, i) => (
                      <li key={i} style={{ marginBottom: "1px", textAlign: "justify" }}>{d}</li>
                    ))}
                  </ul>
                )}
                {proj.technologies?.length > 0 && (
                  <div style={{ fontSize: fs.small, color: "#64748b" }}>
                    <strong>Technologies:</strong> {proj.technologies.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div style={{ marginBottom: secSpacing }}>
            <SectionHeader title="Certifications" primaryColor={primaryColor} borderStyle={borderStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", marginTop: "3px" }}>
              {certifications.map((cert, idx) => (
                <div key={idx} style={{ borderLeft: `2px solid ${primaryColor}`, paddingLeft: "6px", fontSize: fs.body }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{cert.name}</div>
                  <div style={{ color: "#64748b", fontSize: fs.small }}>{cert.issuer} {cert.date ? `(${cert.date})` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div style={{ marginBottom: secSpacing }}>
            <SectionHeader title="Languages" primaryColor={primaryColor} borderStyle={borderStyle} />
            <div style={{ marginTop: "3px" }}>
              {languages.map((lang, idx) => (
                <span key={idx} style={{ display: "inline-block", marginRight: "14px", fontSize: fs.body, fontWeight: 500, color: "#334155" }}>
                  &bull; {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. CENTERED LAYOUT
// ----------------------------------------------------------------------
export const CenteredLayout = ({ resumeData, customStyles, borderStyle = "double" }) => {
  const {
    personalInfo = {}, summary = "", experience = [], education = [],
    skills = [], projects = [], certifications = [], languages = []
  } = resumeData;

  const primaryColor = customStyles.primaryColor || "#0f172a";
  const secSpacing = customStyles.sectionSpacing || "12px";
  const entSpacing = customStyles.entrySpacing || "8px";

  const borderMap = {
    solid: `1px solid #94a3b8`,
    dashed: `1px dashed #94a3b8`,
    double: `3px double #0f172a`,
    none: "none",
  };

  const SectionTitle = ({ title }) => (
    <div style={{ borderBottom: borderMap[borderStyle] || borderMap.solid, marginBottom: "8px", paddingBottom: "3px", marginTop: "12px" }}>
      <h2 style={{ textAlign: "center", fontSize: "0.85em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: primaryColor, margin: 0 }}>{title}</h2>
    </div>
  );

  return (
    <div style={{ width: "100%", color: "#1e293b", background: "#fff", fontSize: customStyles.fontSize || "10pt", lineHeight: customStyles.lineHeight || "1.4" }}>
      <div style={{ textAlign: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
        <h1 style={{ fontSize: "1.6em", fontWeight: 700, textTransform: "uppercase", margin: 0, color: primaryColor }}>{personalInfo.fullName || "Your Name"}</h1>
        <ContactBar personalInfo={personalInfo} color="#475569" />
      </div>

      {summary && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Professional Summary" />
          <p style={{ textAlign: "center", fontStyle: "italic", color: "#475569", margin: "4px 0 0 0", fontSize: "0.92em" }}>{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Professional Experience" />
          {experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95em", color: "#0f172a" }}>
                <span>{exp.position}</span>
                <span style={{ fontWeight: 500, color: "#475569", whiteSpace: "nowrap", marginLeft: "8px" }}>{exp.startDate} - {exp.endDate || "Present"}</span>
              </div>
              <div style={{ fontStyle: "italic", color: "#475569", fontSize: "0.88em", marginBottom: "4px" }}>{exp.company}{exp.location ? ` | ${exp.location}` : ""}</div>
              {(Array.isArray(exp.description) && exp.description.length > 0) && (
                <ul style={{ margin: "0 0 4px 18px", padding: 0, color: "#334155", fontSize: "0.9em" }}>
                  {exp.description.map((d, i) => <li key={i} style={{ marginBottom: "2px" }}>{d}</li>)}
                </ul>
              )}
              <ul style={{ margin: "0 0 0 18px", padding: 0, color: "#334155", fontSize: "0.9em" }}>
                {(exp.highlights || []).map((h, i) => <li key={i} style={{ marginBottom: "2px" }}>{h}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Education" />
          {education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95em", color: "#0f172a" }}>
                <span>{edu.institution}</span>
                <span style={{ fontWeight: 500, color: "#475569", whiteSpace: "nowrap", marginLeft: "8px" }}>{edu.startDate} - {edu.endDate}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88em", color: "#475569" }}>
                <span>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}</span>
                {edu.gpa && <span>GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Skills" />
          <div style={{ textAlign: "center", marginTop: "5px" }}>
            {skills.map((skill, idx) => (
              <span key={idx} style={{ display: "inline-block", margin: "2px 4px", padding: "2px 8px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "9999px", fontSize: "0.85em", color: "#334155" }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Key Projects" />
          {projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: entSpacing }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95em", color: "#0f172a" }}>
                <span>{proj.name}</span>
                {proj.url && <a href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.82em", color: primaryColor, textDecoration: "underline" }}>{proj.url}</a>}
              </div>
              {(Array.isArray(proj.description) && proj.description.length > 0) && (
                <ul style={{ margin: "3px 0 0 18px", padding: 0, color: "#475569", fontSize: "0.9em" }}>
                  {proj.description.map((d, i) => <li key={i} style={{ marginBottom: "2px" }}>{d}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {certifications.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Certifications" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
            {certifications.map((cert, idx) => (
              <div key={idx} style={{ fontSize: "0.88em", textAlign: "center" }}>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{cert.name}</div>
                <div style={{ color: "#64748b" }}>{cert.issuer} {cert.date ? `(${cert.date})` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. SPLIT SIDEBAR LAYOUT
// ----------------------------------------------------------------------
export const SplitSidebarLayout = ({ resumeData, customStyles, sidebarPosition = "left" }) => {
  const {
    personalInfo = {}, summary = "", experience = [], education = [],
    skills = [], projects = [], certifications = [], languages = []
  } = resumeData;

  const primaryColor = customStyles.primaryColor || "#1e3a8a";
  const secSpacing = customStyles.sectionSpacing || "14px";
  const entSpacing = customStyles.entrySpacing || "10px";

  const topPad = customStyles.margins?.top || "0.5in";
  const botPad = customStyles.margins?.bottom || "0.5in";
  const sidePad = customStyles.margins?.left || "0.5in";

  const SideTitle = ({ title }) => (
    <h3 style={{ fontSize: "0.82em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.75)", margin: `0 0 6px 0` }}>{title}</h3>
  );

  const MainTitle = ({ title }) => (
    <div style={{ borderBottom: "1px solid #cbd5e1", marginBottom: "6px", paddingBottom: "3px", marginTop: "10px" }}>
      <h2 style={{ fontSize: "0.85em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: primaryColor, margin: 0 }}>{title}</h2>
    </div>
  );

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: secSpacing }}>
      <div style={{ paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <SideTitle title="Contact" />
        <ContactBar personalInfo={personalInfo} layoutType="col" color="rgba(255,255,255,0.85)" />
      </div>
      {skills.length > 0 && (
        <div>
          <SideTitle title="Skills" />
          <div style={{ fontSize: "0.85em", color: "rgba(255,255,255,0.9)", lineHeight: "1.7" }}>
            {skills.join(" • ")}
          </div>
        </div>
      )}
      {education.length > 0 && (
        <div>
          <SideTitle title="Education" />
          {education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "8px", fontSize: "0.85em", color: "rgba(255,255,255,0.9)" }}>
              <div style={{ fontWeight: 700, color: "#fff" }}>{edu.degree}</div>
              <div style={{ fontStyle: "italic", color: "rgba(255,255,255,0.75)" }}>{edu.institution}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9em" }}>{edu.startDate} - {edu.endDate}</div>
              {edu.gpa && <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9em" }}>GPA: {edu.gpa}</div>}
            </div>
          ))}
        </div>
      )}
      {languages.length > 0 && (
        <div>
          <SideTitle title="Languages" />
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "0.85em", color: "rgba(255,255,255,0.9)" }}>
            {languages.map((lang, idx) => <span key={idx}>&bull; {lang}</span>)}
          </div>
        </div>
      )}
    </div>
  );

  const mainContent = (
    <div>
      <div style={{ borderBottom: `2px solid ${primaryColor}`, paddingBottom: "6px", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "1.5em", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", margin: 0 }}>{personalInfo.fullName || "Your Name"}</h1>
        <p style={{ fontSize: "0.85em", fontStyle: "italic", color: primaryColor, margin: "2px 0 0 0" }}>Professional Profile</p>
      </div>
      {summary && (
        <div style={{ marginBottom: secSpacing }}>
          <MainTitle title="Professional Summary" />
          <p style={{ color: "#334155", margin: "4px 0 0 0", fontSize: "0.9em", textAlign: "justify" }}>{summary}</p>
        </div>
      )}
      {experience.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <MainTitle title="Professional Experience" />
          {experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95em", color: "#0f172a" }}>
                <span>{exp.position}</span>
                <span style={{ fontWeight: 500, color: "#475569", whiteSpace: "nowrap", marginLeft: "8px", fontSize: "0.9em" }}>{exp.startDate} - {exp.endDate || "Present"}</span>
              </div>
              <div style={{ fontStyle: "italic", color: "#475569", fontSize: "0.88em", marginBottom: "4px" }}>{exp.company}{exp.location ? ` | ${exp.location}` : ""}</div>
              {(Array.isArray(exp.description) && exp.description.length > 0) && (
                <ul style={{ margin: "0 0 4px 16px", padding: 0, color: "#334155", fontSize: "0.88em" }}>
                  {exp.description.map((d, i) => <li key={i} style={{ marginBottom: "2px", textAlign: "justify" }}>{d}</li>)}
                </ul>
              )}
              <ul style={{ margin: "0 0 0 16px", padding: 0, color: "#334155", fontSize: "0.88em" }}>
                {(exp.highlights || []).map((h, i) => <li key={i} style={{ marginBottom: "2px", textAlign: "justify" }}>{h}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
      {projects.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <MainTitle title="Projects" />
          {projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95em", color: "#0f172a" }}>
                <span>{proj.name}</span>
                {proj.url && <a href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.82em", color: primaryColor, textDecoration: "underline" }}>{proj.url}</a>}
              </div>
              {(Array.isArray(proj.description) && proj.description.length > 0) && (
                <ul style={{ margin: "3px 0 2px 16px", padding: 0, color: "#334155", fontSize: "0.88em" }}>
                  {proj.description.map((d, i) => <li key={i} style={{ marginBottom: "2px", textAlign: "justify" }}>{d}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {certifications.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <MainTitle title="Certifications" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
            {certifications.map((cert, idx) => (
              <div key={idx} style={{ borderLeft: `2px solid #cbd5e1`, paddingLeft: "6px", fontSize: "0.88em" }}>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{cert.name}</div>
                <div style={{ color: "#64748b" }}>{cert.issuer} {cert.date ? `(${cert.date})` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ width: "100%", display: "table", tableLayout: "fixed", fontSize: customStyles.fontSize || "9.5pt", lineHeight: customStyles.lineHeight || "1.4", background: "#fff" }}>
      {sidebarPosition === "left" ? (
        <div style={{ display: "table-row" }}>
          <div style={{ display: "table-cell", width: "33%", verticalAlign: "top", backgroundColor: primaryColor, padding: `${topPad} 14px ${botPad} ${sidePad}` }}>
            {sidebarContent}
          </div>
          <div style={{ display: "table-cell", width: "67%", verticalAlign: "top", backgroundColor: "#fff", padding: `${topPad} ${sidePad} ${botPad} 18px` }}>
            {mainContent}
          </div>
        </div>
      ) : (
        <div style={{ display: "table-row" }}>
          <div style={{ display: "table-cell", width: "67%", verticalAlign: "top", backgroundColor: "#fff", padding: `${topPad} 18px ${botPad} ${sidePad}` }}>
            {mainContent}
          </div>
          <div style={{ display: "table-cell", width: "33%", verticalAlign: "top", backgroundColor: primaryColor, padding: `${topPad} ${sidePad} ${botPad} 14px` }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </div>
  );
};
