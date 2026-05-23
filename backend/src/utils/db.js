import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve("./data");
const DB_FILE = path.join(DATA_DIR, "resumes.json");

/**
 * Initializes the database file and directory if they do not exist.
 */
async function initDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      // File does not exist, create it with an empty array
      await fs.writeFile(DB_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error("Database Initialisation Error:", error);
  }
}

/**
 * Reads all resumes from the JSON file database.
 */
export async function getAllResumes() {
  await initDb();
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Database Read Error:", error);
    return [];
  }
}

/**
 * Reads a single resume by its ID.
 */
export async function getResumeById(id) {
  const resumes = await getAllResumes();
  return resumes.find(r => r.id === id) || null;
}

/**
 * Saves a resume (creates a new entry or updates an existing one).
 * If the resume data has no ID, a secure random UUID will be generated.
 */
export async function saveResume(resumeData) {
  await initDb();
  const resumes = await getAllResumes();
  
  let targetResume = { ...resumeData };
  let isNew = false;
  
  if (!targetResume.id) {
    targetResume.id = crypto.randomUUID();
    targetResume.createdAt = new Date().toISOString();
    targetResume.updatedAt = targetResume.createdAt;
    resumes.push(targetResume);
    isNew = true;
  } else {
    const index = resumes.findIndex(r => r.id === targetResume.id);
    targetResume.updatedAt = new Date().toISOString();
    
    if (index !== -1) {
      // Merge values
      resumes[index] = { ...resumes[index], ...targetResume };
    } else {
      // Has ID but not found in DB (unusual, add it as new)
      targetResume.createdAt = new Date().toISOString();
      resumes.push(targetResume);
      isNew = true;
    }
  }
  
  await fs.writeFile(DB_FILE, JSON.stringify(resumes, null, 2));
  return { success: true, isNew, resume: targetResume };
}

/**
 * Deletes a resume by its ID.
 */
export async function deleteResume(id) {
  await initDb();
  const resumes = await getAllResumes();
  const filtered = resumes.filter(r => r.id !== id);
  
  if (filtered.length === resumes.length) {
    return { success: false, message: "Resume not found" };
  }
  
  await fs.writeFile(DB_FILE, JSON.stringify(filtered, null, 2));
  return { success: true };
}
