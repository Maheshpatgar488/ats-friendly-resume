/**
 * Pure JavaScript, zero-API-key ATS engine.
 * Computes keyword overlap, semantic matching, and generates suggestions
 * entirely on the server — no external AI calls required.
 */

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------
const STOP_WORDS = new Set([
  "and", "or", "the", "a", "an", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "this", "that", "these", "those",
  "we", "you", "they", "he", "she", "it", "i", "me", "my", "our", "your",
  "their", "its", "am", "so", "if", "but", "or", "not", "no", "yes",
  "also", "too", "very", "just", "now", "then", "here", "there", "when",
  "where", "why", "how", "what", "who", "which", "all", "any", "each",
  "every", "both", "few", "more", "most", "other", "some", "such", "only",
  "own", "same", "so", "than", "too", "very", "able", "about", "above",
  "across", "after", "against", "along", "among", "around", "before",
  "behind", "below", "beneath", "beside", "between", "beyond", "during",
  "inside", "into", "near", "off", "onto", "outside", "over", "through",
  "throughout", "till", "toward", "under", "until", "upon", "within", "without",
  // Common job description filler
  "candidate", "role", "position", "job", "work", "working", "opportunity",
  "looking", "seeking", "responsible", "responsibilities", "requirements",
  "preferred", "qualifications", "experience", "years", " plus", "including",
  "ability", "skills", "knowledge", "understanding", "familiarity",
  "proficiency", "strong", "excellent", "good", "proven", "track",
  "record", "level", "minimum", "required", "must", "will", "need",
  "ability", "able", "use", "using", "used", "based", "such", "etc"
]);

const SYNONYMS = {
  "javascript": ["js", "ecmascript"],
  "typescript": ["ts"],
  "react": ["reactjs", "react.js"],
  "node": ["nodejs", "node.js"],
  "python": ["py"],
  "postgresql": ["postgres", "psql"],
  "mongodb": ["mongo"],
  "aws": ["amazon web services"],
  "azure": ["microsoft azure"],
  "gcp": ["google cloud platform", "google cloud"],
  "docker": ["containerization"],
  "kubernetes": ["k8s"],
  "github": ["git", "version control"],
  "ci/cd": ["cicd", "continuous integration", "continuous deployment"],
  "api": ["rest api", "restful api", "web api"],
  "machine learning": ["ml", "deep learning", "ai"],
  "artificial intelligence": ["ai"],
  "data science": ["data scientist"],
  "full stack": ["fullstack", "full-stack"],
  "frontend": ["front-end", "front end", "ui"],
  "backend": ["back-end", "back end", "server-side"],
  "responsive": ["mobile-first", "adaptive"],
};

