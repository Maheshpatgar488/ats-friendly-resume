export function parseResumeText(text) {
  const lines = text.split("\n").map(l => l.trim());
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

  // Email
  const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch) result.personalInfo.email = emailMatch[0];

  // Phone
  const phoneMatch = fullText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) result.personalInfo.phone = phoneMatch[0];

  // LinkedIn
  const linkedinMatch = fullText.match(/(linkedin\.com\/[^\s,;]+|linkedin\.com\/in\/[^\s,;]+)/i);
  if (linkedinMatch) result.personalInfo.linkedin = "https://" + linkedinMatch[0].replace(/^https?:\/\//, "");

  // GitHub
  const githubMatch = fullText.match(/(github\.com\/[^\s,;]+)/i);
  if (githubMatch) result.personalInfo.github = "https://" + githubMatch[0].replace(/^https?:\/\//, "");

  // Website
  const websiteMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?([\w-]+\.)+(com|org|net|io|dev|app|me)(?:\/[^\s,;]*)?/i);
  if (websiteMatch) {
    const url = websiteMatch[0].toLowerCase();
    if (!url.includes("linkedin") && !url.includes("github") && !url.includes("gmail")) {
      result.personalInfo.website = url.startsWith("http") ? url : "https://" + url;
    }
  }

  // Name: look through first 10 non-empty lines for a name
  const nonEmpty = lines.filter(l => l.length > 0);
  for (let i = 0; i < Math.min(10, nonEmpty.length); i++) {
    const line = nonEmpty[i];
    if (line.length < 3 || line.length > 60) continue;
    if (line.match(/^(experience|education|skills|summary|profile|work|project|contact|phone|email|linkedin|github|web|page|resume|cv|curriculum)/i)) break;
    if (line.match(/^[A-Z\s]{15,}$/)) continue;
    if (line.includes("@") || line.match(/\d{4}/) || line.match(/http/)) continue;
    if (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/) || line.match(/^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3}$/)) {
      result.personalInfo.fullName = line;
      break;
    }
  }

  // Build a cleaned line array (skip page numbers, PDF artifacts)
  const cleaned = [];
  for (const line of lines) {
    if (!line) continue;
    if (line.match(/^\d{1,3}\s*of\s*\d{1,3}$/i)) continue;
    if (line.match(/^page\s*\d+$/i)) continue;
    if (line.length === 1) continue;
    cleaned.push(line);
  }

  // Section detection (more flexible)
  const sectionHeaders = {
    summary: /^(summary|professional\s*summary|profile|objective|about\s*me|career\s*objective)/i,
    experience: /^(experience|work\s*experience|employment|work\s*history|professional\s*experience|relevant\s*experience)/i,
    education: /^(education|academic|qualification|degrees?|educational\s*background)/i,
    skills: /^(skills|technical\s*skills|core\s*competencies|technologies|expertise|programming\s*skills|key\s*skills)/i,
    projects: /^(projects|personal\s*projects|key\s*projects|academic\s*projects)/i,
    certifications: /^(certifications|certificates|licenses?|credentials|professional\s*development)/i,
    languages: /^(languages)/i
  };

  let currentSection = null;
  const sectionContent = {};

  for (const line of cleaned) {
    let matched = false;
    for (const [section, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line) && line.length < 50) {
        currentSection = section;
        sectionContent[section] = sectionContent[section] || [];
        matched = true;
        break;
      }
    }
    if (!matched && currentSection) {
      sectionContent[currentSection].push(line);
    }
  }

  // Parse summary
  if (sectionContent.summary) {
    result.summary = sectionContent.summary.join(" ").substring(0, 3000);
  }

  // Parse skills (also scan entire text for tech keywords)
  if (sectionContent.skills) {
    const skillText = sectionContent.skills.join(" ");
    result.skills = skillText.split(/[,|•\-\n;/]+/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
  }
  // Also find tech keywords anywhere in resume
  if (result.skills.length < 5) {
    const techKeywords = [
      "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
      "React", "Angular", "Vue", "Node", "Express", "Django", "Flask", "Spring", "ASP\\.NET", "Laravel", "Rails",
      "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "CI/CD", "Git",
      "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "GraphQL", "Firebase",
      "HTML", "CSS", "Sass", "Tailwind", "Bootstrap", "Material UI",
      "Agile", "Scrum", "Jira", "REST", "API", "Microservices",
      "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
      "Linux", "Unix", "Bash", "Shell", "PowerShell",
      "Tableau", "Power BI", "Excel", "SQL Server", "Oracle"
    ];
    const found = new Set(result.skills.map(s => s.toLowerCase()));
    for (const kw of techKeywords) {
      const regex = new RegExp("\\b" + kw.replace(/\./g, "\\.") + "\\b", "i");
      if (regex.test(fullText) && !found.has(kw.toLowerCase())) {
        result.skills.push(kw);
      }
    }
  }

  // Date patterns for experience blocks
  const dateRegex = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}\b/i;
  const dateRangeRegex = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}\s*[-–to]+\s*(Present|Current|Now|(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4})\b/i;
  const yearRangeRegex = /\b(\d{4})\s*[-–to]+\s*(Present|Current|Now|\d{4})\b/i;

  // Parse experience
  if (sectionContent.experience) {
    const expLines = sectionContent.experience;
    let currentJob = null;
    for (const line of expLines) {
      const hasDateRange = dateRangeRegex.test(line) || yearRangeRegex.test(line);
      const hasDate = dateRegex.test(line);
      const isBullet = line.startsWith("-") || line.startsWith("•") || line.match(/^\d+[.)]/);
      const isShort = line.length < 80 && hasDate;

      // Detect new job entry: either contains date range, or is a short company-like line
      if (hasDateRange || (isShort && !isBullet && currentJob)) {
        if (currentJob) result.experience.push(currentJob);
        currentJob = {
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          location: "",
          description: [],
          highlights: []
        };

        // Extract dates
        let dateStr = "";
        let drMatch;
        if ((drMatch = line.match(dateRangeRegex))) {
          dateStr = drMatch[0];
          const parts = dateStr.split(/[-–to]+/);
          currentJob.startDate = parts[0]?.trim() || "";
          currentJob.endDate = parts[1]?.trim() || "";
        } else if ((drMatch = line.match(yearRangeRegex))) {
          dateStr = drMatch[0];
          const parts = dateStr.split(/[-–to]+/);
          currentJob.startDate = parts[0]?.trim() || "";
          currentJob.endDate = parts[1]?.trim() || "";
        }

        // Remove date string and split by separator
        const remaining = line.replace(dateStr, "").trim();

        // Try to extract company | position | location
        const pipeParts = remaining.split("|").map(s => s.trim()).filter(Boolean);
        if (pipeParts.length >= 2) {
          currentJob.position = pipeParts[0];
          currentJob.company = pipeParts.slice(1).join(" | ");
        } else {
          const dashParts = remaining.split(" - ").map(s => s.trim()).filter(Boolean);
          if (dashParts.length >= 2) {
            currentJob.position = dashParts[0];
            const rest = dashParts.slice(1).join(" - ");
            const locParts = rest.split(",");
            if (locParts.length >= 2 && locParts[locParts.length - 1].trim().match(/^[A-Z]{2}/)) {
              currentJob.company = locParts.slice(0, -1).join(",").trim();
              currentJob.location = locParts[locParts.length - 1].trim();
            } else {
              currentJob.company = rest;
            }
          } else {
            currentJob.company = remaining.replace(/^[-•\s,]+/, "").trim();
          }
        }
      } else if (currentJob) {
        if (isBullet) {
          currentJob.highlights.push(line.replace(/^[-•\d.)\s]+/, "").trim());
        } else if (line.length > 5) {
          currentJob.description.push(line);
        }
      }
    }
    if (currentJob) result.experience.push(currentJob);
  }

  // Parse education
  if (sectionContent.education) {
    let currentEdu = null;
    for (const line of sectionContent.education) {
      const hasDegree = line.match(/(Bachelor|Master|PhD|Doctorate|B\.\w+|M\.\w+|Associate|High\s*School|MBA|BTech|MTech|BE\b|ME\b|BCA|MCA|BSc|MSc|BA\b|MA\b)/i);
      const hasInstitution = line.match(/(University|College|Institute|School|Academy|IIT|NIT|IIIT)/i);
      const hasYear = line.match(/\b\d{4}\b/);
      const isBullet = line.startsWith("-") || line.startsWith("•");

      if ((hasDegree || hasInstitution) && !isBullet && line.length < 100) {
        if (currentEdu) result.education.push(currentEdu);
        currentEdu = { institution: "", degree: "", fieldOfStudy: "", location: "", startDate: "", endDate: "", gpa: "" };
        if (hasInstitution) {
          currentEdu.institution = line.replace(/[,•].*$/, "").trim();
        }
        if (hasDegree) {
          const dm = line.match(/(Bachelor|Master|PhD|Doctorate|B\.\w+|M\.\w+|Associate|High\s*School|MBA|BTech|MTech|BE\b|ME\b|BCA|MCA|BSc|MSc|BA\b|MA\b(?:\s+in\s+\w+)?)/i);
          if (dm) currentEdu.degree = dm[0];
          // Field of study after "in"
          const fieldMatch = line.match(/(?:Bachelor|Master|PhD|B\.\w+|M\.\w+)\s+(?:of\s+)?(?:Science|Arts|Engineering|Technology|Commerce|Computer|Science|Mathematics|Physics|Chemistry|Biology|Business|Administration)(?:\s+in\s+(.+))?/i);
          if (fieldMatch && fieldMatch[1]) {
            currentEdu.fieldOfStudy = fieldMatch[1];
          } else if (line.match(/in\s+(.+?)(?:[,–]|\s*\d{4}|$)/i)) {
            const fm = line.match(/in\s+(.+?)(?:[,–]|\s*$)/i);
            if (fm) currentEdu.fieldOfStudy = fm[1];
          }
        }
      } else if (currentEdu && hasYear && !isBullet) {
        const yr = line.match(/(\d{4})\s*[-–to]+\s*(\d{4}|Present|Expected)/i);
        if (yr) {
          currentEdu.startDate = yr[1];
          currentEdu.endDate = yr[2];
        }
      } else if (currentEdu && line.match(/GPA|gpa/i)) {
        currentEdu.gpa = line.replace(/GPA:?\s*/i, "").trim();
      }
    }
    if (currentEdu) result.education.push(currentEdu);
  }

  // Parse projects
  if (sectionContent.projects) {
    let currentProj = null;
    for (const line of sectionContent.projects) {
      const isBullet = line.startsWith("-") || line.startsWith("•");
      if (!isBullet && line.length > 3 && line.length < 100) {
        if (currentProj) result.projects.push(currentProj);
        currentProj = { name: line, description: [], technologies: [], url: "" };
        const urlMatch = line.match(/(https?:\/\/[^\s,;]+)/i);
        if (urlMatch) currentProj.url = urlMatch[0];
      } else if (currentProj) {
        if (isBullet) {
          currentProj.description.push(line.replace(/^[-•\s]+/, "").trim());
        }
      }
    }
    if (currentProj) result.projects.push(currentProj);
  }

  // Certifications
  if (sectionContent.certifications) {
    for (const line of sectionContent.certifications) {
      if (line.length > 3 && !line.startsWith("-") && !line.startsWith("•")) {
        result.certifications.push({ name: line, issuer: "", date: "" });
      }
    }
  }

  // Languages
  if (sectionContent.languages) {
    for (const line of sectionContent.languages) {
      const langs = line.split(/[,;]+/).map(l => l.replace(/\(.*\)/, "").trim()).filter(l => l.length > 1);
      result.languages.push(...langs);
    }
  }

  // Location
  const locPatterns = [
    fullText.match(/([A-Z][a-zA-Z\s]+,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY))\b/),
    fullText.match(/([A-Z][a-zA-Z\s]+,\s*(?:United\s*States|USA|UK|Canada|Australia|India|Germany|France|Japan|Singapore|Dubai))/i),
    fullText.match(/([A-Z][a-zA-Z\s]+\s+(?:United\s*States|USA|UK))/i),
  ];
  for (const m of locPatterns) {
    if (m && !m[1].match(/(LinkedIn|GitHub|Facebook|Twitter|YouTube)/i)) {
      result.personalInfo.location = m[1].trim();
      break;
    }
  }

  // Fallback: if no name found, try the first non-empty line
  if (!result.personalInfo.fullName && lines.length > 0) {
    const first = lines.find(l => l.length > 3 && l.length < 60 && !l.includes("@") && !l.match(/^[A-Z\s]{20,}$/));
    if (first) result.personalInfo.fullName = first;
  }

  // Fallback: if no summary and no experience/education/skills, try the first paragraph after name as summary
  if (!result.summary && !result.experience.length && !result.education.length) {
    const idx = lines.findIndex(l => l.includes(result.personalInfo.fullName) || l.includes(result.personalInfo.email));
    if (idx >= 0) {
      const afterName = lines.slice(idx + 1).filter(l => l.length > 20).slice(0, 3);
      if (afterName.length) result.summary = afterName.join(" ").substring(0, 1000);
    }
  }

  return result;
}
