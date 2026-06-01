import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import mammoth from "mammoth";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
// Robust CommonJS import helper for pdf-parse to prevent ES module quirks
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Utilities imports
import { 
  generateStructuredJSON, 
  generateText, 
  tailorStructuredJSON, 
  RESUME_JSON_SCHEMA, 
  ATS_SCORE_SCHEMA 
} from "./utils/gemini.js";
import { computeLocalATSScore, tailorResumeLocally } from "./utils/localAts.js";
import { 
  getAllResumes, 
  getResumeById, 
  saveResume, 
  deleteResume
} from "./utils/db.js";
import { generateDocx } from "./utils/docxGenerator.js";
import { compileResumeHTML } from "./utils/pdfGenerator.js";
import { parseResumeText } from "./utils/localParser.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7860;

// Catch crashes before they kill the process
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

// Enable CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json());

// Configure Multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "application/msword" // doc
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed."));
    }
  }
});

// ----------------------------------------------------
// HEALTH CHECK ENDPOINT (Required for Render/Railway)
// ----------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug: echo back request info
app.post("/api/debug-upload", upload.single("file"), (req, res) => {
  const info = {
    hasFile: !!req.file,
    fileName: req.file?.originalname,
    fileSize: req.file?.size,
    mimeType: req.file?.mimetype,
    contentType: req.headers["content-type"]
  };
  console.log("Debug upload:", info);
  res.json(info);
});

// Debug: extract text from uploaded PDF/DOCX and return raw text
app.post("/api/debug-extract-text", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    let extractedText = "";
    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      extractedText = data.text;
    } else {
      const data = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = data.value;
    }
    res.json({ text: extractedText, length: extractedText.length });
  } catch (error) {
    res.status(500).json({ error: "Extraction failed", details: error.message });
  }
});

// Debug: test local parser with raw text
app.post("/api/debug-parse", express.text({ type: "*/*", limit: "1mb" }), (req, res) => {
  const text = typeof req.body === "string" ? req.body : req.body?.text || "";
  if (!text) return res.status(400).json({ error: "Send raw resume text in request body" });
  const parsed = parseResumeText(text);
  res.json({ success: true, resumeData: parsed });
});

// ----------------------------------------------------
// DATABASE & MANAGEMENT ENDPOINTS
// ----------------------------------------------------

/**
 * Fetch all saved resumes.
 */
app.get("/api/resumes", async (req, res) => {
  try {
    const resumes = await getAllResumes();
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ error: "Failed to read database." });
  }
});

/**
 * Fetch a single saved resume.
 */
app.get("/api/resumes/:id", async (req, res) => {
  try {
    const resume = await getResumeById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: "Resume not found." });
    }
    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: "Failed to read database." });
  }
});

/**
 * Save or update a resume.
 */
app.post("/api/resumes", async (req, res) => {
  try {
    const result = await saveResume(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to save resume." });
  }
});

/**
 * Delete a resume.
 */
app.delete("/api/resumes/:id", async (req, res) => {
  try {
    const result = await deleteResume(req.params.id);
    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }
    res.json({ message: "Resume deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete resume." });
  }
});

// ----------------------------------------------------
// CORE FUNCTIONAL API ENDPOINTS
// ----------------------------------------------------

/**
 * Endpoint: /api/extract-text
 * Takes an uploaded PDF/DOCX file, extracts raw text, and sends it to Gemini AI to structure it.
 */
app.post("/api/extract-text", (req, res, next) => {
  console.log("extract-text: received request, content-type:", req.headers["content-type"]);
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("extract-text: multer error:", err);
      return res.status(400).json({ error: "Upload error: " + err.message });
    }
    handleExtractText(req, res, next);
  });
});

async function handleExtractText(req, res) {
  if (!req.file) {
    console.log("extract-text: no file in request");
    return res.status(400).json({ error: "Please upload a valid PDF or DOCX file." });
  }

  try {
    let extractedText = "";

    // 1. Extract raw text from file based on file type
    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      extractedText = data.text;
    } else {
      // DOC/DOCX files
      const data = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = data.value;
    }

    if (!extractedText.trim()) {
      return res.status(422).json({ error: "Could not extract any readable text from the uploaded document." });
    }

    // 2. Parse locally (no API key needed, works every time)
    const resumeData = parseResumeText(extractedText, req.file.buffer);

    res.json({ success: true, resumeData });

  } catch (error) {
    console.error("Extract Text Endpoint Error:", error);
    res.status(500).json({ 
      error: "Failed to parse resume.",
      details: error.message || error 
    });
  }
}

