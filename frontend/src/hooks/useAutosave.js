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
      description: "A premium full-stack web application designed with 20+ visual templates to build resume files optimized for Applicant Tracking Systems.",
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

export function useAutosave() {
  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
      return saved ? JSON.parse(saved) : emptyResume;
    } catch {
      return emptyResume;
    }
  });

  const [customStyles, setCustomStyles] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_STYLES);
      return saved ? JSON.parse(saved) : defaultStyles;
    } catch {
      return defaultStyles;
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
    setResumeData(freshData);
  };

  /**
   * Reset data to standard professional template data
   */
  const loadSampleData = () => {
    setResumeData(emptyResume);
    setCustomStyles(defaultStyles);
  };

  /**
   * Overwrites active resume data
   */
  const updateResumeData = (newData) => {
    setResumeData(newData);
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
