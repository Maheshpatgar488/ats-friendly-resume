import { useState, useEffect, useRef } from "react";

const LOCAL_STORAGE_KEY_DATA = "ats_resume_builder_data";
const LOCAL_STORAGE_KEY_STYLES = "ats_resume_builder_styles";

const emptyResume = {
  personalInfo: {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    website: "johndoe.dev",
    websiteUrl: "https://johndoe.dev",
    linkedin: "LinkedIn",
    linkedinUrl: "https://linkedin.com/in/johndoe",
    github: "GitHub",
    githubUrl: "https://github.com/johndoe",
  },
  summary: "",
  experience: [
    {
      company: "Acme Corp",
      position: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2022-01",
      endDate: "Present",
      description: [
        "Led a 6-person engineering team building and maintaining a high-traffic B2B SaaS platform serving 50K+ users."
      ],
      highlights: [
        "Spearheaded redevelopment of high-traffic core SaaS platform, boosting page speeds by 40% and expanding scalability.",
        "Led a cross-functional team of 6 engineers to release high-fidelity real-time collaboration dashboards, driving 15% increase in user retention.",
        "Optimized database indexing and queries, cutting API response latencies by 60ms."
      ]
    }
  ],
  education: [
    {
      institution: "State University",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      location: "Austin, TX",
      startDate: "2018-09",
      endDate: "2021-12",
      gpa: "3.85"
    }
  ],
  skills: [
    "React.js", "Node.js", "Tailwind CSS", "JavaScript", "SQL", "Git", "REST APIs"
  ],
  projects: [
    {
      name: "ATS Resume Builder",
      description: [
        "Built a premium full-stack web application with 20+ visual templates for building ATS-optimized resume files."
      ],
      highlights: [
        "Integrated Gemini AI for resume parsing, keyword matching, and STAR-method bullet optimization."
      ],
      technologies: ["React", "Tailwind CSS", "Node.js", "Express", "Gemini AI"],
      url: "github.com/example/resume-builder"
    }
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2024"
    }
  ],
  languages: ["English (Native)", "Spanish (Conversational)"]
};

const defaultStyles = {
  templateId: "3", // Default to Tech Indigo
  fontFamily: "Inter",
  fontSize: "10pt",
  lineHeight: "1.4",
  primaryColor: "#3730a3", // Indigo accent
  sectionSpacing: "8px",
  entrySpacing: "4px",
  margins: {
    top: "0.5in",
    bottom: "0.5in",
    left: "0.5in",
    right: "0.5in"
  }
};

/**
 * Normalizes nested arrays to ensure fields like description and highlights are always arrays.
 * This prevents `.map is not a function` errors when data is corrupted or comes from an external source.
 * @param {Array} arr - The input array (e.g., experience, projects)
 * @param {Array} fields - The fields to normalize (e.g., ['description', 'highlights'])
 */
function normalizeEntries(arr, fields) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (!item || typeof item !== 'object') return item;
    const normalized = { ...item };
    fields.forEach(field => {
      const val = normalized[field];
      if (val === null || val === undefined) {
        normalized[field] = [];
      } else if (typeof val === 'string') {
        normalized[field] = [val];
      } else if (!Array.isArray(val)) {
        normalized[field] = [];
      }
    });
    return normalized;
  });
}

/**
 * Deeply normalizes the entire resumeData object to ensure structural integrity.
 * @param {Object} data - The raw resume data
 * @returns {Object} - The normalized resume data
 */
function normalizeResumeData(data) {
  if (!data || typeof data !== 'object') {
    return { ...emptyResume }; // Return a fresh copy of empty resume
  }

  return {
    ...data,
    personalInfo: data.personalInfo || { fullName: "", email: "", phone: "", location: "", website: "", websiteUrl: "", linkedin: "", linkedinUrl: "", github: "", githubUrl: "", title: "" },
    experience: normalizeEntries(data.experience, ['description', 'highlights']),
    projects: normalizeEntries(data.projects, ['description', 'highlights', 'technologies']),
    // Also ensure top-level arrays are truly arrays
    education: Array.isArray(data.education) ? data.education : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
  };
}

export function useAutosave() {
  const [resumeData, setResumeDataState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
      if (!saved) return { ...emptyResume };
      const parsed = JSON.parse(saved);
      return normalizeResumeData(parsed);
    } catch {
      return { ...emptyResume };
    }
  });

  const [customStyles, setCustomStyles] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_STYLES);
      if (!saved) return { ...defaultStyles };
      const parsed = JSON.parse(saved);
      // Defensive: ensure parsed is a valid object, not null
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...defaultStyles, ...parsed };
      }
      return { ...defaultStyles };
    } catch {
      return { ...defaultStyles };
    }
  });

  const [isSaved, setIsSaved] = useState(true);
  const timerRef = useRef(null);

  // Trigger autosave whenever data or styles change
  useEffect(() => {
    setIsSaved(false);
    
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set 1.5s debounce timer
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_DATA, JSON.stringify(resumeData));
        localStorage.setItem(LOCAL_STORAGE_KEY_STYLES, JSON.stringify(customStyles));
        setIsSaved(true);
      } catch (error) {
        console.error("Autosave Failed:", error);
      }
    }, 1500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resumeData, customStyles]);

  /**
   * Safely set resume data with normalization
   */
  const setResumeData = (value) => {
    if (typeof value === 'function') {
      setResumeDataState(prev => normalizeResumeData(value(prev)));
    } else {
      setResumeDataState(normalizeResumeData(value));
    }
  };

  /**
   * Reset data to completely empty
   */
  const clearResume = () => {
    const freshData = {
      personalInfo: { 
        fullName: "", 
        email: "", 
        phone: "", 
        location: "", 
        website: "", 
        websiteUrl: "", 
        linkedin: "", 
        linkedinUrl: "", 
        github: "", 
        githubUrl: "" 
      },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: []
    };
    setResumeDataState(freshData);
  };

  /**
   * Reset data to standard professional template data
   */
  const loadSampleData = () => {
    setResumeDataState(normalizeResumeData({ ...emptyResume }));
    setCustomStyles(defaultStyles);
  };

  /**
   * Overwrites active resume data with normalization
   */
  const updateResumeData = (newData) => {
    setResumeDataState(normalizeResumeData(newData));
  };

  /**
   * Exports resume data as local JSON file
   */
  const exportBackup = () => {
    const payload = JSON.stringify({ resumeData, customStyles }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resume_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    resumeData,
    setResumeData,
    customStyles,
    setCustomStyles,
    isSaved,
    clearResume,
    loadSampleData,
    updateResumeData,
    exportBackup
  };
}