/**
 * Endpoint: /api/enhance
 * Uses Gemini AI to re-write summaries or rewrite experience bullet points using the STAR methodology.
 */
app.post("/api/enhance", async (req, res) => {
  const { type, content, jobTitle } = req.body;

  if (!content && type !== "generate-bullets") {
    return res.status(400).json({ error: "Missing content parameter to enhance." });
  }

  if (type === "generate-bullets" && !jobTitle) {
    return res.status(400).json({ error: "Missing jobTitle parameter to generate bullets." });
  }

  try {
    let prompt = "";

    if (type === "bullet") {
      prompt = `
        You are an expert resume editor and career coach.
        Rewrite the following resume bullet point using the **STAR methodology** (Situation, Task, Action, Result).
        
        Guidelines:
        1. Start with a strong action verb (e.g. Spearheaded, Engineered, Orchestrated, Optimized).
        2. Clearly detail the task or context, the action taken, and the quantified impact or result (e.g. percentages, dollar figures, hours saved) where possible.
        3. Make it punchy, executive-level, and highly optimized for ATS scanners.
        4. Keep it to a single concise and powerful sentence. Do not add headers, prefix labels, or write "STAR". Just output the rewritten bullet point directly.

        Original Bullet Point:
        "${content}"
        
        ${jobTitle ? `Target Role Title: "${jobTitle}"` : ""}
      `;
    } else if (type === "generate-bullets") {
      prompt = `
        You are an expert resume writer and career coach.
        Generate 3 highly professional, ATS-optimized resume bullet points for the following role.
        Use the **STAR methodology** (Situation, Task, Action, Result) where possible, starting each bullet with a strong action verb (e.g. Spearheaded, Engineered, Orchestrated).
        
        Role: "${jobTitle}"
        ${content ? `Context/Description provided by the user: "${content}"` : ""}
        
        Guidelines:
        1. Output EXACTLY 3 bullet points.
        2. Do NOT use markdown list formatting (no asterisks or dashes at the start of the line). Just output the raw text for each bullet on a new line.
        3. Do NOT include any headers or introductory text.
        4. Separate each bullet with a newline character.
      `;
    } else {
      // type === "summary"
      prompt = `
        You are an elite executive resume writer.
        Draft a highly compelling, professional profile summary for a resume based on the following professional details.
        
        Guidelines:
        1. It should be exactly 3 to 4 sentences long (about 50-80 words).
        2. Tailor it to stand out for a ${jobTitle ? `"${jobTitle}"` : "relevant professional"} role.
        3. Start with an impactful description of experience (e.g. "Result-oriented Software Engineer with X years of experience...").
        4. Highlight critical core skills, tech stacks, or domains, and finish with a strong statement on value added to teams.
        5. Make it ATS keyword-friendly and professional. Output only the written summary directly, no conversational greetings or intros.

        Professional Info & Details:
        "${content}"
      `;
    }

    let enhancedText;
    try {
      enhancedText = await generateText(prompt);
    } catch (aiError) {
      console.error("AI Enhance Error:", aiError);
      return res.json({
        success: false,
        error: "AI enhancement unavailable. Please try again later.",
        details: aiError.message
      });
    }
    res.json({ success: true, enhancedText: enhancedText.trim().replace(/^"|"$/g, "") }); // trim quotes

  } catch (error) {
    console.error("Enhance Endpoint Error:", error);
    res.status(500).json({ error: "Failed to enhance content.", details: error.message });
  }
});

/**
 * Endpoint: /api/ats-score
 * Scores a resume against a target job description and extracts matched/missing keywords.
 */
