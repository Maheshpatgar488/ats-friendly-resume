// Dynamic Backend API Endpoint URL mapping
// Connects to Vercel environment variables in production, falls back to Hugging Face Space.
export const API_URL = import.meta.env.VITE_API_URL || "https://maheshpatgar488-resume-backend.hf.space";
