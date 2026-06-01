import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;
const MODEL = "llama-3.3-70b-versatile";

export function getGroq() {
  if (!groq) {
    throw new Error("GROQ_API_KEY is not defined in the server environment.");
  }
  return groq;
}

export async function generateStructuredJSON(prompt, schema, temperature = 0.1) {
  try {
    const client = getGroq();
    const result = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a JSON generator. Output ONLY valid JSON matching the requested schema. No explanations, no markdown." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature,
    });
    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error("Groq Structured JSON Generation Error:", error);
    throw error;
  }
}

/**
 * Tailor-specific JSON generation that drops response_format to avoid the model
 * copying input verbatim. Uses a higher temperature and a rewrite-focused system prompt.
 */
export async function tailorStructuredJSON(prompt, schema) {
  try {
    const client = getGroq();
    const result = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an elite resume rewrite specialist. Your job is to REWRITE and IMPROVE the resume content — change the wording, use STAR methodology, integrate keywords, and make every bullet stronger. Output ONLY a valid JSON object, no explanations, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });
    const text = result.choices[0].message.content.trim();
    // Try direct parse first, then try extracting JSON from backticks
    try {
      return JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      // Try finding first { to last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
      throw new Error("Could not extract valid JSON from model response");
    }
  } catch (error) {
    console.error("Groq Tailored JSON Generation Error:", error);
    throw error;
  }
}

export async function generateText(prompt, temperature = 0.7) {
  try {
    const client = getGroq();
    const result = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature,
    });
    return result.choices[0].message.content;
  } catch (error) {
    console.error("Groq Text Generation Error:", error);
    throw error;
  }
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