app.post("/api/ats-score", async (req, res) => {
  const { resumeData, jobDescription } = req.body;

  if (!resumeData || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeData or jobDescription in request body." });
  }

  // Sanitize job description to strip image references (Gemini rejects non-text content)
  const cleanJD = jobDescription
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/<img[^>]*>/gi, " ")
    .replace(/data:image\/[^;]+;base64[^"]*/gi, " ")
    .replace(/https?:\/\/[^\s]*\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)[^\s]*/gi, " ")
    .replace(/[^\s"'`(),;]*\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)[^\s"'`(),;]*/gi, " ")
    .replace(/\(https?:\/\/[^)]+\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)[^)]*\)/gi, " ");

  try {
    // 1. Try AI first for high-quality semantic matching
    const prompt = `
      You are an advanced Applicant Tracking System (ATS) matching algorithm.
      Perform an EXHAUSTIVE, rigorous keyword match comparison between the provided Resume JSON data and the pasted Target Job Description.
      
      Perform the following:
      1. Calculate an overall ATS compatibility score (0 to 100) reflecting how well the resume matches the requirements, skills, and expectations.
      2. Extract a COMPLETE list of EVERY technical skill, tool, framework, methodology, and keyword from the job description that is matched in the resume. Do not omit any.
      3. Extract a COMPLETE list of EVERY technical skill, tool, framework, methodology, and keyword from the job description that is MISSING from the resume. Be exhaustive — extract every single requirement mentioned.
      4. Provide 3-5 specific, bullet-point actionable suggestions to improve the resume match rate (e.g. rephrasing experience, including certifications, or adding specific skills).

      Resume JSON Data:
      ${JSON.stringify(resumeData)}

      Target Job Description:
      """
      ${cleanJD}
      """
    `;

    const scoreData = await generateStructuredJSON(prompt, ATS_SCORE_SCHEMA, 0.5);
    // Normalize AI response — Groq often invents its own field names
    const normalizedScore = scoreData.atsCompatibilityScore ?? scoreData.overallScore ?? scoreData.score;
    scoreData.score = (typeof normalizedScore === "number" && !Number.isNaN(normalizedScore))
      ? Math.round(Math.max(0, Math.min(100, normalizedScore)))
      : 0;
    scoreData.keywordsMatched = (scoreData.keywordsMatched ?? scoreData.matchedSkills ?? scoreData.matchedKeywords ?? [])
      .map(k => typeof k === "string" ? k : k?.name || k?.skill || String(k));
    scoreData.keywordsMissing = (scoreData.keywordsMissing ?? scoreData.missingSkills ?? scoreData.missingKeywords ?? [])
      .map(k => typeof k === "string" ? k : k?.name || k?.skill || String(k));
    scoreData.suggestions = (scoreData.suggestions ?? scoreData.actionableSuggestions ?? scoreData.improvementSuggestions ?? scoreData.recommendations ?? [])
      .map(s => typeof s === "string" ? s : s?.suggestion || s?.action || JSON.stringify(s));
    res.json({ success: true, ...scoreData, engine: "ai" });

  } catch (error) {
    console.warn("AI ATS scoring failed, falling back to local engine:", error.message || error);

    // 2. Fallback: Pure-JS local ATS engine (zero API cost, works offline)
    try {
      const localScore = computeLocalATSScore(resumeData, jobDescription);
      res.json({ ...localScore, fallback: true });
    } catch (localError) {
      console.error("Local ATS fallback also failed:", localError);
      res.status(500).json({ error: "Failed to compute ATS score.", details: localError.message });
    }
  }
});

/**
 * Endpoint: /api/tailor
 * Takes a resume and a job description and dynamically outputs a fully-tailored resume JSON.
 */
