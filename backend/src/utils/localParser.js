/**
 * ATS Resume Parser — v3 (PDF-robust)
 *
 * Designed to handle real PDF-extracted text where:
 *  - Line breaks may be missing or unreliable
 *  - Section headers may be embedded mid-line
 *  - Contact info and name may be on the same line
 *
 * Strategy: Force-break text at known headers/patterns FIRST,
 * then use line-by-line classification.
 */

function forceBreakHeaders(text) {
  // For compound headers like "PROFESSIONAL SUMMARY", prevent splitting the space
  // between the two words by adding negative lookbehinds for known preceding words.
  const compoundGuard = {
    "SUMMARY": "PROFESSIONAL",
    "EXPERIENCE": "PROFESSIONAL|WORK",
    "SKILLS": "TECHNICAL",
    "EXPERTISE": "SKILLS",
  };
  const allHeaders = [
    "PROFESSIONAL SUMMARY", "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE",
    "TECHNICAL SKILLS", "SKILLS & EXPERTISE",
    "SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS",
    "LANGUAGES", "CERTIFICATIONS", "CERTIFICATION", "OBJECTIVE",
    "PROFILE", "QUALIFICATIONS", "EMPLOYMENT", "HISTORY",
    "ACHIEVEMENTS", "PUBLICATIONS", "VOLUNTEER", "LEADERSHIP",
    "INTERESTS", "ADDITIONAL", "REFERENCES"
  ];
  // Sort longest first so compound headers are matched and their sub-words get a guard
  const sorted = [...allHeaders].sort((a, b) => b.length - a.length);
  for (const h of sorted) {
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const guard = compoundGuard[h] ? "(?<!" + compoundGuard[h] + "\\s)" : "";
    const pattern = new RegExp("(?<=\\S)" + guard + "\\s+(?=" + escaped + "\\b)", "g");
    text = text.replace(pattern, "\n");
  }
  return text;
}

function forceBreaksAtContactSeparators(text) {
  return text.replace(/(?<=\S)\s+•\s+(?=\S)/g, "\n• ");
}

function normalizeText(text) {
  let t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = t.replace(/\ufeff/g, ""); // BOM
  t = t.replace(/\t+/g, " ");
  t = t.replace(/[ \t]+/g, " ");
  t = forceBreakHeaders(t);
  t = forceBreaksAtContactSeparators(t);
  return t;
}

