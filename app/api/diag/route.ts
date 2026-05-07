import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

// Diagnostic: probe the data directory + write/read a test file.
// Tells us exactly what's wrong when profiles aren't persisting.
export async function GET() {
  const dataDir = process.env.HALO_DATA_DIR ?? path.join(process.cwd(), "data");
  const out: Record<string, unknown> = { dataDir };

  // Existence + stat
  try {
    const st = await fs.stat(dataDir);
    out.exists = true;
    out.isDirectory = st.isDirectory();
    out.mode = (st.mode & 0o777).toString(8);
    out.uid = st.uid;
    out.gid = st.gid;
  } catch (err: any) {
    out.exists = false;
    out.statError = err?.message ?? String(err);
  }

  // List contents
  try {
    const files = await fs.readdir(dataDir);
    out.fileCount = files.length;
    out.firstFiles = files.slice(0, 10);
  } catch (err: any) {
    out.readError = err?.message ?? String(err);
  }

  // Probe write
  const probePath = path.join(dataDir, ".halo-write-probe");
  try {
    await fs.writeFile(probePath, String(Date.now()));
    const back = await fs.readFile(probePath, "utf8");
    await fs.unlink(probePath);
    out.writable = true;
    out.roundTrip = back;
  } catch (err: any) {
    out.writable = false;
    out.writeError = err?.message ?? String(err);
  }

  // Process identity
  out.processUid = process.getuid?.() ?? null;
  out.processGid = process.getgid?.() ?? null;

  return NextResponse.json(out);
}
