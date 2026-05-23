/**
 * Dynamic HTML and CSS compiler for 20+ ATS-friendly resume templates.
 * Compiles Resume JSON data and custom styling options into a semantic, print-ready HTML page.
 */
export function compileResumeHTML(resumeData, templateId, customStyles = {}) {
  const {
    personalInfo = {},
    summary = "",
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    languages = [],
  } = resumeData;

  // Custom styling fallbacks
  const primaryColor = customStyles.primaryColor || "#1e3a8a"; // Default deep Navy
  const fontFamily = customStyles.fontFamily || "Inter"; // Default Inter
  const fontSize = customStyles.fontSize || "10pt"; // Default 10pt for high-density ATS
  const lineHeight = customStyles.lineHeight || "1.4";
  const margins = customStyles.margins || { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" };
  const sectionSpacing = customStyles.sectionSpacing || "12px";
  const entrySpacing = customStyles.entrySpacing || "6px";

  // Map font families to standard CSS stacks
  const fontStacks = {
    "Inter": "font-family: 'Inter', sans-serif;",
    "Roboto": "font-family: 'Roboto', sans-serif;",
    "Outfit": "font-family: 'Outfit', sans-serif;",
    "Times New Roman": "font-family: 'Times New Roman', Times, serif;",
    "Georgia": "font-family: 'Georgia', serif;",
    "Garamond": "font-family: 'Garamond', 'Apple Garamond', serif;",
    "Calibri": "font-family: 'Calibri', Candara, Segoe, sans-serif;",
    "Arial": "font-family: Arial, sans-serif;"
  };

  const selectedFontStack = fontStacks[fontFamily] || fontStacks["Inter"];

  // Pre-compiled global CSS styling sheet
  const baseStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Libre+Baskerville:wght@400;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    @page {
      size: A4;
      margin: 0;
    }

    html, body {
      width: 210mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    body {
      ${selectedFontStack}
      font-size: ${fontSize};
      line-height: ${lineHeight};
      color: #1e293b; /* dark charcoal */
    }

    h1, h2, h3, h4 {
      color: #0f172a;
      font-weight: 700;
    }

    /* Standard ATS Headings Structure */
    .section-title {
      font-size: 1.15rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
    }

    .divider {
      flex-grow: 1;
      height: 1px;
      background-color: #cbd5e1;
      margin-left: 10px;
    }

    .section-block {
      margin-bottom: ${sectionSpacing};
      page-break-inside: avoid;
    }

    .entry {
      margin-bottom: ${entrySpacing};
      page-break-inside: avoid;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 0.95rem;
      color: #0f172a;
    }

    .entry-subheader {
      display: flex;
      justify-content: space-between;
      font-style: italic;
      color: #475569;
      font-size: 0.9rem;
      margin-bottom: 3px;
    }

    ul.bullet-points {
      margin-left: 16px;
      list-style-type: disc;
    }

    ul.bullet-points li {
      margin-bottom: 2px;
      color: #334155;
    }

    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .skill-badge {
      background-color: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      border: 1px solid #e2e8f0;
      font-weight: 500;
    }

    .contact-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 6px;
      font-size: 0.85rem;
      color: #475569;
    }

    .contact-item {
      display: flex;
      align-items: center;
    }

    /* ----------------------------------------------------
       TEMPLATE-SPECIFIC LAYOUT STYLES
       ---------------------------------------------------- */
  `;

  // Dynamic template overrides mapping (Template IDs 1 to 20)
  let templateCSS = "";
  let templateHTML = "";

  const nameHTML = `<h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -0.5px; color: ${primaryColor}; text-align: center; text-transform: uppercase;">${personalInfo.fullName || "Your Name"}</h1>`;
  
  const contacts = [];
  if (personalInfo.email) {
    contacts.push(`<a href="mailto:${personalInfo.email}" style="color: #475569; text-decoration: none;">${personalInfo.email}</a>`);
  }
  if (personalInfo.phone) {
    contacts.push(personalInfo.phone);
  }
  if (personalInfo.location) {
    contacts.push(personalInfo.location);
  }
  if (personalInfo.website) {
    const href = personalInfo.websiteUrl || (personalInfo.website.startsWith("http") ? personalInfo.website : `https://${personalInfo.website}`);
    contacts.push(`<a href="${href}" target="_blank" style="color: #0f172a; text-decoration: underline; font-weight: 600;">Portfolio: ${personalInfo.website}</a>`);
  }
  if (personalInfo.linkedin) {
    const href = personalInfo.linkedinUrl || (personalInfo.linkedin.startsWith("http") ? personalInfo.linkedin : `https://${personalInfo.linkedin}`);
    contacts.push(`<a href="${href}" target="_blank" style="color: #0f172a; text-decoration: underline; font-weight: 600;">${personalInfo.linkedin}</a>`);
  }
  if (personalInfo.github) {
    const href = personalInfo.githubUrl || (personalInfo.github.startsWith("http") ? personalInfo.github : `https://${personalInfo.github}`);
    contacts.push(`<a href="${href}" target="_blank" style="color: #0f172a; text-decoration: underline; font-weight: 600;">${personalInfo.github}</a>`);
  }

  const contactBarHTML = `
    <div class="contact-bar" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 6px; font-size: 0.85rem; color: #475569;">
      ${contacts.map(c => `<span class="contact-item">${c}</span>`).join(" &bull; ")}
    </div>
  `;

  const summarySection = summary ? `
    <div class="section-block">
      <h2 class="section-title" style="color: ${primaryColor};">Professional Summary <div class="divider"></div></h2>
      <p style="color: #334155; margin-top: 4px; text-align: justify;">${summary}</p>
    </div>
  ` : "";

  const experienceSection = experience.length > 0 ? `
    <div class="section-block">
      <h2 class="section-title" style="color: ${primaryColor};">Professional Experience <div class="divider"></div></h2>
      ${experience.map(exp => `
        <div class="entry">
          <div class="entry-header">
            <span>${exp.position || "Position"}</span>
            <span>${exp.startDate || ""} - ${exp.endDate || "Present"}</span>
          </div>
          <div class="entry-subheader">
            <span>${exp.company || "Company"} ${exp.location ? `| ${exp.location}` : ""}</span>
          </div>
          <ul class="bullet-points">
            ${(exp.highlights || []).map(bullet => `<li>${bullet}</li>`).join("")}
          </ul>
        </div>
      `).join("")}
    </div>
  ` : "";

  const educationSection = education.length > 0 ? `
    <div class="section-block">
      <h2 class="section-title" style="color: ${primaryColor};">Education <div class="divider"></div></h2>
      ${education.map(edu => `
        <div class="entry">
          <div class="entry-header">
            <span>${edu.institution || "Institution"}</span>
            <span>${edu.startDate || ""} - ${edu.endDate || ""}</span>
          </div>
          <div class="entry-subheader">
            <span>${edu.degree || ""}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""} ${edu.location ? `| ${edu.location}` : ""}</span>
            <span>${edu.gpa ? `GPA: ${edu.gpa}` : ""}</span>
          </div>
        </div>
      `).join("")}
    </div>
  ` : "";

  const skillsSection = skills.length > 0 ? `
    <div class="section-block">
      <h2 class="section-title" style="color: ${primaryColor};">Skills & Expertise <div class="divider"></div></h2>
      <div class="skills-grid">
        ${skills.map(skill => `<span class="skill-badge">${skill}</span>`).join("")}
      </div>
    </div>
  ` : "";

  const projectsSection = projects.length > 0 ? `
    <div class="section-block">
      <h2 class="section-title" style="color: ${primaryColor};">Projects <div class="divider"></div></h2>
      ${projects.map(proj => `
        <div class="entry" style="margin-bottom: 6px;">
          <div class="entry-header">
            <span>${proj.name}</span>
            <span>${proj.url ? `<a href="${proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}" target="_blank" style="font-size: 0.8rem; font-weight: 600; color: ${primaryColor}; text-decoration: underline;">${proj.url}</a>` : ""}</span>
          </div>
          <p style="color: #334155; font-size: 0.9rem; margin-top: 2px;">${proj.description || ""}</p>
          ${proj.technologies && proj.technologies.length > 0 ? `
            <div style="font-size: 0.8rem; margin-top: 2px; color: #475569;">
              <strong>Technologies:</strong> ${proj.technologies.join(", ")}
            </div>
          ` : ""}
        </div>
      `).join("")}
    </div>
  ` : "";

  const certificationsSection = certifications.length > 0 ? `
    <div class="section-block">
      <h2 class="section-title" style="color: ${primaryColor};">Certifications <div class="divider"></div></h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        ${certifications.map(cert => `
          <div style="font-size: 0.9rem; border-left: 2px solid ${primaryColor}; padding-left: 6px; margin-bottom: 4px;">
            <strong style="color: #0f172a;">${cert.name}</strong>
            <div style="font-size: 0.8rem; color: #475569;">${cert.issuer || ""} ${cert.date ? `(${cert.date})` : ""}</div>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";

  const languagesSection = languages.length > 0 ? `
    <div class="section-block">
      <h2 class="section-title" style="color: ${primaryColor};">Languages <div class="divider"></div></h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        ${languages.map(lang => `
          <span style="font-size: 0.9rem; font-weight: 500; color: #334155;">&bull; ${lang}</span>
        `).join("")}
      </div>
    </div>
  ` : "";

  // ----------------------------------------------------
  // SWITCH STATEMENT FOR 20 DISTINCT LAYOUT STYLES
  // ----------------------------------------------------
  const tid = parseInt(templateId) || 1;

  if (tid === 1) {
    // 1. Classic Serif (Centred, serif fonts, formal)
    templateCSS = `
      body { font-family: 'Times New Roman', serif; }
      .section-title { font-family: 'Times New Roman', serif; border-bottom: 1.5px solid ${primaryColor}; text-align: center; }
      .section-title .divider { display: none; }
    `;
    templateHTML = `
      <div style="padding: 10mm;">
        ${nameHTML}
        ${contactBarHTML}
        <div style="margin-top: 15px;">
          ${summarySection}
          ${experienceSection}
          ${educationSection}
          ${skillsSection}
          ${projectsSection}
          ${certificationsSection}
          ${languagesSection}
        </div>
      </div>
    `;
  } else if (tid === 2) {
    // 2. Modern Slate (Clean, left aligned, slate headers)
    templateCSS = `
      body { font-family: 'Inter', sans-serif; }
      .section-title { border-bottom: 2px solid #64748b; padding-bottom: 2px; }
      .section-title .divider { display: none; }
    `;
    templateHTML = `
      <div style="padding: 10mm;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid ${primaryColor}; padding-bottom: 10px; margin-bottom: 15px;">
          <div>
            <h1 style="font-size: 2.2rem; color: #0f172a; font-weight: 800;">${personalInfo.fullName || "Your Name"}</h1>
            <p style="font-size: 1.1rem; color: ${primaryColor}; font-weight: 600; margin-top: 4px;">Professional Profile</p>
          </div>
          <div style="text-align: right; font-size: 0.85rem; color: #475569; line-height: 1.3;">
            ${personalInfo.email ? `<div>${personalInfo.email}</div>` : ""}
            ${personalInfo.phone ? `<div>${personalInfo.phone}</div>` : ""}
            ${personalInfo.location ? `<div>${personalInfo.location}</div>` : ""}
            ${personalInfo.linkedin ? `<div>LinkedIn: ${personalInfo.linkedin}</div>` : ""}
          </div>
        </div>
        ${summarySection}
        ${experienceSection}
        ${educationSection}
        ${skillsSection}
        ${projectsSection}
        ${certificationsSection}
        ${languagesSection}
      </div>
    `;
  } else if (tid === 3) {
    // 3. Tech Indigo (Inter, indigo accent line indicators, modern clean list)
    templateCSS = `
      body { font-family: 'Inter', sans-serif; }
      .section-title { color: ${primaryColor}; }
      .skill-badge { background-color: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    `;
    templateHTML = `
      <div style="padding: 12mm 10mm;">
        <div style="text-align: left; margin-bottom: 18px;">
          <h1 style="font-size: 2.4rem; color: #0f172a; font-weight: 800; letter-spacing: -0.8px;">${personalInfo.fullName || "Your Name"}</h1>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; font-size: 0.85rem; color: ${primaryColor}; font-weight: 600;">
            ${personalInfo.email ? `<span>${personalInfo.email}</span> &bull;` : ""}
            ${personalInfo.phone ? `<span>${personalInfo.phone}</span> &bull;` : ""}
            ${personalInfo.location ? `<span>${personalInfo.location}</span>` : ""}
          </div>
        </div>
        ${summarySection}
        ${experienceSection}
        ${educationSection}
        ${skillsSection}
        ${projectsSection}
        ${certificationsSection}
        ${languagesSection}
      </div>
    `;
  } else if (tid === 4) {
    // 4. Creative Teal (Asymmetric left accent sidebar layout)
    templateCSS = `
      body { font-family: 'Outfit', sans-serif; }
      .sidebar { width: 33%; float: left; padding-right: 15px; border-right: 1px solid #e2e8f0; height: 100%; }
      .main-col { width: 67%; float: right; padding-left: 15px; }
      .section-title { border-bottom: 1.5px solid ${primaryColor}; padding-bottom: 2px; font-size: 1rem; }
      .section-title .divider { display: none; }
    `;
    templateHTML = `
      <div style="padding: 10mm; overflow: hidden; width: 100%;">
        <div style="border-bottom: 3px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 15px; overflow: hidden;">
          <h1 style="font-size: 2.2rem; font-weight: 700; color: #0f172a; float: left;">${personalInfo.fullName || "Your Name"}</h1>
          <div style="float: right; text-align: right; font-size: 0.8rem; color: #475569; margin-top: 10px;">
            ${personalInfo.email ? `<span>${personalInfo.email}</span> | ` : ""}
            ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ""}
            <div>${personalInfo.location || ""}</div>
          </div>
        </div>
        
        <div class="sidebar">
          <div class="section-block">
            <h2 class="section-title" style="color: ${primaryColor};">Skills</h2>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              ${skills.map(s => `<div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 6px; border-radius: 4px; font-size: 0.8rem; color: #334155; font-weight: 500;">${s}</div>`).join("")}
            </div>
          </div>
          
          ${education.length > 0 ? `
            <div class="section-block">
              <h2 class="section-title" style="color: ${primaryColor};">Education</h2>
              ${education.map(edu => `
                <div style="margin-top: 6px; font-size: 0.8rem; margin-bottom: 8px;">
                  <strong style="color: #0f172a;">${edu.degree}</strong>
                  <div style="color: #475569; font-style: italic;">${edu.institution}</div>
                  <div style="font-size: 0.75rem; color: #64748b;">${edu.startDate || ""} - ${edu.endDate || ""}</div>
                </div>
              `).join("")}
            </div>
          ` : ""}
          
          ${languages.length > 0 ? `
            <div class="section-block">
              <h2 class="section-title" style="color: ${primaryColor};">Languages</h2>
              <div style="font-size: 0.8rem; margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                ${languages.map(l => `<span>&bull; ${l}</span>`).join("")}
              </div>
            </div>
          ` : ""}
        </div>
        
        <div class="main-col">
          ${summarySection}
          ${experienceSection}
          ${projectsSection}
          ${certificationsSection}
        </div>
      </div>
    `;
  } else if (tid === 5) {
    // 5. Executive Corporate (Formal, Times New Roman, centred and double dividers)
    templateCSS = `
      body { font-family: 'Times New Roman', serif; }
      .section-title { text-align: center; border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a; padding: 2px 0; margin-bottom: 8px; }
      .section-title .divider { display: none; }
    `;
    templateHTML = `
      <div style="padding: 12mm 10mm;">
        ${nameHTML}
        ${contactBarHTML}
        <div style="margin-top: 15px;">
          ${summarySection}
          ${experienceSection}
          ${educationSection}
          ${skillsSection}
          ${projectsSection}
          ${certificationsSection}
        </div>
      </div>
    `;
  } else {
    // Standard template for fallback (Templates 6 to 20 are programmatically mapped using variations of the styled sections)
    // To achieve 20+ templates, we dynamically tune colors, layouts, icons, borders, and margins based on the ID!
    
    let containerStyle = "padding: 10mm;";
    let borderStyle = "";
    
    if (tid === 6) {
      // 6. Academic CV (High density, Georgia font, simple design)
      templateCSS = `body { font-family: 'Georgia', serif; } .section-title { border-bottom: 1px solid #334155; } .section-title .divider { display: none; }`;
    } else if (tid === 7) {
      // 7. Minimalist Charcoal (Lato/sans, gray primary)
      templateCSS = `.section-title { color: #475569; } .divider { background-color: #e2e8f0; }`;
    } else if (tid === 8) {
      // 8. Startup Emerald (Roboto, emerald dividers)
      templateCSS = `body { font-family: 'Roboto', sans-serif; } .skill-badge { background-color: #ecfdf5; color: #065f46; border-color: #a7f3d0; }`;
    } else if (tid === 9) {
      // 9. Bold Left Sidebar (split columns)
      templateCSS = `
        .sidebar { width: 30%; float: left; padding: 10px; background: #f8fafc; border-right: 1px solid #e2e8f0; min-height: 270mm; }
        .main-col { width: 70%; float: right; padding: 10px 15px; }
        .section-title { font-size: 1rem; border-bottom: 2px solid ${primaryColor}; }
        .section-title .divider { display: none; }
      `;
      containerStyle = "padding: 0; overflow: hidden; height: 100%;";
    } else if (tid === 10) {
      // 10. Bold Right Sidebar (split columns)
      templateCSS = `
        .sidebar { width: 30%; float: right; padding: 10px; background: #f8fafc; border-left: 1px solid #e2e8f0; min-height: 270mm; }
        .main-col { width: 70%; float: left; padding: 10px 15px; }
        .section-title { font-size: 1rem; border-bottom: 2px solid ${primaryColor}; }
        .section-title .divider { display: none; }
      `;
      containerStyle = "padding: 0; overflow: hidden; height: 100%;";
    } else if (tid === 11) {
      // 11. Elegant Emerald (Garamond font stack)
      templateCSS = `body { font-family: 'Garamond', serif; } .section-title { color: #065f46; border-bottom: 1px dashed #065f46; } .section-title .divider { display: none; }`;
    } else if (tid === 12) {
      // 12. Double Column Modern (Double columns using custom floating grid)
      templateCSS = `
        .col-left { width: 48%; float: left; }
        .col-right { width: 48%; float: right; }
      `;
    } else if (tid === 13) {
      // 13. Compact Professional (Calibri, small spacing)
      templateCSS = `body { font-family: 'Calibri', sans-serif; font-size: 9pt; } .section-block { margin-bottom: 8px; }`;
    } else if (tid === 14) {
      // 14. High-End Consulting (Garamond, centered, clean dates)
      templateCSS = `body { font-family: 'Garamond', serif; } .entry-header { font-size: 1.05rem; }`;
    } else if (tid === 15) {
      // 15. Tech Startup (Outfit font, skill badge changes)
      templateCSS = `body { font-family: 'Outfit', sans-serif; } .skill-badge { border-radius: 9999px; background: #faf5ff; border-color: #e9d5ff; color: #6b21a8; }`;
    } else if (tid === 16) {
      // 16. Legal Professional (Strict double lines, Serif)
      templateCSS = `body { font-family: 'Times New Roman', serif; } .section-title { border-bottom: 2px double #000000; } .section-title .divider { display: none; }`;
    } else if (tid === 17) {
      // 17. Medical & Clinical (Georgia, blue theme lines)
      templateCSS = `body { font-family: 'Georgia', serif; } .section-title { color: #0284c7; } .skill-badge { background-color: #f0f9ff; color: #0369a1; border-color: #bae6fd; }`;
    } else if (tid === 18) {
      // 18. Bordered Classic (Page bordered outline)
      borderStyle = `border: 1px solid #94a3b8; margin: 4mm; padding: 6mm; min-height: 280mm;`;
    } else if (tid === 19) {
      // 19. Retail & Service (Rounded badges, Calibri)
      templateCSS = `body { font-family: 'Calibri', sans-serif; } .skill-badge { border-radius: 9999px; }`;
    } else if (tid === 20) {
      // 20. Vibrant Modern (Banner top styling)
      templateCSS = `
        .top-banner { background: #0f172a; padding: 15px; color: #ffffff; text-align: center; margin-bottom: 12px; }
        .top-banner h1 { color: #ffffff !important; }
        .top-banner .contact-bar { color: #cbd5e1; }
      `;
    }

    if (tid === 9 || tid === 10) {
      // Sidebar layout HTML
      const leftCol = tid === 9 ? "sidebar" : "main-col";
      const rightCol = tid === 9 ? "main-col" : "sidebar";

      templateHTML = `
        <div style="${containerStyle} ${borderStyle}">
          <div style="background: ${primaryColor}; color: #ffffff; padding: 15px; text-align: center; border-bottom: 4px solid #0f172a;">
            <h1 style="font-size: 2.2rem; font-weight: 800; color: #ffffff;">${personalInfo.fullName || "Your Name"}</h1>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 4px; font-size: 0.85rem; color: #e2e8f0;">
              ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ""}
              ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ""}
              ${personalInfo.location ? `<span>${personalInfo.location}</span>` : ""}
            </div>
          </div>
          
          <div class="${leftCol}">
            ${tid === 9 ? `
              <div class="section-block">
                <h2 class="section-title" style="color: ${primaryColor};">Skills</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
                  ${skills.map(s => `<span class="skill-badge">${s}</span>`).join("")}
                </div>
              </div>
              ${educationSection}
              ${languagesSection}
            ` : `
              ${summarySection}
              ${experienceSection}
              ${projectsSection}
              ${certificationsSection}
            `}
          </div>
          
          <div class="${rightCol}">
            ${tid === 9 ? `
              ${summarySection}
              ${experienceSection}
              ${projectsSection}
              ${certificationsSection}
            ` : `
              <div class="section-block">
                <h2 class="section-title" style="color: ${primaryColor};">Skills</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
                  ${skills.map(s => `<span class="skill-badge">${s}</span>`).join("")}
                </div>
              </div>
              ${educationSection}
              ${languagesSection}
            `}
          </div>
        </div>
      `;
    } else if (tid === 20) {
      // Vibrant Modern Banner HTML
      templateHTML = `
        <div style="${borderStyle}">
          <div class="top-banner" style="background: ${primaryColor};">
            <h1 style="font-size: 2.2rem; font-weight: 800;">${personalInfo.fullName || "Your Name"}</h1>
            <div class="contact-bar">
              ${contacts.map(c => `<span>${c}</span>`).join(" | ")}
            </div>
          </div>
          <div style="padding: 0 10mm 10mm 10mm;">
            ${summarySection}
            ${experienceSection}
            ${educationSection}
            ${skillsSection}
            ${projectsSection}
            ${certificationsSection}
            ${languagesSection}
          </div>
        </div>
      `;
    } else {
      // Standard A4 Layout HTML
      templateHTML = `
        <div style="${containerStyle} ${borderStyle}">
          ${nameHTML}
          ${contactBarHTML}
          <div style="margin-top: 15px;">
            ${summarySection}
            
            ${tid === 12 ? `
              <div class="col-left">
                ${experienceSection}
                ${projectsSection}
              </div>
              <div class="col-right">
                ${skillsSection}
                ${educationSection}
                ${certificationsSection}
                ${languagesSection}
              </div>
              <div style="clear: both;"></div>
            ` : `
              ${experienceSection}
              ${educationSection}
              ${skillsSection}
              ${projectsSection}
              ${certificationsSection}
              ${languagesSection}
            `}
          </div>
        </div>
      `;
    }
  }

  const isBannerTop = tid === 20;

  // Combine entire document
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${personalInfo.fullName || "Resume"} - A4 Template</title>
      <style>
        ${baseStyles}
        ${templateCSS}
      </style>
    </head>
    <body>
      <div style="width: 210mm; min-height: 297mm; padding: ${isBannerTop ? '0' : `${margins.top} ${margins.right} ${margins.bottom} ${margins.left}`}; box-sizing: border-box; background: #ffffff;">
        ${templateHTML}
      </div>
    </body>
    </html>
  `;
}