// Build a reverse lookup: each variant points to its canonical form
const VARIANT_MAP = new Map();
for (const [canonical, variants] of Object.entries(SYNONYMS)) {
  for (const v of variants) {
    VARIANT_MAP.set(v, canonical);
  }
  VARIANT_MAP.set(canonical, canonical);
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function normalizePhrase(phrase) {
  return phrase
    .toLowerCase()
    .replace(/\b(postgresql|typescript|powershell|powerbi|powerpoint|wordpress|websocket|webpack|nextjs?|nuxtjs?|vuejs|codeigniter|cloudformation|openstack|fastapi|graphql|github|gitlab|chatgpt|openai|macos|ios|android|canva|figma|indesign|photoshop|lightroom|aftereffects|illustrator|dreamweaver|nodejs?|reactjs?|angularjs?|javascript|typescript)\b/gi, (m) => m.replace(/([a-z])([A-Z])/g, (_,a,b) => a + '\x00' + b))
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\x00/g, "")
    .replace(/[^a-z0-9#+.#\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBigrams(words) {
  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

function extractTrigrams(words) {
  const trigrams = [];
  for (let i = 0; i < words.length - 2; i++) {
    trigrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return trigrams;
}

function extractTermsFromText(text) {
  const normalized = normalizePhrase(text);
  const words = normalized.split(" ").filter(w => w.length > 1 && !STOP_WORDS.has(w));
  const unigrams = [...new Set(words)];
  const bigrams = [...new Set(extractBigrams(words).filter(b => !b.split(" ").some(w => STOP_WORDS.has(w))))];
  const trigrams = [...new Set(extractTrigrams(words).filter(t => !t.split(" ").some(w => STOP_WORDS.has(w))))];
  return { unigrams, bigrams, trigrams, all: [...unigrams, ...bigrams, ...trigrams] };
}

function canonicalizeTerm(term) {
  if (VARIANT_MAP.has(term)) return VARIANT_MAP.get(term);

  // Also check if any PART of the term matches a variant
  for (const [variant, canonical] of VARIANT_MAP.entries()) {
    if (term.includes(variant) && variant.length > 2) {
      return canonical;
    }
  }
  return term;
}

function extractKeywordsFromJobDescription(jobDescription) {
  const { all } = extractTermsFromText(jobDescription);
  const keywordMatches = [];
  const seen = new Set();

  for (const term of all) {
    const canonical = canonicalizeTerm(term);
    if (!seen.has(canonical)) {
      seen.add(canonical);
      keywordMatches.push(canonical);
    }
  }

  return keywordMatches.filter(k => k.length > 2);
}

function flattenResumeText(resumeData) {
  const parts = [];

  if (resumeData.personalInfo) {
    parts.push(resumeData.personalInfo.fullName || "");
    parts.push(resumeData.personalInfo.title || "");
  }

  parts.push(resumeData.summary || "");

  if (Array.isArray(resumeData.experience)) {
    for (const exp of resumeData.experience) {
      parts.push(exp.position || "", exp.company || "", exp.location || "");
      if (Array.isArray(exp.highlights)) parts.push(...exp.highlights);
    }
  }

  if (Array.isArray(resumeData.education)) {
    for (const edu of resumeData.education) {
      parts.push(edu.institution || "", edu.degree || "", edu.fieldOfStudy || "");
    }
  }

  if (Array.isArray(resumeData.skills)) parts.push(...resumeData.skills);

  if (Array.isArray(resumeData.projects)) {
    for (const proj of resumeData.projects) {
      parts.push(proj.name || "");
      if (Array.isArray(proj.technologies)) parts.push(...proj.technologies);
      if (Array.isArray(proj.highlights)) parts.push(...proj.highlights);
    }
  }

  if (Array.isArray(resumeData.certifications)) {
    for (const cert of resumeData.certifications) {
      parts.push(cert.name || "", cert.issuer || "");
    }
  }

  if (Array.isArray(resumeData.languages)) parts.push(...resumeData.languages);

  return parts.join(" ");
}

function suggestImprovements(matched, missing, resumeData) {
  const suggestions = [];

  if (missing.length > 0) {
    suggestions.push(`Add the following missing skills to your resume: ${missing.slice(0, 5).join(", ")}.`);
  }

  if (resumeData.summary) {
    const summaryLower = resumeData.summary.toLowerCase();
    const missingInSummary = missing.filter(k => !summaryLower.includes(k));
    if (missingInSummary.length > 0) {
      suggestions.push(`Integrate keywords like "${missingInSummary.slice(0, 3).join(", ")}" into your professional summary for better visibility.`);
    }
  }

  if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
    suggestions.push("Quantify your achievements with metrics (e.g., percentages, dollar amounts, user counts) in your bullet points.");
  }

  if (!resumeData.summary || resumeData.summary.length < 50) {
    suggestions.push("Consider adding a more detailed professional summary (50-80 words) to capture recruiter attention.");
  }

  if (Array.isArray(resumeData.skills) && resumeData.skills.length < 8) {
    suggestions.push("Expand your skills section to include 8-12 relevant technical skills matching the job requirements.");
  }

  while (suggestions.length < 5) {
    suggestions.push("Tailor your bullet points to mirror the exact terminology used in the job description.");
  }

  return suggestions.slice(0, 5);
}

// -----------------------------------------------------------------------------
// MAIN: LOCAL ATS SCORE
// -----------------------------------------------------------------------------
export function computeLocalATSScore(resumeData, jobDescription) {
  const jdKeywords = extractKeywordsFromJobDescription(jobDescription);
  const resumeText = flattenResumeText(resumeData);
  const resumeTerms = extractTermsFromText(resumeText);
  const resumeSet = new Set(resumeTerms.all);

  const keywordsMatched = [];
  const keywordsMissing = [];

  for (const keyword of jdKeywords) {
    let found = false;
    // Direct match
    if (resumeSet.has(keyword)) {
      found = true;
    } else {
      // Check if any resume term contains this keyword or vice versa
      for (const rTerm of resumeSet) {
        if (rTerm.includes(keyword) || keyword.includes(rTerm)) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      keywordsMatched.push(keyword);
    } else {
      keywordsMissing.push(keyword);
    }
  }

  // Deduplicate
  const uniqueMatched = [...new Set(keywordsMatched)].slice(0, 20);
  const uniqueMissing = [...new Set(keywordsMissing)].slice(0, 20);

  // Score formula: weighted based on match ratio + coverage bonus
  const total = uniqueMatched.length + uniqueMissing.length;
  let score = total > 0 ? Math.round((uniqueMatched.length / total) * 100) : 0;

  // Boost score slightly if user has a decent number of skills
  if (Array.isArray(resumeData.skills) && resumeData.skills.length >= 10) {
    score = Math.min(100, score + 5);
  }

  // Bonus for having a summary
  if (resumeData.summary && resumeData.summary.length > 50) {
    score = Math.min(100, score + 3);
  }

  // Cap reasonable range
  score = Math.min(100, Math.max(5, score));

  const suggestions = suggestImprovements(uniqueMatched, uniqueMissing, resumeData);

  return {
    success: true,
    score,
    keywordsMatched: uniqueMatched,
    keywordsMissing: uniqueMissing,
    suggestions,
    engine: "local" // Indicates local engine was used
  };
}

// -----------------------------------------------------------------------------
// MAIN: LOCAL TAILOR
// -----------------------------------------------------------------------------
export function tailorResumeLocally(resumeData, jobDescription) {
  // 1. Get the matched/missing keywords
  const jdTerms = extractTermsFromText(jobDescription);
  const resumeText = flattenResumeText(resumeData);
  const resumeTerms = extractTermsFromText(resumeText);
  const resumeSet = new Set(resumeTerms.all);

  const importantKeywords = jdTerms.unigrams
    .filter(k => k.length > 2 && !STOP_WORDS.has(k))
    .slice(0, 20);

  const missing = importantKeywords.filter(k => {
    for (const r of resumeSet) {
      if (r.includes(k) || k.includes(r)) return false;
    }
    return true;
  }).slice(0, 15);

  // 2. Clone resume and optimize
  const tailored = JSON.parse(JSON.stringify(resumeData));

  // Add missing skills
  if (!Array.isArray(tailored.skills)) tailored.skills = [];
  for (const kw of missing) {
    if (!tailored.skills.some(s => s.toLowerCase() === kw)) {
      tailored.skills.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  }
  tailored.skills = [...new Set(tailored.skills)].slice(0, 24);

  // Enhance summary with missing terms
  if (tailored.summary) {
    const missingToAdd = missing.slice(0, 5);
    if (missingToAdd.length > 0) {
      const addition = ` Experienced in ${missingToAdd.join(", ")}.`;
      tailored.summary = tailored.summary.trim().replace(/\.$/, "") + addition;
    }
  }

  // Enhance bullet points (simple keyword weaving)
  if (Array.isArray(tailored.experience)) {
    const weaveTerms = missing.filter(m => m.length > 3).slice(0, 5);
    for (let i = 0; i < tailored.experience.length; i++) {
      const exp = tailored.experience[i];
      if (Array.isArray(exp.highlights) && exp.highlights.length > 0 && weaveTerms.length > 0) {
        const term = weaveTerms[i % weaveTerms.length];
        const lastBullet = exp.highlights[exp.highlights.length - 1];
        if (lastBullet && !lastBullet.toLowerCase().includes(term)) {
          exp.highlights[exp.highlights.length - 1] = lastBullet.trim().replace(/\.$/, "") + `, leveraging ${term}.`;
        }
      }
    }
  }

  return {
    success: true,
    tailoredResumeData: tailored,
    engine: "local"
  };
}
