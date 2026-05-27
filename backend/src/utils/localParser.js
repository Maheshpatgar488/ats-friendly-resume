export function parseResumeText(text) {
  const fullText = text;
  const result = {
    personalInfo: { fullName: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: []
  };

  // Extract contact info from entire text (these work regardless of sections)
  const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch) result.personalInfo.email = emailMatch[0];
  const phoneMatch = fullText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) result.personalInfo.phone = phoneMatch[0];
  const linkedinMatch = fullText.match(/(?:linkedin\.com\/[^\s,;]+)/i);
  if (linkedinMatch) result.personalInfo.linkedin = "https://" + linkedinMatch[0].replace(/^https?:\/\//, "");
  const githubMatch = fullText.match(/(?:github\.com\/[^\s,;]+)/i);
  if (githubMatch) result.personalInfo.github = "https://" + githubMatch[0].replace(/^https?:\/\//, "");
  const urlMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?([\w-]+\.)+(com|org|net|io|dev|app)(?:\/[^\s,;]*)?/i);
  if (urlMatch) {
    const u = urlMatch[0].toLowerCase();
    if (!u.includes("linkedin") && !u.includes("github")) {
      result.personalInfo.website = u.startsWith("http") ? u : "https://" + u;
    }
  }

  // Split into lines and clean
  const rawLines = text.split("\n");
  const lines = [];
  for (const line of rawLines) {
    const l = line.trim();
    if (!l) continue;
    if (l.match(/^\d+\s*of\s*\d+$/i)) continue;
    if (l.match(/^page\s*\d+$/i)) continue;
    if (l.length <= 2) continue;
    lines.push(l);
  }

  if (!lines.length) return result;

  // --- NAME ---
  // Look through first 15 lines, find a name pattern (2-4 capitalized words)
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    if (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/) ||
        line.match(/^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3}$/)) {
      if (!line.includes("@") && !line.match(/http/) && !line.match(/\d/)) {
        result.personalInfo.fullName = line;
        break;
      }
    }
  }
  // Fallback: first line that looks like a name (avoid section headers, dates, etc)
  if (!result.personalInfo.fullName) {
    for (const line of lines.slice(0, 15)) {
      if (line.length < 3 || line.length > 60) continue;
      if (line.match(/^(experience|education|skills|summary|work|project|qualification|contact)/i)) continue;
      if (line.match(/@|http|\d{4}/)) continue;
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 5 && !words.some(w => /^[a-z]/.test(w))) {
        result.personalInfo.fullName = line;
        break;
      }
    }
  }

  // --- LOCATION ---
  const stateAbbr = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY";
  const locChecks = [
    fullText.match(new RegExp("([A-Z][A-Za-z\\s.]+,\\s*(" + stateAbbr + "))\\b")),
    fullText.match(/([A-Z][A-Za-z\s.]+,\s*(?:United\s*States|USA|UK|Canada|Australia|India|Germany|France|Japan|Singapore|Dubai))/i),
    fullText.match(/^\s*([A-Z][A-Za-z\s.]+,\s*[A-Z]{2})\s*$/m),
  ];
  for (const m of locChecks) {
    if (m && !m[1].match(/(LinkedIn|GitHub|Facebook|Twitter|YouTube|Outlook)/i)) {
      result.personalInfo.location = m[1].trim();
      break;
    }
  }

  // --- CLASSIFY EACH LINE ---
  // Build a structured list of all lines with their classifications
  const entry = []; // { type, text, index }
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : "";

    // Section header detection (very broad)
    const isSection = line.match(/^(experience|work\s*experience|employment|education|skills|technical\s*skills|projects|summary|professional\s*summary|profile|objective|certifications|languages|achievements|publications|volunteer|leadership)/i) && line.length < 50;
    if (isSection) {
      entry.push({ type: "section", text: line, section: line.toLowerCase().replace(/[^a-z]/g, "").trim() });
      i++;
      continue;
    }

    // Date range line (likely a job/education entry)
    const hasDateRange = !!(line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\s*[-–to]+\s*(Present|Current|Now|\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})\b/i) ||
      line.match(/\b\d{4}\s*[-–to]+\s*(Present|Current|Now|\d{4})\b/i));
    const hasSingleDate = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\b/i) || line.match(/\b(?:19|20)\d{2}\b/);

    // Bullet point
    const isBullet = line.match(/^[-•·*→‣▶▪●○■✦✧>]\s*/) || line.match(/^\d+[.)]\s*/);

    if (isBullet) {
      entry.push({ type: "bullet", text: line.replace(/^[-•·*→‣▶▪●○■✦✧>\d.)\s]+/, "").trim(), raw: line });
    } else if (hasDateRange || (hasSingleDate && line.length < 100)) {
      entry.push({ type: "dated", text: line });
    } else if (line.length > 50) {
      entry.push({ type: "desc", text: line });
    } else if (line.match(/[A-Z][a-z]+/) && line.length < 80) {
      // Could be a title, company, school name, etc.
      entry.push({ type: "title", text: line });
    } else {
      entry.push({ type: "other", text: line });
    }
    i++;
  }

  // --- SUMMARY ---
  // Find text between name/contact and the first section header that's not summary
  let summaryLines = [];
  let collecting = false;
  for (const e of entry) {
    if (e.type === "section" && e.section.match(/summary|profile|objective/)) {
      collecting = true;
      continue;
    }
    if (e.type === "section" && collecting && !e.section.match(/summary|profile|objective/)) break;
    if (collecting && (e.type === "desc" || e.type === "title")) summaryLines.push(e.text);
  }
  // Fallback: grab text before first experience/education/skills section
  if (!summaryLines.length) {
    for (let j = 0; j < entry.length; j++) {
      if (entry[j].type === "section" && (entry[j].section.match(/experience|education|skills/))) break;
      if (j > 2 && entry[j].type === "desc") summaryLines.push(entry[j].text);
    }
  }
  if (summaryLines.length) result.summary = summaryLines.join(" ").substring(0, 3000);

  // --- SKILLS ---
  // Look in skills section OR scan entire text for tech keywords
  const techKeywords = [
    "Python", "JavaScript", "TypeScript", "Java", "C\\+\\+", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "React", "Angular", "Vue", "Node\\.?js", "Express", "Django", "Flask", "Spring", "\\.NET", "Laravel", "Rails",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "CI/CD", "Git",
    "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "GraphQL", "Firebase",
    "HTML", "CSS", "Sass", "Tailwind", "Bootstrap", "Material.UI",
    "Agile", "Scrum", "Jira", "REST", "API", "Microservices",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
    "Linux", "Unix", "Bash", "Shell", "PowerShell",
    "Tableau", "Power.BI", "Excel",
    "D3\\.js", "Three\\.js", "Next\\.?js", "TypeScript", "Redux", "Webpack", "Babel",
    "Figma", "Sketch", "Photoshop", "Illustrator", "XD",
    "Numpy", "Pandas", "Scikit", "Matplotlib", "Seaborn", "Jupyter",
    "Flutter", "React.Native", "Android", "iOS", "SwiftUI", "UIKit"
  ];

  // Grab everything from a skills section if it exists
  let inSkills = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/skill|technology|competenc|expertise/))) {
      inSkills = true; continue;
    }
    if (inSkills && e.type === "section") break;
    if (inSkills && (e.type === "title" || e.type === "desc" || e.type === "other" || e.type === "bullet")) {
      const words = e.text.split(/[,;|•\n/]+/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
      for (const w of words) {
        if (!result.skills.includes(w)) result.skills.push(w);
      }
    }
  }

  // Also find tech keywords anywhere in text
  for (const kw of techKeywords) {
    try {
      const re = new RegExp("\\b" + kw + "\\b", "i");
      if (re.test(fullText) && !result.skills.some(s => s.toLowerCase() === kw.replace(/\\/g, "").toLowerCase().replace(/\./g, "").replace("js", "js"))) {
        result.skills.push(kw.replace(/\\/g, ""));
      }
    } catch(e) {}
  }
  // Deduplicate
  const seen = new Set();
  result.skills = result.skills.filter(s => {
    const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key) || key.length < 2) return false;
    seen.add(key);
    return true;
  });

  // --- EXPERIENCE ---
  // Find the experience section and parse
  let expSection = false;
  let expGroup = null;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/experience|work|employ|history|profession/))) {
      expSection = true; continue;
    }
    if (expSection && e.type === "section" && !e.section.match(/experience|work|employ|history|profession/)) {
      if (expSection && !e.section.match(/project|education|skill|summary/)) continue; // subtitle sections like "Internship" "Freelance"
      break;
    }
    if (expSection) {
      if (e.type === "dated") {
        if (expGroup) result.experience.push(expGroup);
        expGroup = { company: "", position: "", startDate: "", endDate: "", location: "", description: [], highlights: [] };

        // Extract dates
        const drM = e.text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\s*[-–to]+\s*(Present|Current|Now|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})\b/i);
        if (drM) {
          const parts = drM[0].split(/[-–to]+/);
          expGroup.startDate = parts[0]?.trim() || "";
          expGroup.endDate = parts[1]?.trim() || "";
        } else {
          const yrM = e.text.match(/(\d{4})\s*[-–to]+\s*(Present|Current|Now|\d{4})\b/i);
          if (yrM) {
            expGroup.startDate = yrM[1];
            expGroup.endDate = yrM[2];
          }
        }

        // Parse company/position from the line (remove dates)
        const noDate = e.text.replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\s*[-–to]+\s*(Present|Current|Now|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})\b/i, "")
          .replace(/\b\d{4}\s*[-–to]+\s*(Present|Current|Now|\d{4})\b/i, "").trim();
        const parts = noDate.split(/[|;]/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          expGroup.position = parts[0];
          expGroup.company = parts.slice(1).join(" | ");
        } else if (noDate.length > 0) {
          expGroup.company = noDate;
        }
      } else if (e.type === "bullet" && expGroup) {
        expGroup.highlights.push(e.text);
      } else if (e.type === "title" && expGroup) {
        // Could be position title on the next line
        if (expGroup.position && !expGroup.company) {
          expGroup.company = e.text;
        } else if (!expGroup.position && expGroup.company) {
          expGroup.position = e.text;
        } else {
          expGroup.description.push(e.text);
        }
      } else if (e.type === "desc" && expGroup) {
        expGroup.description.push(e.text);
      }
    }
  }
  if (expGroup) result.experience.push(expGroup);

  // --- EDUCATION ---
  let eduSection = false;
  let eduGroup = null;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/education|academic|qualification|degree|university|college/i))) {
      eduSection = true; continue;
    }
    if (eduSection && e.type === "section" && !e.section.match(/education|academic|qualification|degree|university|college/i) && !e.section.match(/skill|project|language|certif/)) break;
    if (eduSection) {
      const hasDegree = e.text.match(/(Bachelor|Master|PhD|Doctorate|B\.\w+|M\.\w+|Associate|High\s*School|MBA|BTech|MTech|BE\b|ME\b|BCA|MCA|BSc|MSc|BA\b|MA\b)/i);
      const hasInst = e.text.match(/(University|College|Institute|School|Academy|IIT|NIT|IIIT)/i);
      const hasYear = !!e.text.match(/\b(?:19|20)\d{2}\b/);

      if ((hasDegree || hasInst) && e.type !== "bullet") {
        if (eduGroup) result.education.push(eduGroup);
        eduGroup = { institution: "", degree: "", fieldOfStudy: "", location: "", startDate: "", endDate: "", gpa: "" };
        if (hasInst) eduGroup.institution = e.text.replace(/[,•].*$/, "").trim();
        if (hasDegree) {
          const dm = e.text.match(/(Bachelor(?:'s)?|Master(?:'s)?|PhD|Doctorate|B\.\w+|M\.\w+|Associate|High\s*School|MBA|BTech|MTech|BE\b|ME\b|BCA|MCA|BSc|MSc|BA\b|MA\b)/i);
          if (dm) eduGroup.degree = dm[0].replace(/['']s$/, "'s");
        }
        const yrM = e.text.match(/(\d{4})\s*[-–to]+\s*(\d{4}|Present|Expected)\b/i);
        if (yrM) { eduGroup.startDate = yrM[1]; eduGroup.endDate = yrM[2]; }
      } else if (eduGroup && hasYear) {
        const yrM = e.text.match(/(\d{4})\s*[-–to]+\s*(\d{4}|Present|Expected)\b/i);
        if (yrM) { eduGroup.startDate = yrM[1]; eduGroup.endDate = yrM[2]; }
      } else if (eduGroup && e.text.match(/GPA|gpa/i)) {
        eduGroup.gpa = e.text.replace(/GPA:?\s*/i, "").trim();
      }
    }
  }
  if (eduGroup) result.education.push(eduGroup);

  // --- PROJECTS ---
  let projSection = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/project/i))) { projSection = true; continue; }
    if (projSection && e.type === "section" && !e.section.match(/project/i) && !e.section.match(/skill|language/)) break;
    if (projSection && e.type === "title") {
      result.projects.push({ name: e.text, description: [], technologies: [], url: "" });
    } else if (projSection && e.type === "bullet" && result.projects.length) {
      result.projects[result.projects.length - 1].description.push(e.text);
    }
  }

  // --- CERTIFICATIONS ---
  let certSection = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/certif|license|credential/i))) { certSection = true; continue; }
    if (certSection && e.type === "section" && !e.section.match(/certif|license|credential/i) && !e.section.match(/language/i)) break;
    if (certSection && (e.type === "title" || e.type === "bullet")) {
      result.certifications.push({ name: e.text.replace(/^[-•\s]+/, "").trim(), issuer: "", date: "" });
    }
  }

  // --- LANGUAGES ---
  let langSection = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/language/i))) { langSection = true; continue; }
    if (langSection && e.type === "section" && !e.section.match(/language/i)) break;
    if (langSection) {
      const langs = e.text.split(/[,;]+/).map(l => l.replace(/\(.*\)/, "").trim()).filter(l => l.length > 1);
      result.languages.push(...langs);
    }
  }

  // Final cleanup: remove empty entries
  result.experience = result.experience.filter(e => e.company || e.position || e.highlights.length || e.description.length);
  result.education = result.education.filter(e => e.institution || e.degree);
  result.skills = [...new Set(result.skills.map(s => s.replace(/[.,]$/, "").trim()).filter(s => s.length > 1))];

  return result;
}