export function parseResumeText(text) {
  const fullText = text;
  const normalized = normalizeText(text);

  const result = {
    personalInfo: { fullName: "", email: "", phone: "", location: "", website: "", websiteUrl: "", linkedin: "", linkedinUrl: "", github: "", githubUrl: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: []
  };

  // ============================================================
  // CONTACT INFO — extracted from ORIGINAL full text (always works)
  // ============================================================

  const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch) result.personalInfo.email = emailMatch[0];

  const phoneMatch = fullText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) result.personalInfo.phone = phoneMatch[0];

  const emailDomain = result.personalInfo.email ? result.personalInfo.email.split("@")[1] : "";

  // LinkedIn — display text from shorthand, URL only from linkedin.com match (no document-wide fallback)
  let liShorthand = fullText.match(/(?:LinkedIn\s*[/:]?\s*([^\s,;•|]+))/i);
  if (liShorthand) {
    result.personalInfo.linkedin = liShorthand[0].replace(/^https?:\/\//, "").trim();
  }
  let liFullUrl = fullText.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s,;)]+/i);
  if (liFullUrl) {
    result.personalInfo.linkedinUrl = liFullUrl[0].replace(/\/$/, "");
    if (!result.personalInfo.linkedin) {
      const path = liFullUrl[0].replace(/\/$/, "").split("/").pop();
      if (path && path.length > 1) result.personalInfo.linkedin = "LinkedIn/" + path;
    }
  }

  // GitHub — display text from shorthand, URL only from github.com match (no document-wide fallback)
  let ghShorthand = fullText.match(/(?:Git(?:Hub)?\s*[/:]?\s*([^\s,;•|]+))/i);
  let ghPrefix = "GitHub";
  if (ghShorthand) {
    ghPrefix = ghShorthand[0].includes("Github") ? "Github" : "GitHub";
    result.personalInfo.github = ghShorthand[0].replace(/^https?:\/\//, "").trim();
  }
  let ghFullUrl = fullText.match(/https?:\/\/(?:www\.)?github\.com\/[^\s,;)]+/i);
  if (ghFullUrl) {
    result.personalInfo.githubUrl = ghFullUrl[0].replace(/\/$/, "");
    const path = ghFullUrl[0].replace(/\/$/, "").split("/").pop();
    if (path && path.length > 1) {
      result.personalInfo.github = ghPrefix + "/" + path;
    }
  }

  // Website — display text from Portfolio label, URL only near portfolio label (no document-wide scan)
  const pfLabel = fullText.match(/(?:Portfolio|Website)\s*[/:]\s*([^\s,;•|]+)/i);
  if (pfLabel) {
    result.personalInfo.website = pfLabel[1].trim();
  }
  // Look for URL on same line or next line after portfolio label
  if (pfLabel) {
    const afterLabel = fullText.slice(pfLabel.index + pfLabel[0].length, pfLabel.index + pfLabel[0].length + 200);
    const nearUrl = afterLabel.match(/https?:\/\/[^\s,;)]+/i);
    if (nearUrl) {
      const u = nearUrl[0];
      if (!u.toLowerCase().includes("linkedin") && !u.toLowerCase().includes("github")) {
        result.personalInfo.websiteUrl = u;
      }
    }
  }
  // Fallback display text from URL hostname if no label found
  if (!result.personalInfo.website && result.personalInfo.websiteUrl) {
    const host = result.personalInfo.websiteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    result.personalInfo.website = host;
  }

  // ============================================================
  // SPLIT INTO LINES (from normalized text with forced breaks)
  // ============================================================

  const rawLines = normalized.split("\n");
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

  // ============================================================
  // NAME — from normalized text (handle name + contact on same line)
  // ============================================================

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    // Pure name line: 2-4 capitalized words
    if (line.match(/^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3}$/) && !line.includes("@") && !line.match(/http/) && !line.match(/\d/)) {
      result.personalInfo.fullName = line;
      break;
    }
    // Also try: separate name from contact info on same line
    // e.g., "MAHESH PATGAR maheshpatgar488@gmail.com..."
    const nameOnLongLine = line.match(/^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+))\s+(?=([\w.-]+@|www\.|https?:\/\/|\+?\d))/);
    if (nameOnLongLine) {
      result.personalInfo.fullName = nameOnLongLine[1];
      break;
    }
  }

  // Fallback: first line that looks like a name
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

  // ============================================================
  // LOCATION
  // ============================================================

  const majorCities = "Mumbai|Delhi|Bangalore|Bengaluru|Chennai|Hyderabad|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Nagpur|Indore|Bhopal|Visakhapatnam|Patna|Vadodara|Surat|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Varanasi|Srinagar|Aurangabad|Dhanbad|Amritsar|Kanpur|Allahabad|Ranchi|Howrah|Coimbatore|Jabalpur|Gwalior|Vijayawada|Jodhpur|Madurai|Raipur|Kota|Guwahati|Chandigarh|Thiruvananthapuram|New\\s*York|Los\\s*Angeles|Chicago|Houston|Phoenix|Philadelphia|San\\s*Antonio|San\\s*Diego|Dallas|San\\s*Jose|Austin|Jacksonville|Fort\\s*Worth|Columbus|Charlotte|Indianapolis|San\\s*Francisco|Seattle|Denver|Washington|Nashville|Oklahoma\\s*City|Boston|Portland|Las\\s*Vegas|Memphis|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Mesa|Kansas\\s*City|Atlanta|London|Paris|Berlin|Tokyo|Sydney|Melbourne|Toronto|Vancouver|Dubai|Singapore|Hong\\s*Kong";
  const stateRegion = "Maharashtra|Karnataka|Tamil\\s*Nadu|Telangana|Andhra\\s*Pradesh|West\\s*Bengal|Gujarat|Rajasthan|Uttar\\s*Pradesh|Madhya\\s*Pradesh|Kerala|Bihar|Odisha|Punjab|Haryana|Jharkhand|Assam|Chhattisgarh|Uttarakhand|Himachal\\s*Pradesh|India|United\\s*States|USA|UK|Canada|Australia|Germany|France|Japan|Singapore|Dubai";
  const locPatterns = [
    fullText.match(new RegExp("((?:" + majorCities + ")\\s*,\\s*(?:" + stateRegion + "))", "i")),
    fullText.match(new RegExp("([A-Z][A-Za-z\\s.]+,\\s*(?:" + stateRegion + "))", "i")),
    fullText.match(/([A-Z][A-Za-z\s.]+,\s*[A-Z]{2})\b/),
  ];
  for (const m of locPatterns) {
    if (m && !m[1].match(/(LinkedIn|GitHub|Facebook|Twitter|YouTube|Outlook|Portfolio|Email|Phone|Github)/i)) {
      result.personalInfo.location = m[1].trim().replace(/,([^\s])/g, ", $1");
      break;
    }
  }

  // ============================================================
  // CLASSIFY EACH LINE
  // ============================================================

  const entry = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const isBullet = !!(line.match(/^[-•·*→‣▶▪●○■✦✧>]\s*/) || line.match(/^\d+[.)]\s*/));

    // Section header: short, caps or title-case, matches known section keywords, no bullet/date/url/email
    const hasKnownKeyword = !!(line.match(/\b(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS?|LANGUAGES|CERTIFICATIONS?|TECHNICAL\s+SKILLS|PROFESSIONAL\s+SUMMARY|PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|SKILLS?\s*&?\s*EXPERTISE|EXPERTISE|EMPLOYMENT|QUALIFICATIONS?|ACHIEVEMENTS|PUBLICATIONS|VOLUNTEER|LEADERSHIP|INTERESTS|OBJECTIVE|PROFILE|REFERENCES?|HISTORY|ADDITIONAL)\b/i));
    // Line starts with a known header keyword (must have uppercase first letter) → section header
    const startsWithHeader = !!(line.match(/^(?:PROFESSIONAL\s+)?(?=[A-Z])(?:SUMMARY|EXPERIENCE|EDUCATION|SKILLS(?:\s*&?\s*EXPERTISE)?|PROJECTS?|LANGUAGES|CERTIFICATIONS?|TECHNICAL\s+SKILLS|WORK\s+EXPERIENCE|EXPERTISE|EMPLOYMENT|QUALIFICATIONS?|ACHIEVEMENTS|PUBLICATIONS|VOLUNTEER|LEADERSHIP|INTERESTS|OBJECTIVE|PROFILE|REFERENCES?|HISTORY|ADDITIONAL)\b/i));
    const looksLikeHeader = (startsWithHeader || (
      line.length < 70
      && !isBullet
      && !line.match(/http/i)
      && !line.match(/\b(?:19|20)\d{2}\b/)
      && !line.match(/@/)
      && hasKnownKeyword
      && (line.match(/^[A-Z\s&]+$/) || line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*$/))
      && !line.match(/^(and|or|the|is|was|for|with|from|to)\b/i)
    ));

    if (looksLikeHeader) {
      // If header line has extra content after the header keyword, push that as a new line
      const keywordM = line.match(/\b(SUMMARY|EXPERIENCE|EDUCATION|SKILLS(?:\s*&?\s*EXPERTISE)?|PROJECTS?|LANGUAGES|CERTIFICATIONS?|TECHNICAL\s+SKILLS|PROFESSIONAL\s+SUMMARY|PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|EXPERTISE|EMPLOYMENT|QUALIFICATIONS?|ACHIEVEMENTS|PUBLICATIONS|VOLUNTEER|LEADERSHIP|INTERESTS|OBJECTIVE|PROFILE|REFERENCES?|HISTORY|ADDITIONAL)\b/i);
      const headerStr = keywordM ? line.substring(0, keywordM.index + keywordM[0].length) : line;
      const rest = line.substring(headerStr.length).trim();
      entry.push({ type: "section", text: headerStr, section: headerStr.toLowerCase().replace(/[^a-z]/g, "").trim() });
      if (rest && rest.length > 3) {
        // Process remaining content as a new line on next iteration
        lines.splice(i + 1, 0, rest);
      }
      i++;
      continue;
    }

    // Date detection: "May-2024", "May 2024", "Jan -2023", "Oct-2020"
    const monthStr = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s*-?\\s*\\d{4}";
    const dateRangeRegex = new RegExp("\\b" + monthStr + "\\s*[-–to]+\\s*(?:Present|Current|Now|\\d{4}|" + monthStr + ")\\b", "i");
    const yearRangeRegex = /\b\d{4}\s*[-–to]+\s*(?:Present|Current|Now|\d{4})\b/i;
    const hasDateRange = !!(line.match(dateRangeRegex) || line.match(yearRangeRegex));
    const singleDateRegex = new RegExp("\\b" + monthStr + "\\b", "i");
    const hasSingleDate = !!line.match(singleDateRegex) || !!line.match(/\b(?:19|20)\d{2}\b/);

    if (isBullet) {
      entry.push({ type: "bullet", text: line.replace(/^[-•·*→‣▶▪●○■✦✧>\d.)\s]+/, "").trim(), raw: line });
    } else if (hasDateRange) {
      entry.push({ type: "dated", text: line });
    } else if (hasSingleDate && line.length < 120 && !line.match(/^[-•]/)) {
      entry.push({ type: "dated", text: line });
    } else if (line.length > 50) {
      entry.push({ type: "desc", text: line });
    } else if (line.match(/[A-Z][a-z]+/) && line.length < 80) {
      entry.push({ type: "title", text: line });
    } else {
      entry.push({ type: "other", text: line });
    }
    i++;
  }

  // ============================================================
  // SUMMARY — from full text if section-based fails
  // ============================================================

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

  // Fallback: find text between "SUMMARY" section header and "EXPERIENCE" section
  if (!summaryLines.length) {
    const summaryMatch = fullText.match(/(?:professional\s+)?summary\s*\n([\s\S]*?)(?=\n\s*(?:professional\s+)?(?:experience|education|skills|projects|work)\b)/i);
    if (summaryMatch) {
      summaryLines = [summaryMatch[1].trim()];
    }
  }

  // Last resort: grab description lines before the first experience section
  if (!summaryLines.length) {
    for (let j = 0; j < entry.length; j++) {
      if (entry[j].type === "section" && (entry[j].section.match(/experience|education|skills/))) break;
      if (entry[j].type === "desc") summaryLines.push(entry[j].text);
    }
  }

  if (summaryLines.length) result.summary = summaryLines.join(" ").substring(0, 3000);

  // ============================================================
  // SKILLS
  // ============================================================

  const techKeywords = [
    "Python", "JavaScript", "TypeScript", "Java", "C\\+\\+", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "React", "Angular", "Vue", "Node\\.?js", "Express", "Django", "Flask", "Spring", "\\.NET", "Laravel", "Rails",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "CI/CD", "Git",
    "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "GraphQL", "Firebase",
    "HTML", "CSS", "Sass", "Tailwind", "Bootstrap", "Material.UI",
    "Agile", "Scrum", "Jira", "REST", "API", "Microservices",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
    "Linux", "Unix", "Bash", "Shell", "PowerShell",
    "Tableau", "Power.BI", "Excel", "Excel",
    "D3\\.js", "Three\\.js", "Next\\.?js", "Redux", "Webpack", "Babel",
    "Figma", "Sketch", "Photoshop", "Illustrator", "XD",
    "Numpy", "Pandas", "Scikit", "Matplotlib", "Seaborn", "Jupyter",
    "Flutter", "React.Native", "Android", "iOS", "SwiftUI", "UIKit",
    "Postman", "ChatGPT", "OpenAI", "Vite", "Getform", "EmailJS",
    "Critical thinking", "Problem.solving", "Teamwork", "Communication", "Adaptability",
    "Time management", "AI.assisted", "UI optimization", "REST APIs", "Web Development",
    "Frontend Development", "Backend Development", "Full Stack", "Responsive Design",
    "Performance Optimization", "Version Control", "Agile Methodologies",
    "Project Management", "Team Leadership", "Cross.functional Collaboration"
  ];

  let inSkills = false;
  const skillWords = new Set();
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/skill|technology|competenc|expertise/))) {
      inSkills = true; continue;
    }
    if (inSkills && e.type === "section" && !e.section.match(/skill|technology|competenc|expertise/)) break;
    if (inSkills && (e.type === "title" || e.type === "desc" || e.type === "other" || e.type === "bullet")) {
      const parts = e.text.split(/[,;|•\n/]+/);
      for (const p of parts) {
        const words = p.trim().split(/\s+/);
        for (const w of words) {
          const clean = w.replace(/[,.]$/, "").trim();
          if (clean.length > 1 && clean.length < 50) skillWords.add(clean);
        }
      }
    }
  }

  // Also scan original full text for known tech keywords
  for (const kw of techKeywords) {
    try {
      const re = new RegExp("\\b" + kw + "\\b", "i");
      if (re.test(fullText)) {
        skillWords.add(kw.replace(/\\/g, "").replace(/\./g, ""));
      }
    } catch (e) { }
  }

  const skillSeen = new Set();
  result.skills = [...skillWords].filter(s => {
    const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (skillSeen.has(key) || key.length < 2) return false;
    skillSeen.add(key);
    return true;
  }).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // ============================================================
  // EXPERIENCE
  // ============================================================

  let expSection = false;
  let expGroup = null;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/experience|work|employ|history|profession/))) {
      expSection = true; continue;
    }
    if (expSection && e.type === "section" && !e.section.match(/experience|work|employ|history|profession/)) {
      if (!e.section.match(/project|education|skill|summary/)) continue;
      break;
    }
    if (expSection) {
      if (e.type === "dated") {
        if (expGroup) result.experience.push(expGroup);
        expGroup = { company: "", position: "", startDate: "", endDate: "", location: "", description: [], highlights: [] };

        const sdM = e.text.match(/((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*-?\s*\d{4})\b/i);
        if (sdM) expGroup.startDate = sdM[0].trim().replace(/\s+/g, " ");
        const edM = e.text.match(/[-–to]+\s*((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*-?\s*\d{4}|Present|Current|Now)\b/i);
        if (edM) expGroup.endDate = edM[1].trim().replace(/\s+/g, " ");
        if (!expGroup.startDate) {
          const yrM = e.text.match(/\b(?:19|20)\d{2}\b/);
          if (yrM) expGroup.startDate = yrM[0];
        }
        if (!expGroup.endDate) {
          const yrM = e.text.match(/[-–to]+\s*(\d{4})\b/i);
          if (yrM) expGroup.endDate = yrM[1];
        }

        // Position from text before first date
        const datePos = e.text.search(/((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*-?\s*\d{4})\b/i);
        if (datePos > 0) {
          expGroup.position = e.text.substring(0, datePos).trim();
        } else {
          const yrPos = e.text.search(/\b(?:19|20)\d{2}\b/);
          if (yrPos > 0) {
            expGroup.position = e.text.substring(0, yrPos).trim();
          }
        }
        // If text after end date exists, it might be the company
        if (expGroup.endDate) {
          const edIdx = e.text.lastIndexOf(expGroup.endDate);
          const afterDate = e.text.substring(edIdx + expGroup.endDate.length).trim();
          if (afterDate && afterDate.length < 60 && !afterDate.match(/^[•|]/)) {
            expGroup.company = afterDate;
          }
        }
      } else if (e.type === "bullet" && expGroup) {
        expGroup.highlights.push(e.text);
      } else if (e.type === "title" && expGroup) {
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

  // ============================================================
  // EDUCATION
  // ============================================================

  let eduSection = false;
  let eduGroup = null;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/education|academic|qualification|degree|university|college/i))) {
      eduSection = true; continue;
    }
    if (eduSection && e.type === "section" && !e.section.match(/education|academic|qualification|degree|university|college/i)) break;
    if (eduSection) {
      // Use \B (non-word boundary) before M\. to avoid matching "Getform.io" patterns
      const hasDegree = !!(e.text.match(/(Bachelor|Master|PhD|Doctorate|B\.\w{2,}|M\.(?:Sc|A|BA|Ed|Tech|Phil|Res|S)\b|Associate|High\s*School|MBA|BTech|MTech|BE\b|ME\b|BCA|MCA|BSc|MSc|BA\b|MA\b)/i));
      const hasInst = !!(e.text.match(/(University|College|Institute|School|Academy|IIT|NIT|IIIT|DTSS)/i));
      const hasYear = !!e.text.match(/\b(?:19|20)\d{2}\b/);

      if ((hasDegree || hasInst) && e.type !== "bullet") {
        if (eduGroup) result.education.push(eduGroup);
        eduGroup = { institution: "", degree: "", fieldOfStudy: "", location: "", startDate: "", endDate: "", gpa: "" };

        if (hasInst) {
          eduGroup.institution = e.text.replace(/[-–].*$/, "").trim();
        }
        if (hasDegree) {
          const degText = e.text;
          const degreeKW = degText.match(/(Bachelor(?:'s)?|Master(?:'s)?|PhD|Doctorate|B\.\w+|M\.\w+|Associate|High\s*School|MBA|BTech|MTech|BE\b|ME\b|BCA|MCA|BSc|MSc|BA\b|MA\b)/i);
          if (degreeKW) {
            const kw = degreeKW[0];
            const pos = degText.indexOf(kw);
            const rest = degText.substring(pos + kw.length).trim();
            const stopAt = rest.search(/\bin\s/);
            const fullDegree = stopAt > -1 ? (kw + " " + rest.substring(0, stopAt).trim()) : (kw + " " + rest);
            eduGroup.degree = fullDegree.trim();
          }
          const fieldM = e.text.match(/\bin\s+(.+?)(?:\s+GPA|$)/);
          if (fieldM) eduGroup.fieldOfStudy = fieldM[1].trim();
          const gpam = e.text.match(/GPA:?\s*([\d./\s]+)/i);
          if (gpam) eduGroup.gpa = gpam[1].trim();
        }

        const yrM = e.text.match(/(\d{4})\s*[-–to]+\s*(\d{4}|Present|Expected)\b/i);
        if (yrM) { eduGroup.startDate = yrM[1]; eduGroup.endDate = yrM[2]; }
        else if (!yrM && hasYear) {
          const sy = e.text.match(/\b((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*-?\s*)?(\d{4})\b/i);
          if (sy) eduGroup.endDate = sy[0].trim();
        }
      } else if (eduGroup && hasYear) {
        const yrM = e.text.match(/(\d{4})\s*[-–to]+\s*(\d{4}|Present|Expected)\b/i);
        if (yrM) { eduGroup.startDate = yrM[1]; eduGroup.endDate = yrM[2]; }
        else if (!eduGroup.endDate) {
          const sy = e.text.match(/\b((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*-?\s*)?(\d{4})\b/i);
          if (sy) eduGroup.endDate = sy[0].trim();
        }
      } else if (eduGroup && e.text.match(/GPA/i)) {
        eduGroup.gpa = e.text.replace(/.*?GPA:?\s*/i, "").trim();
      }
    }
  }
  if (eduGroup) result.education.push(eduGroup);

  // Merge adjacent education entries where one has institution and next has degree (separate lines)
  let merged = true;
  while (merged) {
    merged = false;
    for (let ei = 1; ei < result.education.length; ei++) {
      const prev = result.education[ei - 1];
      const curr = result.education[ei];
      if (prev.institution && !prev.degree && (curr.degree || curr.gpa) && !curr.institution) {
        prev.degree = curr.degree || prev.degree;
        prev.fieldOfStudy = curr.fieldOfStudy || prev.fieldOfStudy;
        prev.gpa = curr.gpa || prev.gpa;
        prev.endDate = curr.endDate || prev.endDate;
        result.education.splice(ei, 1);
        merged = true;
        break;
      }
    }
  }

  // If education section wasn't found but we have degree patterns in full text, extract them
  if (!result.education.length) {
    const eduBlock = fullText.match(/(?:education|academic|qualification|degree|university|college)[\s\S]*?(?=\n\s*(?:experience|skills|projects|summary|professional)\b)/i);
    if (eduBlock) {
      const lines2 = eduBlock[0].split("\n").map(l => l.trim()).filter(Boolean);
      for (const line of lines2.slice(1)) {
        if (line.match(/(University|College|Institute|School|Academy|IIT|NIT|IIIT|DTSS)/i)) {
          result.education.push({ institution: line.replace(/[-–].*$/, "").trim(), degree: "", fieldOfStudy: "", location: "", startDate: "", endDate: "", gpa: "" });
        } else if (line.match(/(Bachelor|Master|PhD|Doctorate|B\.\w{2,}|M\.(?:Sc|A|BA|Ed|Tech|Phil|Res|S)\b|Associate|MBA|BTech|MTech|BE\b|ME\b|BCA|MCA|BSc|MSc|BA\b|MA\b)/i) && result.education.length) {
          const last = result.education[result.education.length - 1];
          last.degree = line;
        }
      }
    }
  }

  // ============================================================
  // PROJECTS
  // ============================================================

  let projSection = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/project/i))) { projSection = true; continue; }
    if (projSection && e.type === "section" && !e.section.match(/project/i)) break;
    if (projSection) {
      const urlInLine = e.text.match(/(https?:\/\/[^\s]+)/i);
      if (urlInLine && (e.type === "title" || e.type === "desc")) {
        const projName = e.text.replace(/(https?:\/\/[^\s]+).*/i, "").trim().replace(/\s*hyperlink:?\s*$/i, "");
        if (projName && projName.length < 60) {
          result.projects.push({ name: projName, description: [], technologies: [], url: urlInLine[1] });
        } else if (result.projects.length) {
          result.projects[result.projects.length - 1].url = urlInLine[1];
        }
      } else if (e.type === "title" && !urlInLine) {
        if (e.text.match(/^[A-Z][a-zA-Z0-9]+/) && e.text.length >= 4 && e.text.length < 32 && !e.text.match(/^(Technologies|Skills|A responsive|Built a|Developed a|Created|Implemented|Designed|Worked|Led|Managed|Optimized|Improved|Reduced|Increased)/i) && !e.text.match(/\.(com|org|net|io)\b/i)) {
          result.projects.push({ name: e.text, description: [], technologies: [], url: "" });
        }
      } else if ((e.type === "bullet" || e.type === "desc") && result.projects.length) {
        const t = e.text;
        if (!t.match(/^(Technologies|Skills)/i) && !urlInLine) {
          result.projects[result.projects.length - 1].description.push(t);
        }
      }
    }
  }
  for (const proj of result.projects) {
    for (const e of entry) {
      if ((e.type === "desc" || e.type === "title" || e.type === "bullet") && e.text.match(/^Technologies:/i)) {
        const techs = e.text.replace(/^Technologies:\s*/i, "").split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        proj.technologies.push(...techs);
      }
    }
    const tseen = new Set();
    proj.technologies = proj.technologies.filter(t => {
      const key = t.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (tseen.has(key)) return false;
      tseen.add(key);
      return true;
    });
  }

  // ============================================================
  // CERTIFICATIONS
  // ============================================================

  let certSection = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/certif|license|credential/i))) { certSection = true; continue; }
    if (certSection && e.type === "section" && !e.section.match(/certif|license|credential/i)) break;
    if (certSection && (e.type === "title" || e.type === "bullet")) {
      result.certifications.push({ name: e.text.replace(/^[-•\s]+/, "").trim(), issuer: "", date: "" });
    }
  }

  // ============================================================
  // LANGUAGES
  // ============================================================

  let langSection = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/language/i))) { langSection = true; continue; }
    if (langSection && e.type === "section" && !e.section.match(/language/i)) break;
    if (langSection) {
      const langs = e.text.split(/[,;•]+/).map(l => l.replace(/\(.*\)/, "").trim()).filter(l => l.length > 1);
      result.languages.push(...langs);
    }
  }

  // ============================================================
  // FINAL CLEANUP
  // ============================================================

  result.experience = result.experience.filter(e => e.company || e.position || e.highlights.length || e.description.length);
  result.education = result.education.filter(e => e.institution || e.degree);

  // Deduplicate skills: remove single-word fragments when the multi-word form exists
  const skillSet = new Set(result.skills.map(s => s.replace(/[.,]$/, "").trim()).filter(s => s.length > 1));
  const skillList = [...skillSet];
  const filtered = skillList.filter(s => {
    if (!s.includes(" ")) {
      const sl = s.toLowerCase();
      for (const other of skillList) {
        if (other !== s && other.toLowerCase().split(/\s+/).includes(sl)) return false;
      }
    }
    return true;
  });
  result.skills = filtered.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  return result;
}
