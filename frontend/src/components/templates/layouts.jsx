import React from "react";

// Standard font mappings
const fontStacks = {
  "Inter": "font-family-inter",
  "Roboto": "font-family-roboto",
  "Outfit": "font-family-outfit",
  "Times New Roman": "font-family-times",
  "Georgia": "font-family-georgia",
  "Garamond": "font-family-garamond",
  "Calibri": "font-family-calibri",
  "Arial": "font-family-arial"
};

// ----------------------------------------------------------------------
// COMMON SUB-COMPONENTS FOR ATS RESUMES
// ----------------------------------------------------------------------

const ContactBar = ({ personalInfo, layoutType = "row", textClass }) => {
  const items = [];
  
  const baseText = textClass || "text-slate-600";
  const linkText = textClass || "text-slate-700";

  if (personalInfo.email) {
    items.push(
      <a key="email" href={`mailto:${personalInfo.email}`} className={`hover:underline ${baseText}`}>
        {personalInfo.email}
      </a>
    );
  }
  if (personalInfo.phone) {
    items.push(<span key="phone" className={baseText}>{personalInfo.phone}</span>);
  }
  if (personalInfo.location) {
    items.push(<span key="location" className={baseText}>{personalInfo.location}</span>);
  }
  if (personalInfo.website) {
    const displayText = `Portfolio: ${personalInfo.website}`;
    const href = personalInfo.websiteUrl || (personalInfo.website.startsWith("http") ? personalInfo.website : `https://${personalInfo.website}`);
    items.push(
      <a key="portfolio" href={href} target="_blank" rel="noreferrer" className={`hover:underline font-semibold ${linkText}`}>
        {displayText}
      </a>
    );
  }
  if (personalInfo.linkedin) {
    const href = personalInfo.linkedinUrl || (personalInfo.linkedin.startsWith("http") ? personalInfo.linkedin : `https://${personalInfo.linkedin}`);
    items.push(
      <a key="linkedin" href={href} target="_blank" rel="noreferrer" className={`hover:underline font-semibold ${linkText}`}>
        {personalInfo.linkedin}
      </a>
    );
  }
  if (personalInfo.github) {
    const href = personalInfo.githubUrl || (personalInfo.github.startsWith("http") ? personalInfo.github : `https://${personalInfo.github}`);
    items.push(
      <a key="github" href={href} target="_blank" rel="noreferrer" className={`hover:underline font-semibold ${linkText}`}>
        {personalInfo.github}
      </a>
    );
  }

  if (layoutType === "col") {
    return (
      <div className={`flex flex-col gap-1 text-xs mt-2 select-all ${baseText}`}>
        {items.map((item, i) => (
          <div key={i} className="break-all">{item}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="block text-center text-xs text-slate-600 mt-2 font-medium select-all">
      {items.map((item, i) => (
        <span key={i} className="inline-block mx-1.5 my-0.5">
          {i > 0 && <span className="mr-3 text-slate-400 select-none">&bull;</span>}
          {item}
        </span>
      ))}
    </div>
  );
};

const SectionHeader = ({ title, primaryColor, borderStyle = "solid" }) => {
  const borderClasses = {
    solid: "border-b border-slate-300",
    dashed: "border-b border-dashed border-slate-400",
    double: "border-b-4 border-double border-slate-900",
    none: "",
  };

  return (
    <div className={`mt-4 mb-2 pb-1 ${borderClasses[borderStyle] || "border-b border-slate-300"}`} style={{ pageBreakAfter: "avoid", breakAfter: "avoid", breakInside: "avoid" }}>
      <h2 
        className="text-sm font-bold uppercase tracking-wider select-all" 
        style={{ color: primaryColor }}
      >
        {title}
      </h2>
    </div>
  );
};

// ----------------------------------------------------------------------
// STRUCTURAL LAYOUTS
// ----------------------------------------------------------------------

// 1. Single Column Layout (Standard ATS Layout)
export const SingleColumnLayout = ({ resumeData, customStyles, borderStyle = "solid", headerBanner = false }) => {
  const { personalInfo = {}, summary = "", experience = [], education = [], skills = [], projects = [], certifications = [], languages = [] } = resumeData;
  const primaryColor = customStyles.primaryColor || "#1e3a8a";

  return (
    <div className="w-full text-slate-800 bg-white" style={{ fontSize: customStyles.fontSize || "10pt" }}>
      {/* Header */}
      {headerBanner ? (
        <div className="text-center p-6 text-white" style={{ backgroundColor: primaryColor }}>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight break-words select-all">{personalInfo.fullName || "Your Name"}</h1>
          <ContactBar personalInfo={personalInfo} />
        </div>
      ) : (
        <div className="text-center pb-3">
          <h1 className="text-2xl font-extrabold uppercase tracking-tight select-all" style={{ color: primaryColor }}>
            {personalInfo.fullName || "Your Name"}
          </h1>
          <ContactBar personalInfo={personalInfo} />
        </div>
      )}

      {/* Main Content (padded) */}
      <div className={`${headerBanner ? "p-6" : "pt-2"}`}>
        {/* Summary */}
        {summary && (
          <div style={{ marginBottom: customStyles.sectionSpacing || "12px" }}>
            <SectionHeader title="Professional Summary" primaryColor={primaryColor} borderStyle={borderStyle} />
            <p className="text-slate-700 leading-relaxed text-xs whitespace-pre-wrap text-justify">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <div style={{ marginBottom: customStyles.sectionSpacing || "12px" }}>
            <SectionHeader title="Professional Experience" primaryColor={primaryColor} borderStyle={borderStyle} />
            {experience.map((exp, idx) => (
              <div key={idx} className="break-inside-avoid" style={{ marginBottom: customStyles.entrySpacing || "6px" }}>
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span className="select-all">{exp.position}</span>
                  <span>{exp.startDate} - {exp.endDate || "Present"}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium italic text-xs mb-2">
                  <span className="select-all">{exp.company} {exp.location && `| ${exp.location}`}</span>
                </div>
                <ul className="list-disc ml-5 text-slate-700 space-y-0.5 leading-normal text-justify">
                  {(exp.highlights || []).map((highlight, hIdx) => (
                    <li key={hIdx} className="select-all">{highlight}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <div style={{ marginBottom: customStyles.sectionSpacing || "12px" }}>
            <SectionHeader title="Education" primaryColor={primaryColor} borderStyle={borderStyle} />
            {education.map((edu, idx) => (
              <div key={idx} className="break-inside-avoid" style={{ marginBottom: customStyles.entrySpacing || "4px" }}>
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span className="select-all">{edu.institution}</span>
                  <span>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium text-xs">
                  <span className="select-all">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""} {edu.location && `| ${edu.location}`}</span>
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div style={{ marginBottom: customStyles.sectionSpacing || "12px" }}>
            <SectionHeader title="Skills & Expertise" primaryColor={primaryColor} borderStyle={borderStyle} />
            <div className="block mt-1 select-all">
              {skills.map((skill, idx) => (
                <span key={idx} className="inline-block mr-1.5 mb-1.5 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div style={{ marginBottom: customStyles.sectionSpacing || "12px" }}>
            <SectionHeader title="Projects" primaryColor={primaryColor} borderStyle={borderStyle} />
            {projects.map((proj, idx) => (
              <div key={idx} className="break-inside-avoid" style={{ marginBottom: customStyles.entrySpacing || "6px" }}>
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span className="select-all">{proj.name}</span>
                  {proj.url && (
                    <a 
                      href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs font-semibold hover:underline select-all" 
                      style={{ color: primaryColor }}
                    >
                      {proj.url}
                    </a>
                  )}
                </div>
                <p className="text-slate-700 mt-1.5 leading-relaxed text-xs text-justify">{proj.description}</p>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="text-xs mt-1 text-slate-500 font-medium">
                    Technologies: {proj.technologies.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <div style={{ marginBottom: customStyles.sectionSpacing || "12px" }}>
            <SectionHeader title="Certifications" primaryColor={primaryColor} borderStyle={borderStyle} />
            <div className="grid grid-cols-2 gap-2 mt-1 select-all">
              {certifications.map((cert, idx) => (
                <div key={idx} className="border-l-2 pl-2 text-xs border-slate-300">
                  <div className="font-semibold text-slate-900">{cert.name}</div>
                  <div className="text-slate-500 text-2xs">{cert.issuer} {cert.date ? `(${cert.date})` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <div style={{ marginBottom: customStyles.sectionSpacing || "12px" }}>
            <SectionHeader title="Languages" primaryColor={primaryColor} borderStyle={borderStyle} />
            <div className="block mt-1 select-all">
              {languages.map((lang, idx) => (
                <span key={idx} className="inline-block mr-4 mb-1 text-xs font-semibold text-slate-700">
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

// 2. Centered Elegant Layout (Standard centered headers, elegant lines)
export const CenteredLayout = ({ resumeData, customStyles, borderStyle = "double" }) => {
  const { personalInfo = {}, summary = "", experience = [], education = [], skills = [], projects = [], certifications = [], languages = [] } = resumeData;
  const primaryColor = customStyles.primaryColor || "#0f172a";

  const borderClasses = {
    solid: "border-b border-slate-400",
    dashed: "border-b border-dashed border-slate-400",
    double: "border-b-4 border-double border-slate-900",
    none: "",
  };

  return (
    <div className="w-full text-slate-800 bg-white" style={{ fontSize: customStyles.fontSize || "10pt" }}>
      {/* Centred Header */}
      <div className="text-center border-b pb-3 border-slate-200">
        <h1 className="text-3xl font-bold uppercase tracking-wide select-all" style={{ color: primaryColor }}>
          {personalInfo.fullName || "Your Name"}
        </h1>
        <ContactBar personalInfo={personalInfo} />
      </div>

      {/* Summary */}
      {summary && (
        <div className="my-3 text-center">
          <div className={`my-2 pb-1 ${borderClasses[borderStyle]}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: primaryColor }}>Professional Summary</h2>
          </div>
          <p className="text-slate-700 leading-relaxed text-center italic">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-3">
          <div className={`my-2 pb-1 ${borderClasses[borderStyle]}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: primaryColor }}>Professional Experience</h2>
          </div>
          {experience.map((exp, idx) => (
            <div key={idx} className="mb-3 break-inside-avoid">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>{exp.position}</span>
                <span>{exp.startDate} - {exp.endDate || "Present"}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium italic text-xs mb-1">
                <span>{exp.company} {exp.location && `| ${exp.location}`}</span>
              </div>
              <ul className="list-disc ml-5 text-slate-700 text-left space-y-0.5 leading-normal">
                {(exp.highlights || []).map((highlight, hIdx) => (
                  <li key={hIdx}>{highlight}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mb-3">
          <div className={`my-2 pb-1 ${borderClasses[borderStyle]}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: primaryColor }}>Education</h2>
          </div>
          {education.map((edu, idx) => (
            <div key={idx} className="mb-2 break-inside-avoid">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>{edu.institution}</span>
                <span>{edu.startDate} - {edu.endDate}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium text-xs">
                <span>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""} {edu.location && `| ${edu.location}`}</span>
                {edu.gpa && <span>GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="mb-3">
          <div className={`my-2 pb-1 ${borderClasses[borderStyle]}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: primaryColor }}>Skills</h2>
          </div>
          <div className="block mt-1 text-center">
            {skills.map((skill, idx) => (
              <span key={idx} className="inline-block mx-1 mb-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-slate-700 text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mb-3">
          <div className={`my-2 pb-1 ${borderClasses[borderStyle]}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: primaryColor }}>Key Projects</h2>
          </div>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-2 break-inside-avoid">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>{proj.name}</span>
                {proj.url && (
                  <a 
                    href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs font-semibold hover:underline" 
                    style={{ color: primaryColor }}
                  >
                    {proj.url}
                  </a>
                )}
              </div>
              <p className="text-slate-700 mt-0.5 leading-relaxed text-xs text-center">{proj.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <div className="mb-3">
          <div className={`my-2 pb-1 ${borderClasses[borderStyle]}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: primaryColor }}>Certifications</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 text-center justify-center">
            {certifications.map((cert, idx) => (
              <div key={idx} className="text-xs">
                <div className="font-semibold text-slate-900">{cert.name}</div>
                <div className="text-slate-500 text-2xs">{cert.issuer} {cert.date ? `(${cert.date})` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Split Column Layout (Left or Right Sidebar layouts)
export const SplitSidebarLayout = ({ resumeData, customStyles, sidebarPosition = "left" }) => {
  const { personalInfo = {}, summary = "", experience = [], education = [], skills = [], projects = [], certifications = [], languages = [] } = resumeData;
  const primaryColor = customStyles.primaryColor || "#1e3a8a";

  const sidebarContent = (
    <div className="flex flex-col text-white" style={{ gap: customStyles.sectionSpacing || "16px" }}>
      {/* Contact Details in Column */}
      <div className="pb-3 border-b border-white/20">
        <h3 className="font-bold text-xs uppercase text-white/70 mb-1">Contact Info</h3>
        <ContactBar personalInfo={personalInfo} layoutType="col" textClass="text-white" />
      </div>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wide mb-2 text-white">Skills</h3>
          <div className="block mt-1 select-all text-white">
            {skills.map((skill, idx) => (
              <span key={idx} className="inline-block mr-1.5 mb-1.5 px-2 py-0.5 bg-white/20 border border-white/30 rounded text-white text-xs font-medium break-all">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wide mb-2 text-white">Education</h3>
          {education.map((edu, idx) => (
            <div key={idx} className="mb-2 text-2xs text-white/90 break-inside-avoid">
              <div className="font-bold text-white text-xs">{edu.degree}</div>
              <div className="italic text-white/80">{edu.institution}</div>
              <div className="text-white/70">{edu.startDate} - {edu.endDate}</div>
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wide mb-1 text-white">Languages</h3>
          <div className="flex flex-col gap-0.5 text-xs text-white/90 font-medium">
            {languages.map((lang, idx) => (
              <span key={idx}>&bull; {lang}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const mainContent = (
    <div className="flex flex-col" style={{ gap: customStyles.sectionSpacing || "16px" }}>
      {/* Name and Professional Label */}
      <div className="border-b-2 pb-2" style={{ borderColor: primaryColor }}>
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900 select-all">{personalInfo.fullName || "Your Name"}</h1>
        <p className="text-xs font-semibold italic text-slate-500 mt-0.5" style={{ color: primaryColor }}>Curriculum Vitae / Professional Profile</p>
      </div>

      {/* Summary */}
      {summary && (
        <div>
          <SectionHeader title="Professional Summary" primaryColor={primaryColor} borderStyle="solid" />
          <p className="text-slate-700 leading-relaxed text-justify text-xs whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div>
          <SectionHeader title="Professional Experience" primaryColor={primaryColor} borderStyle="solid" />
          {experience.map((exp, idx) => (
            <div key={idx} className="break-inside-avoid" style={{ marginBottom: customStyles.entrySpacing || "12px" }}>
              <div className="flex justify-between font-bold text-slate-900 text-xs">
                <span>{exp.position}</span>
                <span>{exp.startDate} - {exp.endDate || "Present"}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium italic text-2xs mb-2">
                <span>{exp.company} {exp.location && `| ${exp.location}`}</span>
              </div>
              <ul className="list-disc ml-4 text-slate-700 text-2xs leading-normal text-justify" style={{ gap: "2px", display: "flex", flexDirection: "column" }}>
                {(exp.highlights || []).map((highlight, hIdx) => (
                  <li key={hIdx}>{highlight}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div>
          <SectionHeader title="Projects" primaryColor={primaryColor} borderStyle="solid" />
          {projects.map((proj, idx) => (
            <div key={idx} className="break-inside-avoid" style={{ marginBottom: customStyles.entrySpacing || "8px" }}>
              <div className="flex justify-between font-bold text-slate-900 text-xs">
                <span>{proj.name}</span>
                {proj.url && (
                  <a 
                    href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-2xs font-semibold hover:underline" 
                    style={{ color: primaryColor }}
                  >
                    {proj.url}
                  </a>
                )}
              </div>
              <p className="text-slate-700 mt-1.5 leading-relaxed text-2xs text-justify">{proj.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <div>
          <SectionHeader title="Certifications & Accreditations" primaryColor={primaryColor} borderStyle="solid" />
          <div className="grid grid-cols-2 gap-2 text-2xs">
            {certifications.map((cert, idx) => (
              <div key={idx} className="border-l-2 pl-2 border-slate-300">
                <div className="font-semibold text-slate-900">{cert.name}</div>
                <div className="text-slate-500">{cert.issuer} {cert.date ? `(${cert.date})` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full text-slate-800 bg-white min-h-[297mm] table" style={{ fontSize: customStyles.fontSize || "9.5pt", tableLayout: "fixed" }}>
      {sidebarPosition === "left" ? (
        <div className="table-row">
          <div className="table-cell w-[35%] p-6 align-top select-all" style={{ backgroundColor: primaryColor }}>
            {sidebarContent}
          </div>
          <div className="table-cell w-[65%] p-6 pt-8 align-top bg-white">
            {mainContent}
          </div>
        </div>
      ) : (
        <div className="table-row">
          <div className="table-cell w-[65%] p-6 pt-8 align-top bg-white">
            {mainContent}
          </div>
          <div className="table-cell w-[35%] p-6 align-top select-all" style={{ backgroundColor: primaryColor }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </div>
  );
};
