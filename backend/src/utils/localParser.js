export function parseResumeText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const fullText = text;
  const result = {
    personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", github: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: []
  };

  // Email
  const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) result.personalInfo.email = emailMatch[0];

  // Phone
  const phoneMatch = fullText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) result.personalInfo.phone = phoneMatch[0];

  // LinkedIn
  const linkedinMatch = fullText.match(/linkedin\.com\/[^\s]+/i);
  if (linkedinMatch) result.personalInfo.linkedin = "https://" + linkedinMatch[0];

  // GitHub
  const githubMatch = fullText.match(/github\.com\/[^\s]+/i);
  if (githubMatch) result.personalInfo.github = "https://" + githubMatch[0];

  // Name: first non-empty line that's not a header/section
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 60 && !line.match(/^(experience|education|skills|summary|profile|work|project|contact|phone|email|linkedin)/i) && !line.match(/^[A-Z\s]{10,}$/) && !line.includes("@")) {
      result.personalInfo.fullName = line;
      break;
    }
  }

  // Identify sections
  const sectionHeaders = {
    summary: /^(summary|profile|professional\s*summary|objective|about\s*me)/i,
    experience: /^(experience|work\s*experience|employment|work\s*history|professional\s*experience)/i,
    education: /^(education|academic|qualification|degrees?)/i,
    skills: /^(skills|technical\s*skills|core\s*competencies|technologies|expertise)/i,
    projects: /^(projects|personal\s*projects|key\s*projects)/i,
    certifications: /^(certifications|certificates|licenses?|credentials)/i,
    languages: /^(languages)/i
  };

  let currentSection = null;
  let sectionContent = {};

  for (const line of lines) {
    let matched = false;
    for (const [section, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line)) {
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
    result.summary = sectionContent.summary.join(" ").substring(0, 1000);
  }

  // Parse skills
  if (sectionContent.skills) {
    const skillText = sectionContent.skills.join(" ");
    result.skills = skillText.split(/[,|•\-\n;]+/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
  }

  // Parse experience
  if (sectionContent.experience) {
    const expLines = sectionContent.experience;
    let currentJob = null;
    for (const line of expLines) {
      // Date pattern
      const dateMatch = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)[a-z]*\s*\d{4}\s*[-–to]+\s*(Present|Current|\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})/i);
      // Company line often has dates or is all caps / title case
      if (dateMatch || (line.includes(" at ") || line.includes(",") && line.split(/[,•]/).length <= 3)) {
        if (currentJob) result.experience.push(currentJob);
        currentJob = {
          company: line.replace(dateMatch?.[0] || "", "").replace(/^[-•\s]+/, "").trim(),
          position: "",
          startDate: "",
          endDate: "",
          location: "",
          description: [],
          highlights: []
        };
        if (dateMatch) {
          const parts = dateMatch[0].split(/[-–to]+/);
          currentJob.startDate = parts[0]?.trim() || "";
          currentJob.endDate = parts[1]?.trim() || "";
        }
      } else if (currentJob) {
        if (line.startsWith("-") || line.startsWith("•") || line.match(/^\d+[.)]/)) {
          currentJob.highlights.push(line.replace(/^[-•\d.)\s]+/, "").trim());
        } else if (line.length > 10) {
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
      if (line.match(/(University|College|Institute|School|Academy)/i) || line.match(/(Bachelor|Master|PhD|B\.\w+|M\.\w+)/i)) {
        if (currentEdu) result.education.push(currentEdu);
        currentEdu = {
          institution: line.replace(/[,•].*$/, "").trim(),
          degree: "",
          fieldOfStudy: "",
          location: "",
          startDate: "",
          endDate: "",
          gpa: ""
        };
        const degreeMatch = line.match(/(Bachelor|Master|PhD|B\.\w+|M\.\w+|Associate|Doctorate)/i);
        if (degreeMatch) currentEdu.degree = degreeMatch[0];
      } else if (currentEdu && line.match(/\d{4}/)) {
        const years = line.match(/(\d{4})\s*[-–to]+\s*(\d{4}|Present)/i);
        if (years) {
          currentEdu.startDate = years[1];
          currentEdu.endDate = years[2];
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
      if (line.length > 3 && line.length < 80 && !line.startsWith("-") && !line.startsWith("•")) {
        if (currentProj) result.projects.push(currentProj);
        currentProj = { name: line, description: [], technologies: [], url: "" };
      } else if (currentProj) {
        if (line.startsWith("-") || line.startsWith("•")) {
          currentProj.description.push(line.replace(/^[-•\s]+/, "").trim());
        } else {
          const techMatch = line.match(/(React|Angular|Vue|Node|Python|Java|JavaScript|TypeScript|Go|Rust|AWS|Azure|GCP|Docker|Kubernetes|SQL|MongoDB)/i);
          if (techMatch) {
            currentProj.technologies = line.split(/[,;]+/).map(t => t.trim()).filter(t => t.length > 1);
          }
        }
      }
    }
    if (currentProj) result.projects.push(currentProj);
  }

  // Certifications
  if (sectionContent.certifications) {
    for (const line of sectionContent.certifications) {
      if (line.length > 3) {
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

  // Location: look for common patterns near contact info
  const locationPatterns = [
    fullText.match(/(\w+\s*(?:,\s*)?(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY))\b/),
    fullText.match(/(\w+\s*(?:,\s*)?(?:United\s*States|USA|UK|Canada|Australia|India))/i),
  ];
  for (const m of locationPatterns) {
    if (m) { result.personalInfo.location = m[1]; break; }
  }

  return result;
}
