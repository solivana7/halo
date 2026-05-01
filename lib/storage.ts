import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.HALO_DATA_DIR ?? path.join(process.cwd(), "data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export type ScanRecord = {
  id: string;
  ranAt: string; // ISO date
  profileId: string;
  results: Array<{
    surface: string;
    query: string;
    cited: boolean;
    position: number | null;
    brandUrlCited: boolean;
    competitorsMentioned: string[];
    excerpt?: string;
    answer: string;
    citations: { url: string; title?: string }[];
    error?: string;
  }>;
};

export async function saveScan(record: ScanRecord) {
  await ensureDir();
  const file = path.join(DATA_DIR, `scan-${record.id}.json`);
  await fs.writeFile(file, JSON.stringify(record, null, 2));
}

export async function listScans(): Promise<ScanRecord[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const out: ScanRecord[] = [];
  for (const f of files) {
    if (!f.startsWith("scan-") || !f.endsWith(".json")) continue;
    const data = JSON.parse(await fs.readFile(path.join(DATA_DIR, f), "utf8"));
    out.push(data);
  }
  return out.sort((a, b) => b.ranAt.localeCompare(a.ranAt));
}

export type ProfileRecord = {
  id: string;
  brand: string;
  domain?: string;
  city: string;
  region: string;
  adjacentCities?: string[];
  serviceIds: string[];
  focusOutcomes?: string[];
  competitors?: string[];
  audiences?: string[];
  createdAt: string;
};

export async function saveProfile(p: ProfileRecord) {
  await ensureDir();
  await fs.writeFile(path.join(DATA_DIR, `profile-${p.id}.json`), JSON.stringify(p, null, 2));
}

export async function getProfile(id: string): Promise<ProfileRecord | null> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, `profile-${id}.json`), "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function listProfiles(): Promise<ProfileRecord[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const out: ProfileRecord[] = [];
  for (const f of files) {
    if (!f.startsWith("profile-") || !f.endsWith(".json")) continue;
    out.push(JSON.parse(await fs.readFile(path.join(DATA_DIR, f), "utf8")));
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
