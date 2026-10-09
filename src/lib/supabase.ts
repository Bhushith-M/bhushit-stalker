import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  HolisticStockIntelligence,
  PortfolioHolding,
  WatchlistItem,
} from "@/types/stock";

export interface RuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  openRouterApiKey: string;
  openRouterModel: string;
}

const STORAGE_KEYS = {
  CONFIG: "stalker_runtime_config_v1",
  WATCHLIST: "stalker_watchlist_v1",
  PORTFOLIO: "stalker_portfolio_v1",
  ANALYSES: "stalker_analyses_cache_v1",
};

export const DEFAULT_WATCHLIST: WatchlistItem[] = [
  {
    id: "wl-1",
    symbol: "WSTCSTPAPR.NS",
    ticker: "WSTCSTPAPR",
    exchange: "NSE",
    companyName: "West Coast Paper Mills Ltd",
    industry: "Paper & Optical Fiber Infrastructure",
  },
  {
    id: "wl-2",
    symbol: "HAL.NS",
    ticker: "HAL",
    exchange: "NSE",
    companyName: "Hindustan Aeronautics Ltd",
    industry: "Aerospace & Defense Manufacturing",
  },
  {
    id: "wl-3",
    symbol: "DIXON.NS",
    ticker: "DIXON",
    exchange: "NSE",
    companyName: "Dixon Technologies (India) Ltd",
    industry: "EMS & Consumer Electronics PLI",
  },
  {
    id: "wl-4",
    symbol: "TATAELXSI.NS",
    ticker: "TATAELXSI",
    exchange: "NSE",
    companyName: "Tata Elxsi Ltd",
    industry: "ER&D, Automotive SDV & AI",
  },
  {
    id: "wl-5",
    symbol: "RELIANCE.NS",
    ticker: "RELIANCE",
    exchange: "NSE",
    companyName: "Reliance Industries Ltd",
    industry: "Conglomerate, New Energy & Telecom",
  },
  {
    id: "wl-6",
    symbol: "HDFCBANK.NS",
    ticker: "HDFCBANK",
    exchange: "NSE",
    companyName: "HDFC Bank Ltd",
    industry: "Private Sector Banking",
  },
];

export const DEFAULT_PORTFOLIO: PortfolioHolding[] = [
  {
    id: "pf-1",
    symbol: "WSTCSTPAPR.NS",
    ticker: "WSTCSTPAPR",
    exchange: "NSE",
    companyName: "West Coast Paper Mills Ltd",
    quantity: 150,
    avgBuyPrice: 545.0,
    targetPrice: 760.0,
    stopLoss: 485.0,
    convictionThesis:
      "Subsidiary West Coast Optilinks / Sudarshan Telecom pivot into Optical Fiber Cable (OFC) + deep value paper cashflows; watching OFC capex execution closely.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pf-2",
    symbol: "HAL.NS",
    ticker: "HAL",
    exchange: "NSE",
    companyName: "Hindustan Aeronautics Ltd",
    quantity: 25,
    avgBuyPrice: 3890.0,
    targetPrice: 5200.0,
    stopLoss: 3550.0,
    convictionThesis:
      "Multi-year defense indigenization order book >₹94,000 Cr; Tejas Mk1A & helicopter engine manufacturing ramp-up.",
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SUPABASE_URL = "https://lokrsjfpbishwpwguhgb.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxva3JzamZwYmlzaHdwd2d1aGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MTQ5MjAsImV4cCI6MjEwNzA5MDkyMH0.Uv_jmJPi0HxankgF0yb01fZmlaAszEncXFS7bLVCfLs";

export function getRuntimeConfig(): RuntimeConfig {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  const envModel =
    process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "openrouter/luna-6";

  if (typeof window === "undefined") {
    return {
      supabaseUrl: envUrl,
      supabaseAnonKey: envKey,
      openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
      openRouterModel: process.env.OPENROUTER_MODEL || envModel,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.CONFIG);
    const saved = raw ? (JSON.parse(raw) as Partial<RuntimeConfig>) : {};
    return {
      supabaseUrl: saved.supabaseUrl || envUrl,
      supabaseAnonKey: saved.supabaseAnonKey || envKey,
      openRouterApiKey: saved.openRouterApiKey || "",
      openRouterModel: saved.openRouterModel || envModel,
    };
  } catch {
    return {
      supabaseUrl: envUrl,
      supabaseAnonKey: envKey,
      openRouterApiKey: "",
      openRouterModel: envModel,
    };
  }
}

export function saveRuntimeConfig(
  config: Partial<RuntimeConfig>
): RuntimeConfig {
  const current = getRuntimeConfig();
  const merged: RuntimeConfig = {
    ...current,
    ...config,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(merged));
  }
  return merged;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey } = getRuntimeConfig();
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("your-project-id") ||
    supabaseAnonKey.includes("your_supabase_anon_key")
  ) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

