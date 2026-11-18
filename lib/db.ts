import fs from "fs/promises";
import path from "path";
import { buildSeed } from "./seed-data";
import type { DB } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

let queue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function writeDB(db: DB) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_PATH);
}

async function readFile(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const data = JSON.parse(raw) as DB;
    if (!Array.isArray(data.users) || !Array.isArray(data.posts) || !Array.isArray(data.deals)) {
      throw new Error("data/db.json is missing users, posts, or deals. Run npm run seed.");
    }
    if (!Array.isArray(data.messages)) data.messages = [];
    return data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      const seed = buildSeed();
      await writeDB(seed);
      return seed;
    }
    throw err;
  }
}

export function readDB() {
  return enqueue(readFile);
}

export function updateDB<T>(mutate: (db: DB) => T) {
  return enqueue(async () => {
    const db = await readFile();
    const result = mutate(db);
    await writeDB(db);
    return result;
  });
}
