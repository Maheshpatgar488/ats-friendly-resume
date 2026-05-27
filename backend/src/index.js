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
    const resumeData = parseResumeText(extractedText);

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

  if (!content) {
    return res.status(400).json({ error: "Missing content parameter to enhance." });
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
 * Normalizes an array field from the AI by merging flattened data back into the original structure.
 * If the AI returns strings instead of objects (e.g. experience as ["text"] instead of [{company, highlights:["text"]}]),
 * this reconstructs proper objects using the original resume data.
 */
function normalizeArrayField(aiItems, originalItems, fields) {
  if (!Array.isArray(aiItems)) return originalItems || [];
  return aiItems.map((item, idx) => {
    const orig = originalItems?.[idx] || {};
    if (typeof item === "string") {
      const obj = {};
      for (const f of fields) {
        if (f === "highlights" || f === "description" || f === "technologies") {
          obj[f] = Array.isArray(orig[f]) ? [...orig[f]] : (f === "highlights" || f === "description" ? [item] : []);
        } else {
          obj[f] = orig[f] || "";
        }
      }
      if (obj.highlights) obj.highlights = [item];
      else if (obj.description) obj.description = [item];
      return obj;
    }
    if (typeof item === "object" && item !== null) {
      const obj = {};
      for (const f of fields) {
        const val = item[f];
        if (val !== undefined && val !== null && val !== "") {
          obj[f] = val;
        } else if (f === "highlights" || f === "description" || f === "technologies") {
          obj[f] = Array.isArray(orig[f]) ? [...orig[f]] : [];
        } else {
          obj[f] = orig[f] || "";
        }
      }
      return obj;
    }
    return orig;
  });
}

/**
 * Endpoint: /api/ats-score
 * Scores a resume against a target job description and extracts matched/missing keywords.
 */
app.post("/api/ats-score", async (req, res) => {
  const { resumeData, jobDescription } = req.body;

  if (!resumeData || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeData or jobDescription in request body." });
  }

  try {
    // 1. Try Gemini AI first for high-quality semantic matching
    const prompt = `
      You are an advanced Applicant Tracking System (ATS) matching algorithm.
      Perform a rigorous, semantic keyword match comparison between the provided Resume JSON data and the pasted Target Job Description.
      
      Perform the following:
      1. Calculate an overall ATS compatibility score (0 to 100) reflecting how well the resume matches the requirements, skills, and expectations.
      2. Extract a list of key technical skills and keywords from the job description that ARE successfully matched in the resume.
      3. Extract a list of critical technical skills, methodologies, or buzzwords from the job description that ARE MISSING or neglected in the resume.
      4. Provide 3-5 specific, bullet-point actionable suggestions to improve the resume match rate (e.g. rephrasing experience, including certifications, or adding specific skills).

      Resume JSON Data:
      ${JSON.stringify(resumeData)}

      Target Job Description:
      """
      ${jobDescription}
      """
    `;

    const scoreData = await generateStructuredJSON(prompt, ATS_SCORE_SCHEMA);
    // Normalize AI response — Groq often invents its own field names
    const normalizedScore = scoreData.atsCompatibilityScore ?? scoreData.overallScore ?? scoreData.score;
    scoreData.score = (typeof normalizedScore === "number" && !Number.isNaN(normalizedScore))
      ? Math.round(Math.max(0, Math.min(100, normalizedScore)))
      : 0;
    scoreData.keywordsMatched = scoreData.keywordsMatched ?? scoreData.matchedSkills ?? scoreData.matchedKeywords ?? [];
    scoreData.keywordsMissing = scoreData.keywordsMissing ?? scoreData.missingSkills ?? scoreData.missingKeywords ?? [];
    scoreData.suggestions = scoreData.suggestions ?? scoreData.actionableSuggestions ?? scoreData.improvementSuggestions ?? scoreData.recommendations ?? [];
    res.json({ success: true, ...scoreData, engine: "groq" });

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
  const { resumeData, jobDescription } = req.body;

  if (!resumeData || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeData or jobDescription in request body." });
  }

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
      Your task is to review the provided Resume JSON data and **tailor it aggressively and comprehensively** to achieve an ATS match score **above 85% to 95%** against the provided Target Job Description.
      
      Strict Optimisation Rules:
      1. **Maximize Keyword Density**: Identify ALL key technical skills, tools, frameworks, databases, and methodologies mentioned in the Job Description, and safely integrate them directly into the "skills" array, organizing them logically.
      2. **Mirror Job Terminology**: Rephrase and rewrite the "highlights" bullet points in the "experience" array using the **STAR methodology** (Situation, Task, Action, Result). Ensure every single bullet explicitly weaves in the exact verbs, technical terms, business metrics, and responsibilities outlined in the Job Description.
      3. **Tailor the Professional Summary**: Rewrite the "summary" to be dense with relevant key phrases. It should sound like the absolute perfect, hand-picked candidate for this specific role, emphasizing transferable achievements.
      4. **MAINTAIN FACTUAL INTEGRITY**: Do not invent fake work histories, fake companies, fake dates, or fake colleges. You are rephrasing, optimizing, and presenting the real facts of the user's career in the exact language of the recruiter to pass ATS filters!
      5. Keep all bullet points concise (1-2 lines max, ~15-25 words each) so the full resume fits on a single printed page. Prioritize the most impactful keywords from the job description.

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
      ${jobDescription}
      """
    `;

    const tailoredData = await generateStructuredJSON(prompt, RESUME_JSON_SCHEMA);
    // Post-process: merge AI's rewritten text back into original structure.
    // The AI often drops company/position/dates or merges entries, so we ALWAYS
    // preserve the original structural fields and only replace text content.
    const originalExp = Array.isArray(resumeData.experience) ? resumeData.experience : [];
    const aiExp = Array.isArray(tailoredData.experience) ? tailoredData.experience : [];
    tailoredData.experience = originalExp.map((orig, idx) => {
      const ai = aiExp[idx];
      return {
        ...orig,
        highlights: Array.isArray(ai?.highlights) && ai.highlights.length > 0 ? ai.highlights : orig.highlights || [],
        description: Array.isArray(ai?.description) && ai.description.length > 0 ? ai.description : orig.description || [],
      };
    });
    const originalEdu = Array.isArray(resumeData.education) ? resumeData.education : [];
    const aiEdu = Array.isArray(tailoredData.education) ? tailoredData.education : [];
    tailoredData.education = originalEdu.map((orig, idx) => {
      const ai = aiEdu[idx];
      if (typeof ai === "string") return { ...orig };
      return { ...orig };
    });
    const originalProj = Array.isArray(resumeData.projects) ? resumeData.projects : [];
    const aiProj = Array.isArray(tailoredData.projects) ? tailoredData.projects : [];
    tailoredData.projects = originalProj.map((orig, idx) => {
      const ai = aiProj[idx];
      return {
        ...orig,
        description: Array.isArray(ai?.description) && ai.description.length > 0 ? ai.description : orig.description || [],
      };
    });
    const originalCert = Array.isArray(resumeData.certifications) ? resumeData.certifications : [];
    tailoredData.certifications = originalCert.map(orig => ({ ...orig }));
    // Ensure trainingData (if included) is removed
    if (tailoredData.trainingData) delete tailoredData.trainingData;
    res.json({ success: true, tailoredResumeData: tailoredData, engine: "groq" });

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
    const tid = parseInt(templateId, 10) || 1;
    const isBannerTop = tid === 20;

    const pdfMargins = isBannerTop
      ? { top: "0", bottom: "0", left: "0", right: "0" }
      : (customStyles?.margins || { top: "0.5in", bottom: "0.5in", left: "0.55in", right: "0.55in" });

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

    // Auto-scaling: reduce spacing before shrinking font to keep text readable
    // Never go below 9pt — content that overflows at 9pt naturally goes to 2 pages
    const scalingSteps = [
      { fontSize: "10pt",  lineHeight: "1.35", sectionSpacing: "8px",  entrySpacing: "6px"  },
      { fontSize: "9.5pt", lineHeight: "1.3",  sectionSpacing: "6px",  entrySpacing: "5px"  },
      { fontSize: "9.5pt", lineHeight: "1.25", sectionSpacing: "4px",  entrySpacing: "3px"  },
      { fontSize: "9pt",   lineHeight: "1.25", sectionSpacing: "3px",  entrySpacing: "2px"  },
      { fontSize: "9pt",   lineHeight: "1.2",  sectionSpacing: "2px",  entrySpacing: "2px"  },
      { fontSize: "9pt",   lineHeight: "1.15", sectionSpacing: "1px",  entrySpacing: "1px"  },
    ];

    let pdfBuffer = null;
    let fittingScale = null;

    for (const scale of scalingSteps) {
      const scaledStyles = {
        ...customStyles,
        fontSize: scale.fontSize,
        lineHeight: scale.lineHeight,
        sectionSpacing: scale.sectionSpacing,
        entrySpacing: scale.entrySpacing,
      };

      const htmlContent = compileResumeHTML(resumeData, templateId, scaledStyles);
      await page.setContent(htmlContent, { waitUntil: "domcontentloaded", timeout: 15000 });

      // Check how many pages it would produce
      const contentHeight = await page.evaluate(() => document.body.scrollHeight);
      const A4_HEIGHT_PX = 1123; // 297mm at 96dpi
      const pageCount = Math.ceil(contentHeight / A4_HEIGHT_PX);

      if (pageCount <= 1) {
        // Fits on 1 page — generate the final PDF
        fittingScale = scale;
        pdfBuffer = await page.pdf({
          format: "A4",
          margin: pdfMargins,
          printBackground: true
        });
        break;
      }
    }

    // If still doesn't fit after all steps, use the most readable scale and allow 2 pages
    // Better to have readable text across 2 pages than tiny cramped text
    if (!pdfBuffer) {
      const bestScale = scalingSteps[0];
      const scaledStyles = { ...customStyles, ...bestScale };
      const htmlContent = compileResumeHTML(resumeData, templateId, scaledStyles);
      await page.setContent(htmlContent, { waitUntil: "domcontentloaded", timeout: 15000 });

      pdfBuffer = await page.pdf({
        format: "A4",
        margin: pdfMargins,
        printBackground: true,
      });
    }

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="resume.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Export PDF Endpoint Error:", error);
    res.status(500).json({ error: "Failed to generate PDF.", details: error.message });
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
