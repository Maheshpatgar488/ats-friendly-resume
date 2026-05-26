import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

// Check if API Key is available
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Returns a configured Gemini generative model instance.
 * Falls back to throwing an error if the API key is missing.
 */
export function getGeminiModel(modelName = "gemini-2.0-flash") {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not defined in the server environment (.env file).");
  }
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generates structured JSON data from Gemini using a strict JSON schema.
 * This guarantees the model outputs valid, parseable JSON fitting our model.
 */
export async function generateStructuredJSON(prompt, schema) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1, // low temperature for high extraction fidelity
      },
    });
    
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini Structured JSON Generation Error:", error);
    throw error;
  }
}

/**
 * Generates standard freeform text from Gemini.
 * Perfect for quick summaries or generic bullet point rewrites.
 */
export async function generateText(prompt, temperature = 0.7) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
      },
    });
    
    return result.response.text();
  } catch (error) {
    console.error("Gemini Text Generation Error:", error);
    throw error;
  }
}

// ----------------------------------------------------
// Structuring JSON Schemas for Gemini AI
// ----------------------------------------------------

/**
 * Strict JSON schema for parsing and extracting unstructured resume text into a structured JSON profile.
 */
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

/**
 * Strict JSON schema for measuring ATS scores and extracting matching/missing keywords.
 */
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
