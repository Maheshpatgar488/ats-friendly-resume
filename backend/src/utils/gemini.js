import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;
const MODEL = "llama3-70b-8192";

export function getGroq() {
  if (!groq) {
    throw new Error("GROQ_API_KEY is not defined in the server environment.");
  }
  return groq;
}

export async function generateStructuredJSON(prompt, schema) {
  try {
    const client = getGroq();
    const result = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a JSON generator. Output ONLY valid JSON matching the requested schema. No explanations, no markdown." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error("Groq Structured JSON Generation Error:", error);
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
