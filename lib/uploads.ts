import fs from "fs/promises";
import path from "path";

export async function saveDataUrls(dataUrls: unknown): Promise<{ ok: true; paths: string[] } | { ok: false; error: string }> {
  if (dataUrls == null) return { ok: true, paths: [] };
  if (!Array.isArray(dataUrls)) return { ok: false, error: "Images should be a list." };
  if (dataUrls.length > 3) return { ok: false, error: "You can add up to 3 photos." };

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const paths: string[] = [];

  for (const item of dataUrls) {
    if (typeof item !== "string" || item.length === 0) continue;
    const match = item.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) return { ok: false, error: "Photos need to be JPG, PNG, or WEBP." };
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length < 32) return { ok: false, error: "That photo looked empty." };
    if (buffer.length > 5_000_000) return { ok: false, error: "One of those photos is over 5MB." };
    const name = `${crypto.randomUUID()}.${ext}`;
    await fs.writeFile(path.join(dir, name), buffer);
    paths.push(`/uploads/${name}`);
  }

  return { ok: true, paths };
}
