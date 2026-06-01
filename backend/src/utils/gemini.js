import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_MODEL = "gemini-1.5-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Gemini client (primary)
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Groq client (fallback)
const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

function getGemini() {
  if (!genAI) throw new Error("GEMINI_API_KEY is not defined.");
  return genAI;
}

function getGroq() {
  if (!groq) throw new Error("GROQ_API_KEY is not defined.");
  return groq;
}

// Strip any image references from prompts — Gemini rejects non-text content
function sanitizePrompt(text) {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/<img[^>]*>/gi, " ")
    .replace(/data:image\/[^;]+;base64[^"]*/gi, " ")
    .replace(/https?:\/\/[^\s]*\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)[^\s]*/gi, " ")
    .replace(/[^\s"'`(),;]*\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)[^\s"'`(),;]*/gi, " ");
}

export async function generateStructuredJSON(prompt, schema, temperature = 0.1) {
  // Try Gemini first
  if (genAI) {
    const safePrompt = sanitizePrompt(prompt);
    try {
      const model = getGemini().getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          temperature,
        },
      });
      const result = await model.generateContent(safePrompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Structured JSON Error, falling back to Groq:", error.message);
    }
  }
  // Fallback to Groq
  const client = getGroq();
  const result = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "You are a JSON generator. Output ONLY valid JSON matching the requested schema. No explanations, no markdown." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature,
  });
  return JSON.parse(result.choices[0].message.content);
}

/**
 * Extracts a top-level JSON object from text by counting brace depth.
 */
function extractTopLevelJSON(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

export async function tailorStructuredJSON(prompt, schema) {
  // Try Gemini first
  if (genAI) {
    const safePrompt = sanitizePrompt(prompt);
    try {
      const model = getGemini().getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });
      const result = await model.generateContent(safePrompt);
      const text = result.response.text().trim();
      try {
        return JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1].trim());
        }
        const extracted = extractTopLevelJSON(text);
        if (extracted) {
          return JSON.parse(extracted);
        }
        throw new Error("Could not extract valid JSON from Gemini response");
      }
    } catch (error) {
      console.error("Gemini Tailored JSON Error, falling back to Groq:", error.message);
    }
  }
  // Fallback to Groq
  const client = getGroq();
  const result = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "You are an elite resume rewrite specialist. Your job is to REWRITE and IMPROVE the resume content — change the wording, use STAR methodology, integrate keywords, and make every bullet stronger. Output ONLY a valid JSON object, no explanations, no markdown." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 8192,
  });
  const text = result.choices[0].message.content.trim();
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    const extracted = extractTopLevelJSON(text);
    if (extracted) {
      return JSON.parse(extracted);
    }
    throw new Error("Could not extract valid JSON from Groq response");
  }
}

export async function generateText(prompt, temperature = 0.7) {
  // Try Gemini first
  if (genAI) {
    try {
      const model = getGemini().getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { temperature },
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini Text Generation Error, falling back to Groq:", error.message);
    }
  }
  // Fallback to Groq
  const client = getGroq();
  const result = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature,
  });
  return result.choices[0].message.content;
}

export const RESUME_JSON_SCHEMA = {
  type: "object",
  properties: {
    personalInfo: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        website: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" },
      },
      required: ["fullName"],
    },
    summary: { type: "string" },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          position: { type: "string" },
          location: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          description: {
            type: "array",
            items: { type: "string" }
          },
          highlights: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["company", "position"]
      }
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          fieldOfStudy: { type: "string" },
          location: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          gpa: { type: "string" }
        },
        required: ["institution", "degree"]
      }
    },
    skills: {
      type: "array",
      items: { type: "string" }
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: {
            type: "array",
            items: { type: "string" }
          },
          technologies: {
            type: "array",
            items: { type: "string" }
          },
          url: { type: "string" }
        },
        required: ["name"]
      }
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          issuer: { type: "string" },
          date: { type: "string" }
        },
        required: ["name"]
      }
    },
    languages: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["personalInfo", "experience", "education", "skills"]
};

export const ATS_SCORE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    keywordsMatched: {
      type: "array",
      items: { type: "string" }
    },
    keywordsMissing: {
      type: "array",
      items: { type: "string" }
    },
    suggestions: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["score", "keywordsMatched", "keywordsMissing", "suggestions"]
};
