import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-pro"
];

async function runDiagnostics() {
  console.log("Starting model diagnostics...");
  console.log("API Key:", apiKey.substring(0, 10) + "...");
  
  for (const modelName of modelsToTest) {
    console.log(`\nTesting model: "${modelName}"...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello! Say 'OK' in 1 word.");
      const text = result.response.text().trim();
      console.log(`✅ SUCCESS with "${modelName}"! Response:`, text);
      console.log(`We should use "${modelName}" in our server!`);
      return; // Stop on first success!
    } catch (error) {
      console.log(`❌ FAILED with "${modelName}":`, error.message || error);
    }
  }
  
  console.log("\nAll tested models failed. Please verify if your API Key is valid and enabled for the Gemini developer API.");
}

runDiagnostics();