// ============================================================================
// WATCHLIST CRUD (Live Supabase Cloud + SQL + Local Fallback)
// ============================================================================

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  try {
    const res = await fetch("/api/supabase/state?type=watchlist");
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.watchlist) && json.watchlist.length > 0) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            STORAGE_KEYS.WATCHLIST,
            JSON.stringify(json.watchlist)
          );
        }
        return json.watchlist;
      }
    }
  } catch {
    // fallback below
  }

  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback to default
      }
    }
  }
  return DEFAULT_WATCHLIST;
}

export async function addToWatchlist(
  item: Omit<WatchlistItem, "id">
): Promise<WatchlistItem[]> {
  const current = await fetchWatchlist();
  const exists = current.some((w) => w.symbol === item.symbol);
  const updated = exists
    ? current
    : [
        {
          ...item,
          id: `wl-${Date.now()}`,
        },
        ...current,
      ];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEYS.WATCHLIST,
      JSON.stringify(updated)
    );
  }

  try {
    await fetch("/api/supabase/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "watchlist", data: updated }),
    });
  } catch {
    // non-blocking
  }

  return updated;
}

export async function removeFromWatchlist(
  symbol: string
): Promise<WatchlistItem[]> {
  const current = await fetchWatchlist();
  const updated = current.filter((w) => w.symbol !== symbol);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEYS.WATCHLIST,
      JSON.stringify(updated)
    );
  }

  try {
    await fetch("/api/supabase/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "watchlist", data: updated }),
    });
  } catch {
    // non-blocking
  }

  return updated;
}

// ============================================================================
// PORTFOLIO HOLDINGS CRUD (Live Supabase Cloud + SQL + Local Fallback)
// ============================================================================

export async function fetchPortfolioHoldings(): Promise<PortfolioHolding[]> {
  try {
    const res = await fetch("/api/supabase/state?type=portfolio");
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.portfolio) && json.portfolio.length > 0) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            STORAGE_KEYS.PORTFOLIO,
            JSON.stringify(json.portfolio)
          );
        }
        return json.portfolio;
      }
    }
  } catch {
    // fallback below
  }

  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return DEFAULT_PORTFOLIO;
}

export async function upsertPortfolioHolding(
  holding: Omit<PortfolioHolding, "id" | "createdAt">
): Promise<PortfolioHolding[]> {
  const current = await fetchPortfolioHoldings();
  const existingIdx = current.findIndex((h) => h.symbol === holding.symbol);
  let updated: PortfolioHolding[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...updated[existingIdx],
      ...holding,
    };
  } else {
    updated = [
      {
        ...holding,
        id: `pf-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ];
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEYS.PORTFOLIO,
      JSON.stringify(updated)
    );
  }

  try {
    await fetch("/api/supabase/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "portfolio", data: updated }),
    });
  } catch {
    // non-blocking
  }

  return updated;
}

export async function removePortfolioHolding(
  symbol: string
): Promise<PortfolioHolding[]> {
  const current = await fetchPortfolioHoldings();
  const updated = current.filter((h) => h.symbol !== symbol);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEYS.PORTFOLIO,
      JSON.stringify(updated)
    );
  }

  try {
    await fetch("/api/supabase/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "portfolio", data: updated }),
    });
  } catch {
    // non-blocking
  }

  return updated;
}

// ============================================================================
// STOCK INTELLIGENCE CACHE (Live Supabase Cloud Sync)
// ============================================================================

export async function saveAnalysisToSupabase(
  intelligence: HolisticStockIntelligence
): Promise<void> {
  try {
    await fetch("/api/supabase/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "analysis",
        symbol: intelligence.symbol,
        data: intelligence,
      }),
    });
  } catch {
    // non-blocking cache write
  }
}
