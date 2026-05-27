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

  const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch) result.personalInfo.email = emailMatch[0];

  const phoneMatch = fullText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) result.personalInfo.phone = phoneMatch[0];

  // Extract email domain once for exclusion
  const emailDomain = result.personalInfo.email ? result.personalInfo.email.split("@")[1] : "";

  let liMatch = fullText.match(/(?:linkedin\.com\/[^\s,;]+)/i);
  if (!liMatch) liMatch = fullText.match(/(?:LinkedIn\s*[/:]?\s*([^\s,;•|]+))/i);
  if (liMatch) {
    const raw = liMatch[0].replace(/^https?:\/\//, "").replace(/^LinkedIn\s*[/:]\s*/i, "");
    result.personalInfo.linkedin = "https://" + (raw.includes("linkedin.com") ? raw : "linkedin.com/in/" + raw);
  }

  let ghMatch = fullText.match(/(?:github\.com\/[^\s,;]+)/i);
  if (!ghMatch) ghMatch = fullText.match(/(?:Git(?:Hub)?\s*[/:]?\s*([^\s,;•|]+))/i);
  if (ghMatch) {
    const raw = ghMatch[0].replace(/^https?:\/\//, "").replace(/^Git(?:Hub)?\s*[/:]\s*/i, "");
    result.personalInfo.github = "https://" + (raw.includes("github.com") ? raw : "github.com/" + raw);
  }

  // Website / Portfolio — exclude email domains and linkedin/github
  const urlMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?([\w-]+\.)+(com|org|net|io|dev|app)(?:\/[^\s,;]*)?/i);
  if (urlMatch) {
    const u = urlMatch[0].toLowerCase();
    if (!u.includes("linkedin") && !u.includes("github") && !u.includes(emailDomain.replace(/\./g, "").replace(/com/, ""))) {
      result.personalInfo.website = u.startsWith("http") ? u : "https://" + u;
    }
  }
  if (!result.personalInfo.website) {
    const pfMatch = fullText.match(/(?:Portfolio|Website)\s*[/:]\s*([^\s,;•|]+)/i);
    if (pfMatch) {
      const val = pfMatch[1].trim();
      if (!val.toLowerCase().includes("linkedin") && !val.toLowerCase().includes("github") && val.match(/\.(com|org|net|io|dev|app|in|co)\b/i)) {
        result.personalInfo.website = val.startsWith("http") ? val : "https://" + val;
      }
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
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    if (line.match(/^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3}$/)) {
      if (!line.includes("@") && !line.match(/http/) && !line.match(/\d/) && !line.match(/^[A-Z][a-z]/)) {
        result.personalInfo.fullName = line;
        break;
      }
    }
  }
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
  const majorCities = "Mumbai|Delhi|Bangalore|Bengaluru|Chennai|Hyderabad|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Nagpur|Indore|Bhopal|Visakhapatnam|Patna|Vadodara|Surat|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Varanasi|Srinagar|Aurangabad|Dhanbad|Amritsar|Kanpur|Allahabad|Ranchi|Howrah|Coimbatore|Jabalpur|Gwalior|Vijayawada|Jodhpur|Madurai|Raipur|Kota|Guwahati|Chandigarh|Thiruvananthapuram|New\\s*York|Los\\s*Angeles|Chicago|Houston|Phoenix|Philadelphia|San\\s*Antonio|San\\s*Diego|Dallas|San\\s*Jose|Austin|Jacksonville|Fort\\s*Worth|Columbus|Charlotte|Indianapolis|San\\s*Francisco|Seattle|Denver|Washington|Nashville|Oklahoma\\s*City|Boston|Portland|Las\\s*Vegas|Memphis|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Mesa|Kansas\\s*City|Atlanta|London|Paris|Berlin|Tokyo|Sydney|Melbourne|Toronto|Vancouver|Dubai|Singapore|Hong\\s*Kong";
  const stateRegion = "Maharashtra|Karnataka|Tamil\\s*Nadu|Telangana|Andhra\\s*Pradesh|West\\s*Bengal|Gujarat|Rajasthan|Uttar\\s*Pradesh|Madhya\\s*Pradesh|Kerala|Bihar|Odisha|Punjab|Haryana|Jharkhand|Assam|Chhattisgarh|Uttarakhand|Himachal\\s*Pradesh|India|United\\s*States|USA|UK|Canada|Australia|Germany|France|Japan|Singapore|Dubai";
  const locPatterns = [
    fullText.match(new RegExp("((?:" + majorCities + ")\\s*,\\s*(?:" + stateRegion + "))", "i")),
    fullText.match(new RegExp("([A-Z][A-Za-z\\s.]+,\\s*(?:" + stateRegion + "))", "i")),
    fullText.match(/([A-Z][A-Za-z\s.]+,\s*[A-Z]{2})\b/),
  ];
  for (const m of locPatterns) {
    if (m && !m[1].match(/(LinkedIn|GitHub|Facebook|Twitter|YouTube|Outlook|Portfolio|Email|Phone)/i)) {
      result.personalInfo.location = m[1].trim();
      break;
    }
  }
  // If location still has no space after comma (e.g., "Mumbai,Maharashtra"), normalize it
  if (result.personalInfo.location) {
    result.personalInfo.location = result.personalInfo.location.replace(/,([^\s])/g, ", $1");
  }

  // --- CLASSIFY EACH LINE ---
  const entry = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Section header: short, all-caps (or mostly), matches known keywords
    const isSection = line.length < 60
      && !line.match(/^[-•·*→‣▶▪●○■✦✧>\d.)]/)
      && !line.match(/http/i)
      && !line.match(/\b(?:19|20)\d{2}\b/)
      && !line.match(/@/)
      && line.match(/^[A-Z\s&]+$/)
      && line.match(/\b(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|LANGUAGES|CERTIFICATIONS?|TECHNICAL\s+SKILLS|PROFESSIONAL\s+SUMMARY|EXPERTISE|WORK\s*EXPERIENCE|EMPLOYMENT|QUALIFICATION)\b/i);

    if (isSection) {
      entry.push({ type: "section", text: line, section: line.toLowerCase().replace(/[^a-z]/g, "").trim() });
      i++;
      continue;
    }

    // Date patterns: "May-2024", "May 2024", "Jan -2023", "Oct-2020"
    const monthStr = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s*-?\\s*\\d{4}";
    const dateRangeRegex = new RegExp("\\b" + monthStr + "\\s*[-–to]+\\s*(?:Present|Current|Now|\\d{4}|" + monthStr + ")\\b", "i");
    const yearRangeRegex = /\b\d{4}\s*[-–to]+\s*(?:Present|Current|Now|\d{4})\b/i;
    const hasDateRange = !!(line.match(dateRangeRegex) || line.match(yearRangeRegex));
    const singleDateRegex = new RegExp("\\b" + monthStr + "\\b", "i");
    const hasSingleDate = !!line.match(singleDateRegex) || !!line.match(/\b(?:19|20)\d{2}\b/);

    const isBullet = line.match(/^[-•·*→‣▶▪●○■✦✧>]\s*/) || line.match(/^\d+[.)]\s*/);

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

  // --- SUMMARY ---
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
  if (!summaryLines.length) {
    for (let j = 0; j < entry.length; j++) {
      if (entry[j].type === "section" && (entry[j].section.match(/experience|education|skills/))) break;
      if (j > 2 && entry[j].type === "desc") summaryLines.push(entry[j].text);
    }
  }
  if (summaryLines.length) result.summary = summaryLines.join(" ").substring(0, 3000);

  // --- SKILLS ---
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
    "D3\\.js", "Three\\.js", "Next\\.?js", "Redux", "Webpack", "Babel",
    "Figma", "Sketch", "Photoshop", "Illustrator", "XD",
    "Numpy", "Pandas", "Scikit", "Matplotlib", "Seaborn", "Jupyter",
    "Flutter", "React.Native", "Android", "iOS", "SwiftUI", "UIKit",
    "Postman", "ChatGPT", "OpenAI", "Vite", "Getform", "EmailJS",
    "Critical thinking", "Problem.solving", "Teamwork", "Communication", "Adaptability"
  ];

  let inSkills = false;
  const skillWords = new Set();
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/skill|technology|competenc|expertise/))) {
      inSkills = true; continue;
    }
    if (inSkills && e.type === "section") break;
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
  for (const kw of techKeywords) {
    try {
      const re = new RegExp("\\b" + kw + "\\b", "i");
      if (re.test(fullText)) {
        skillWords.add(kw.replace(/\\/g, "").replace(/\./g, ""));
      }
    } catch (e) { }
  }

  const seen = new Set();
  result.skills = [...skillWords].filter(s => {
    const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key) || key.length < 2) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // --- EXPERIENCE ---
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

        // Extract dates individually (don't split the full match)
        const sdM = e.text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*-?\s*\d{4}\b/i);
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

        // Position is the text before the first date occurrence
        const datePos = e.text.search(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*-?\s*\d{4}\b/i);
        if (datePos > 0) {
          expGroup.position = e.text.substring(0, datePos).trim();
        } else {
          const yrPos = e.text.search(/\b(?:19|20)\d{2}\b/);
          if (yrPos > 0) {
            expGroup.position = e.text.substring(0, yrPos).trim();
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

  // --- EDUCATION ---
  let eduSection = false;
  let eduGroup = null;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/education|academic|qualification|degree|university|college/i))) {
      eduSection = true; continue;
    }
    // Break on any non-education section
    if (eduSection && e.type === "section" && !e.section.match(/education|academic|qualification|degree|university|college/i)) break;
    if (eduSection) {
      const hasDegree = !!(e.text.match(/(Bachelor|Master|PhD|Doctorate|B\.\w+|M\.\w+|Associate|High\s*School|MBA|BTech|MTech|BE\b|ME\b|BCA|MCA|BSc|MSc|BA\b|MA\b)/i));
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

  // --- PROJECTS ---
  let projSection = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/project/i))) { projSection = true; continue; }
    if (projSection && e.type === "section" && !e.section.match(/project/i)) break;
    if (projSection && (e.type === "title" || e.type === "desc")) {
      const urlInLine = e.text.match(/(https?:\/\/[^\s]+)/i);
      if (urlInLine) {
        const projName = e.text.replace(/(https?:\/\/[^\s]+).*/i, "").trim();
        if (projName && projName.length < 60) {
          result.projects.push({ name: projName, description: [], technologies: [], url: urlInLine[1] });
        } else {
          if (result.projects.length) {
            result.projects[result.projects.length - 1].url = urlInLine[1];
          }
        }
      } else if (e.text.match(/^[A-Z][a-zA-Z0-9]+/) && e.text.length < 40 && !e.text.match(/^(Technologies|Skills)/i)) {
        result.projects.push({ name: e.text, description: [], technologies: [], url: "" });
      }
    } else if (projSection && e.type === "bullet" && result.projects.length) {
      result.projects[result.projects.length - 1].description.push(e.text);
    }
  }
  for (const proj of result.projects) {
    for (const e of entry) {
      if ((e.type === "desc" || e.type === "title" || e.type === "bullet") && e.text.match(/^Technologies:/i)) {
        const techs = e.text.replace(/^Technologies:\s*/i, "").split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        proj.technologies.push(...techs);
      }
    }
  }
  // Deduplicate technologies per project
  for (const proj of result.projects) {
    const tseen = new Set();
    proj.technologies = proj.technologies.filter(t => {
      const key = t.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (tseen.has(key)) return false;
      tseen.add(key);
      return true;
    });
  }

  // --- CERTIFICATIONS ---
  let certSection = false;
  for (const e of entry) {
    if (e.type === "section" && (e.section.match(/certif|license|credential/i))) { certSection = true; continue; }
    if (certSection && e.type === "section" && !e.section.match(/certif|license|credential/i)) break;
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
      const langs = e.text.split(/[,;•]+/).map(l => l.replace(/\(.*\)/, "").trim()).filter(l => l.length > 1);
      result.languages.push(...langs);
    }
  }

  // Final cleanup
  result.experience = result.experience.filter(e => e.company || e.position || e.highlights.length || e.description.length);
  result.education = result.education.filter(e => e.institution || e.degree);
  result.skills = [...new Set(result.skills.map(s => s.replace(/[.,]$/, "").trim()).filter(s => s.length > 1))];

  return result;
}
