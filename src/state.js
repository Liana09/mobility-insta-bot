import fs from "node:fs/promises";
import path from "node:path";

export const STATE_DIR = ".state";
export const POSTED_PATH = path.join(STATE_DIR, "posted.json");
export const PENDING_PATH = path.join(STATE_DIR, "pending-post.json");

export async function ensureStateDir() {
  await fs.mkdir(STATE_DIR, { recursive: true });
}

export async function readPostedState() {
  await ensureStateDir();

  try {
    const content = await fs.readFile(POSTED_PATH, "utf8");
    const parsed = JSON.parse(content);
    return {
      posted: Array.isArray(parsed.posted) ? parsed.posted : []
    };
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    return { posted: [] };
  }
}

export async function writePostedState(state) {
  await ensureStateDir();
  await fs.writeFile(`${POSTED_PATH}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
  await fs.rename(`${POSTED_PATH}.tmp`, POSTED_PATH);
}

export async function readPendingPost() {
  try {
    const content = await fs.readFile(PENDING_PATH, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    return null;
  }
}

export async function writePendingPost(post) {
  await ensureStateDir();
  await fs.writeFile(`${PENDING_PATH}.tmp`, `${JSON.stringify(post, null, 2)}\n`);
  await fs.rename(`${PENDING_PATH}.tmp`, PENDING_PATH);
}

export async function clearPendingPost() {
  await fs.rm(PENDING_PATH, { force: true });
}