app.post("/api/tailor", async (req, res) => {
  const { resumeData, jobDescription, missingKeywords } = req.body;

  if (!resumeData || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeData or jobDescription in request body." });
  }

  // Sanitize job description to strip image references (Gemini rejects non-text content)
  const cleanJD = jobDescription
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/<img[^>]*>/gi, " ")
    .replace(/data:image\/[^;]+;base64[^"]*/gi, " ")
    .replace(/https?:\/\/[^\s]*\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)[^\s]*/gi, " ")
    .replace(/[^\s"'`(),;]*\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)[^\s"'`(),;]*/gi, " ")
    .replace(/\(https?:\/\/[^)]+\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)[^)]*\)/gi, " ");

  const missingKWText = Array.isArray(missingKeywords) && missingKeywords.length > 0
    ? `\nThe following keywords from the job description are currently MISSING from the resume. You MUST weave them into the highlights, summary, and skills wherever they fit naturally:\n${missingKeywords.map(k => `  - ${k}`).join("\n")}\n`
    : "";

  try {
    // 1. Try AI first for high-quality tailoring
    const exampleShape = {
      personalInfo: { fullName: "string", email: "string", phone: "string", location: "string", website: "string", linkedin: "string", github: "string" },
      summary: "string",
      experience: [{ company: "string", position: "string", location: "string", startDate: "string", endDate: "string", highlights: ["string"] }],
      education: [{ institution: "string", degree: "string", fieldOfStudy: "string", location: "string", startDate: "string", endDate: "string", gpa: "string" }],
      skills: ["string"],
      projects: [{ name: "string", description: ["string"], technologies: ["string"], url: "string" }],
      certifications: [{ name: "string", issuer: "string", date: "string" }],
      languages: ["string"]
    };

    const prompt = `
      You are an expert career consultant and elite resume architect specializing in maximizing ATS pass-rates.
      Your task is to review ALL sections of the provided Resume JSON data and **tailor each section aggressively** to achieve an ATS match score **above 85% to 95%** against the provided Target Job Description.
      
      CRITICAL: You MUST output DIFFERENT content from the input. Every section MUST be rewritten — experience highlights, education (degree, fieldOfStudy), certifications, projects, skills, and summary. Do NOT skip any section. Do NOT just copy the input text back.
      
      Strict Optimisation Rules:
       1. **Rewrite the Skills Array**: The "skills" array MUST be rewritten. Remove generic/obsolete skills. Add ALL relevant tech skills, tools, frameworks, databases, and methodologies mentioned in the Job Description. Reorder skills so the most JD-relevant ones come first. Do NOT return the same skills list as the input — output a different, JD-optimized list.
      2. **Mirror Job Terminology**: Rephrase and rewrite the "highlights" bullet points in the "experience" array using the **STAR methodology** (Situation, Task, Action, Result). Ensure every single bullet explicitly weaves in the exact verbs, technical terms, business metrics, and responsibilities outlined in the Job Description.
      3. **Tailor the Professional Summary**: Rewrite the "summary" to be dense with relevant key phrases. It should sound like the absolute perfect, hand-picked candidate for this specific role, emphasizing transferable achievements.
      4. **Tailor Education, Certifications, and Projects too**: Rewrite degree names, certification titles, project descriptions, and technologies to use terminology from the job description where it naturally fits. Do NOT skip these sections.
      5. **MAINTAIN FACTUAL INTEGRITY**: Do not invent fake work histories, fake companies, fake dates, or fake colleges. You are rephrasing, optimizing, and presenting the real facts of the user's career in the exact language of the recruiter to pass ATS filters!
      6. Keep all bullet points concise (1-2 lines max, ~15-25 words each) so the full resume fits on a single printed page. Prioritize the most impactful keywords from the job description.
      6b. **LIMIT BULLET POINTS**: Each experience entry must have at most 4 highlights. Choose the most impactful ones. Do not add more than 4.
      7. **PRESERVE PERSONAL INFO**: You MUST NOT change or overwrite the user's name, email, phone, location, or links in the personalInfo section. Leave personalInfo EXACTLY as it is in the input. Do NOT replace the name with the Job Title.
      ${missingKWText ? `8. **ADDRESS MISSING KEYWORDS**: ${missingKWText.replace(/\n/g, "\n      ")}` : ""}

      **CRITICAL — Output the EXACT same JSON structure as the input.**
      Every array field (experience, education, projects, certifications) must be an array of **objects**, not strings.
      The "experience" array MUST contain objects with keys: company, position, location, startDate, endDate, highlights.
      The "highlights" field inside each experience object must contain rewritten bullet point strings.
      Do NOT flatten "experience" into an array of strings. Preserve the full object structure.

      Expected JSON shape (fill in real values, keep this structure):
      ${JSON.stringify(exampleShape, null, 2)}

      Resume JSON:
      ${JSON.stringify(resumeData)}

      Target Job Description:
      """
      ${cleanJD}
      """
    `;

    const tailoredData = await generateStructuredJSON(prompt, RESUME_JSON_SCHEMA, 0.7);
    // Post-process: merge AI's rewritten text back into original structure.
    // The AI often drops company/position/dates or merges entries, so we ALWAYS
    // preserve the original structural fields and only replace text content.
    // Preserve personalInfo fields the AI schema may strip (websiteUrl, linkedinUrl, githubUrl, title, etc.)
    const origPI = resumeData.personalInfo || {};
    const aiPI = tailoredData.personalInfo || {};
    tailoredData.personalInfo = { ...origPI, ...aiPI };
    // Preserve original summary if AI returns empty
    if (!tailoredData.summary || tailoredData.summary.trim() === "") {
      tailoredData.summary = resumeData.summary || "";
    }
    const originalExp = Array.isArray(resumeData.experience) ? resumeData.experience : [];
    const aiExp = Array.isArray(tailoredData.experience) ? tailoredData.experience : [];
    tailoredData.experience = originalExp.map((orig, idx) => {
      const ai = aiExp[idx];
      // Prefer AI highlights; fall back to original highlights, then original descriptions
      let aiHighlights = [];
      if (Array.isArray(ai?.highlights) && ai.highlights.length > 0) {
        aiHighlights = ai.highlights;
      } else if (Array.isArray(orig.highlights) && orig.highlights.length > 0) {
        aiHighlights = orig.highlights;
      } else if (Array.isArray(orig.description) && orig.description.length > 0) {
        aiHighlights = orig.description;
      }
      return {
        ...orig,
        highlights: aiHighlights.slice(0, 4), // cap at 4 bullet points to prevent 2-page overflow
        description: Array.isArray(ai?.description) && ai.description.length > 0 ? ai.description : orig.description || [],
      };
    });
    const originalEdu = Array.isArray(resumeData.education) ? resumeData.education : [];
    const aiEdu = Array.isArray(tailoredData.education) ? tailoredData.education : [];
    tailoredData.education = originalEdu.map((orig, idx) => {
      const ai = aiEdu[idx];
      if (!ai || typeof ai === "string") return { ...orig };
      return {
        ...orig,
        degree: ai.degree || orig.degree,
        fieldOfStudy: ai.fieldOfStudy || orig.fieldOfStudy,
        gpa: ai.gpa || orig.gpa,
      };
    });
    const originalProj = Array.isArray(resumeData.projects) ? resumeData.projects : [];
    const aiProj = Array.isArray(tailoredData.projects) ? tailoredData.projects : [];
    tailoredData.projects = originalProj.map((orig, idx) => {
      const ai = aiProj[idx];
      const aiDesc = Array.isArray(ai?.description) && ai.description.length > 0 ? ai.description : orig.description || [];
      return {
        ...orig,
        description: aiDesc,
      };
    });
    const originalCert = Array.isArray(resumeData.certifications) ? resumeData.certifications : [];
    const aiCert = Array.isArray(tailoredData.certifications) ? tailoredData.certifications : [];
    tailoredData.certifications = originalCert.map((orig, idx) => {
      const ai = aiCert[idx];
      if (!ai || typeof ai !== "object") return { ...orig };
      return {
        ...orig,
        name: ai.name || orig.name,
        issuer: ai.issuer || orig.issuer,
      };
    });
    // Ensure trainingData (if included) is removed
    if (tailoredData.trainingData) delete tailoredData.trainingData;
    // Use AI's reorganized skills as the base, then merge keywords directly from the JD
    let baseSkills = Array.isArray(tailoredData.skills) && tailoredData.skills.length > 0
      ? tailoredData.skills
      : Array.isArray(resumeData.skills) ? [...resumeData.skills] : [];
    const skillSet = new Set(baseSkills.map(s => s.toLowerCase().replace(/[.,]$/, "")));
    // Merge missingKeywords from ATS scoring
    if (Array.isArray(missingKeywords) && missingKeywords.length > 0) {
      for (const kw of missingKeywords) {
        if (!skillSet.has(kw.toLowerCase().replace(/[.,]$/, ""))) {
          baseSkills.push(kw);
          skillSet.add(kw.toLowerCase());
        }
      }
    }
    // Safety net: extract keywords directly from the JD so skills always get updated
    if (jobDescription) {
      const rawTerms = jobDescription
        .replace(/[^a-zA-Z0-9#+.#\-\/]/g, " ")
        .split(/\s+/)
        .filter(t => t.length > 2 && !["and","the","for","with","from","this","that","have","has","had","will","can","are","was","been","being","but","not","all","any","each","every","some","such","more","most","other","about","than","into","over","also","just","now","then","able","must","need","use","used","using","based","etc","per","its","may","too","very","good","new","well","get","set","way","part"].includes(t.toLowerCase()))
        .map(t => t.trim());
      const jdKeywordSet = new Set(rawTerms.map(t => t.toLowerCase()));
      for (const kw of jdKeywordSet) {
        if (!skillSet.has(kw) && kw.length > 2) {
          baseSkills.push(kw.charAt(0).toUpperCase() + kw.slice(1));
          skillSet.add(kw);
        }
      }
    }
    // Cap skills to 15 max to prevent overflow to 2 pages
    tailoredData.skills = baseSkills.slice(0, 15);
    res.json({ success: true, tailoredResumeData: tailoredData, engine: "ai" });

  } catch (error) {
    console.warn("AI tailoring failed, falling back to local engine:", error.message || error);

    // 2. Fallback: Pure-JS local tailoring engine (zero API cost)
    try {
      const localTailored = tailorResumeLocally(resumeData, jobDescription);
      res.json({ ...localTailored, fallback: true });
    } catch (localError) {
      console.error("Local tailoring fallback also failed:", localError);
      res.status(500).json({ error: "Failed to tailor resume.", details: localError.message });
    }
  }
});

/**
 * Endpoint: /api/export-pdf
 * Takes the resume data, builds custom HTML, runs Puppeteer, and returns a high-fidelity PDF stream.
 * Auto-scales font size and spacing to fit content on exactly 1 page.
 */
app.post("/api/export-pdf", async (req, res) => {
  const { resumeData, templateId, customStyles } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "Missing resumeData in request body." });
  }

  try {
    // Launch headless Chrome
    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none"
      ]
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    // Use the user's custom styles directly — no auto-scaling.
    // The preview already shows the page count warning, so the user can adjust spacing themselves.
    // This ensures the PDF always matches the preview exactly.
    const htmlContent = compileResumeHTML(resumeData, templateId, customStyles);
    await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="resume.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Export PDF Endpoint Error:", error);
    res.status(500).json({ error: "Failed to generate PDF.", details: error.message });
  }
});

