// Dynamic Backend API Endpoint URL mapping
// Explicitly point to the Hugging Face Space so external live sites (Vercel/Netlify) can connect.
export const API_URL = import.meta.env.MODE === 'development' ? "http://localhost:5000" : "https://maheshpatgar488-resume-backend.hf.space";
