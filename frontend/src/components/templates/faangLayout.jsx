import React from "react";

const ContactBar = ({ personalInfo, color = "#000" }) => {
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
      <a key="portfolio" href={href} target="_blank" rel="noreferrer" style={{ color, fontWeight: 500, textDecoration: "underline" }}>
        {personalInfo.website}
      </a>
    );
  }
  if (personalInfo.linkedin) {
    const href = personalInfo.linkedinUrl || (personalInfo.linkedin.startsWith("http") ? personalInfo.linkedin : `https://${personalInfo.linkedin}`);
    items.push(
      <a key="linkedin" href={href} target="_blank" rel="noreferrer" style={{ color, fontWeight: 500, textDecoration: "underline" }}>
        {personalInfo.linkedin}
      </a>
    );
  }
  if (personalInfo.github) {
    const href = personalInfo.githubUrl || (personalInfo.github.startsWith("http") ? personalInfo.github : `https://${personalInfo.github}`);
    items.push(
      <a key="github" href={href} target="_blank" rel="noreferrer" style={{ color, fontWeight: 500, textDecoration: "underline" }}>
        {personalInfo.github}
      </a>
    );
  }

  return (
    <div style={{ textAlign: "center", fontSize: "0.95em", color, marginTop: "4px", lineHeight: "1.4" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "inline-block", margin: "0 6px" }}>
          {i > 0 && <span style={{ marginRight: "6px", color: "#000" }}>|</span>}
          {item}
        </span>
      ))}
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. FAANG ATS SINGLE PAGE LAYOUT
// ----------------------------------------------------------------------
export const FaangLayout = ({ resumeData, customStyles }) => {
  const {
    personalInfo = {}, summary = "", experience = [], education = [],
    skills = [], projects = [], certifications = []
  } = resumeData;

  const fs = {
    name: "18pt",
    contact: "9.5pt",
    sectionTitle: "11pt",
    body: "9.5pt",
    entryTitle: "9.5pt",
    entryMeta: "9.5pt"
  };

  const secSpacing = customStyles.sectionSpacing || "10px";
  const entSpacing = customStyles.entrySpacing || "6px";
  const lineHeight = customStyles.lineHeight || "1.3";

  const SectionTitle = ({ title }) => (
    <div style={{ borderBottom: "1px solid #000", marginBottom: "6px", paddingBottom: "2px", marginTop: "10px" }}>
      <h2 style={{ fontSize: fs.sectionTitle, fontWeight: 700, textTransform: "uppercase", color: "#000", margin: 0 }}>{title}</h2>
    </div>
  );

  return (
    <div style={{ width: "100%", color: "#000", background: "#fff", fontSize: fs.body, lineHeight: lineHeight }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <h1 style={{ fontSize: fs.name, fontWeight: 700, margin: "0 0 4px 0", color: "#000" }}>{personalInfo.fullName || "Your Name"}</h1>
        <ContactBar personalInfo={personalInfo} color="#000" />
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ marginBottom: secSpacing }}>
          <p style={{ margin: 0, textAlign: "justify" }}>{summary}</p>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Education" />
          {education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>{edu.institution}</span>
                <span style={{ fontWeight: 400 }}>{edu.startDate} - {edu.endDate}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontStyle: "italic" }}>
                <span>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}</span>
                {edu.gpa && <span>GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Experience" />
          {experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>{exp.position}</span>
                <span style={{ fontWeight: 400 }}>{exp.startDate} - {exp.endDate || "Present"}</span>
              </div>
              <div style={{ fontStyle: "italic", marginBottom: "2px" }}>
                {exp.company}{exp.location ? `, ${exp.location}` : ""}
              </div>
              {(Array.isArray(exp.description) && exp.description.length > 0) && (
                <ul style={{ margin: "2px 0 0 16px", padding: 0, listStyleType: "disc" }}>
                  {exp.description.map((d, i) => (
                    <li key={i} style={{ marginBottom: "2px", textAlign: "justify" }}>{d}</li>
                  ))}
                </ul>
              )}
              <ul style={{ margin: "2px 0 0 16px", padding: 0, listStyleType: "disc" }}>
                {(exp.highlights || []).map((h, i) => (
                  <li key={i} style={{ marginBottom: "2px", textAlign: "justify" }}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Projects" />
          {projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: entSpacing, pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>
                  {proj.name}
                  {proj.technologies?.length > 0 && <span style={{ fontWeight: 400, fontStyle: "italic" }}> | {proj.technologies.join(", ")}</span>}
                </span>
                {proj.url && (
                  <a href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`} target="_blank" rel="noreferrer" style={{ fontWeight: 400, textDecoration: "underline", color: "#000" }}>
                    {proj.url}
                  </a>
                )}
              </div>
              {(Array.isArray(proj.description) && proj.description.length > 0) && (
                <ul style={{ margin: "2px 0 0 16px", padding: 0, listStyleType: "disc" }}>
                  {proj.description.map((d, i) => (
                    <li key={i} style={{ marginBottom: "2px", textAlign: "justify" }}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Technical Skills" />
          <div style={{ marginTop: "2px", lineHeight: "1.5" }}>
            {skills.join(", ")}
          </div>
        </div>
      )}
      
      {/* Certifications */}
      {certifications.length > 0 && (
        <div style={{ marginBottom: secSpacing }}>
          <SectionTitle title="Certifications" />
          <div style={{ marginTop: "2px" }}>
            {certifications.map(c => `${c.name} (${c.issuer})`).join(" | ")}
          </div>
        </div>
      )}
    </div>
  );
};