/**
 * Endpoint: /api/export-pdf-from-html
 * Accepts pre-rendered HTML from the frontend preview — guarantees the PDF
 * matches the preview pixel-for-pixel since it uses the same rendered output.
 */
app.post("/api/export-pdf-from-html", async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).json({ error: "Missing 'html' in request body." });
  }

  try {
    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ]
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="resume.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Export PDF from HTML Error:", error);
    res.status(500).json({ error: "Failed to generate PDF from HTML.", details: error.message });
  }
});

/**
 * Endpoint: /api/export-docx
 * Takes the resume data, builds a DOCX file using docx library, and returns a high-fidelity DOCX stream.
 */
app.post("/api/export-docx", async (req, res) => {
  const { resumeData } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "Missing resumeData in request body." });
  }

  try {
    const docxBuffer = await generateDocx(resumeData);
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="resume.docx"`);
    res.send(docxBuffer);
  } catch (error) {
    console.error("Export DOCX Endpoint Error:", error);
    res.status(500).json({ error: "Failed to generate DOCX.", details: error.message });
  }
});

// Serve static files from the React frontend app
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../public");

app.use(express.static(frontendPath));

// Anything that doesn't match the API routes, send back index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Global Error Handler to catch multer limits and other unhandled exceptions
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: "File is too large. Please upload a smaller file." });
    }
  }
  res.status(500).json({ error: "An unexpected server error occurred: " + err.message });
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ATS Resume Server is running on http://localhost:${PORT}`);
});
