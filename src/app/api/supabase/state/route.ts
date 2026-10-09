import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_PORTFOLIO,
  DEFAULT_WATCHLIST,
} from "@/lib/supabase";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lokrsjfpbishwpwguhgb.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxva3JzamZwYmlzaHdwd2d1aGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MTQ5MjAsImV4cCI6MjEwNzA5MDkyMH0.Uv_jmJPi0HxankgF0yb01fZmlaAszEncXFS7bLVCfLs";

const BUCKET = "stalker-cloud-db";

function getAdminSupabase() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function readJsonFromBucket<T>(path: string, fallback: T): Promise<T> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    // Seed initial file into Supabase Cloud
    await writeJsonToBucket(path, fallback);
    return fallback;
  }
  try {
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonToBucket<T>(path: string, payload: T): Promise<void> {
  const supabase = getAdminSupabase();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "application/json",
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  if (type === "watchlist") {
    const watchlist = await readJsonFromBucket(
      "watchlist.json",
      DEFAULT_WATCHLIST
    );
    return NextResponse.json({ watchlist, syncedWithSupabase: true });
  }

  if (type === "portfolio") {
    const portfolio = await readJsonFromBucket(
      "portfolio.json",
      DEFAULT_PORTFOLIO
    );
    return NextResponse.json({ portfolio, syncedWithSupabase: true });
  }

  const [watchlist, portfolio] = await Promise.all([
    readJsonFromBucket("watchlist.json", DEFAULT_WATCHLIST),
    readJsonFromBucket("portfolio.json", DEFAULT_PORTFOLIO),
  ]);

  return NextResponse.json({
    watchlist,
    portfolio,
    syncedWithSupabase: true,
    projectUrl: SUPABASE_URL,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, symbol } = body;

    if (type === "watchlist" && Array.isArray(data)) {
      await writeJsonToBucket("watchlist.json", data);
      return NextResponse.json({ ok: true, syncedWithSupabase: true });
    }

    if (type === "portfolio" && Array.isArray(data)) {
      await writeJsonToBucket("portfolio.json", data);
      return NextResponse.json({ ok: true, syncedWithSupabase: true });
    }

    if (type === "analysis" && data && symbol) {
      const safeSym = String(symbol).replace(/[^A-Z0-9._-]/gi, "_");
      await writeJsonToBucket(`analyses/${safeSym}.json`, data);
      return NextResponse.json({ ok: true, syncedWithSupabase: true });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (err) {
    console.error("Supabase cloud sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync with Supabase" },
      { status: 500 }
    );
  }
}
