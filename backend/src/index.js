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
import { 
  getAllResumes, 
  getResumeById, 
  saveResume, 
  deleteResume 
} from "./utils/db.js";
import { compileResumeHTML } from "./utils/pdfGenerator.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7860;

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
app.post("/api/extract-text", upload.single("file"), async (req, res) => {
  if (!req.file) {
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

    // 2. Format a clear prompt instructing Gemini to parse the resume text
    const prompt = `
      You are an elite ATS (Applicant Tracking System) resume parser. 
      Analyze the raw unstructured text extracted from a resume and extract the details into the exact JSON schema provided.
      
      Important Formatting Rules:
      1. Carefully identify the contact details (fullName, email, phone, location, links like linkedin/github/website).
      2. Split the work experiences into separate items in the "experience" array. For each experience, extract the company name, position title, dates (startDate, endDate - or "Present"), location, and a list of key bullet highlights.
      3. Split education details.
      4. Split skills into a clean array of individual skill terms.
      5. Identify projects, languages, and certifications if present.
      6. Maintain high factual accuracy. Do NOT fabricate or make up details not present in the raw text. If a section or specific detail is missing, omit it or leave it as an empty string.

      Raw Resume Text:
      """
      ${extractedText}
      """
    `;

    // 3. Request structured JSON from Gemini
    const structuredData = await generateStructuredJSON(prompt, RESUME_JSON_SCHEMA);
    res.json({ success: true, resumeData: structuredData });

  } catch (error) {
    console.error("Extract Text Endpoint Error:", error);
    res.status(500).json({ 
      error: "Failed to parse resume.",
      details: error.message || error 
    });
  }
});

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

    const enhancedText = await generateText(prompt);
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

  try {
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
    res.json({ success: true, ...scoreData });

  } catch (error) {
    console.error("ATS Score Endpoint Error:", error);
    res.status(500).json({ error: "Failed to compute ATS score.", details: error.message });
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
    const prompt = `
      You are an expert career consultant and elite resume architect specializing in maximizing ATS pass-rates.
      Your task is to review the provided Resume JSON data and **tailor it aggressively and comprehensively** to achieve an ATS match score **above 85% to 95%** against the provided Target Job Description.
      
      Strict Optimisation Rules:
      1. **Maximize Keyword Density**: Identify ALL key technical skills, tools, frameworks, databases, and methodologies mentioned in the Job Description, and safely integrate them directly into the "skills" array, organizing them logically.
      2. **Mirror Job Terminology**: Rephrase and rewrite the "highlights" bullet points in the "experience" array using the **STAR methodology** (Situation, Task, Action, Result). Ensure every single bullet explicitly weaves in the exact verbs, technical terms, business metrics, and responsibilities outlined in the Job Description.
      3. **Tailor the Professional Summary**: Rewrite the "summary" to be dense with relevant key phrases. It should sound like the absolute perfect, hand-picked candidate for this specific role, emphasizing transferable achievements.
      4. **MAINTAIN FACTUAL INTEGRITY**: Do not invent fake work histories, fake companies, fake dates, or fake colleges. You are rephrasing, optimizing, and presenting the real facts of the user's career in the exact language of the recruiter to pass ATS filters!
      5. Output the results strictly in the exact same Resume JSON format provided.

      Resume JSON:
      ${JSON.stringify(resumeData)}

      Target Job Description:
      """
      ${jobDescription}
      """
    `;

    const tailoredData = await generateStructuredJSON(prompt, RESUME_JSON_SCHEMA);
    res.json({ success: true, tailoredResumeData: tailoredData });

  } catch (error) {
    console.error("Tailor Endpoint Error:", error);
    res.status(500).json({ error: "Failed to tailor resume.", details: error.message });
  }
});

/**
 * Endpoint: /api/export-pdf
 * Takes the resume data, builds custom HTML, runs Puppeteer, and returns a high-fidelity PDF stream.
 */
app.post("/api/export-pdf", async (req, res) => {
  const { resumeData, templateId, customStyles } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "Missing resumeData in request body." });
  }

  try {
    // 1. Generate standard custom HTML string using dynamic generator
    const htmlContent = compileResumeHTML(resumeData, templateId, customStyles);

    // 2. Set margin values
    const margin = customStyles?.margins || { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" };

    // 3. Launch headless Chrome in Puppeteer
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
    
    // Set viewport to A4 at 96dpi: 210mm = 794px, 297mm = 1123px
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    
    // Load HTML — domcontentloaded fires immediately, Google Fonts load in parallel (non-blocking)
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded", timeout: 15000 });

    // 4. Generate PDF buffer — let CSS control sizing, no extra margins
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      },
      printBackground: true,
      preferCSSPageSize: true
    });

    await browser.close();

    // 5. Stream back PDF content type
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
