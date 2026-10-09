"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  Factory,
  FileText,
  Flame,
  Layers,
  Mic,
  Newspaper,
  Pin,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  HolisticStockIntelligence,
  PortfolioHolding,
  StockSearchResult,
  WatchlistItem,
} from "@/types/stock";
import {
  addToWatchlist,
  fetchPortfolioHoldings,
  fetchWatchlist,
  getRuntimeConfig,
  isSupabaseConfigured,
  removeFromWatchlist,
  removePortfolioHolding,
  RuntimeConfig,
  saveAnalysisToSupabase,
  saveRuntimeConfig,
  upsertPortfolioHolding,
} from "@/lib/supabase";
import PriceFibonacciChart from "@/components/PriceFibonacciChart";

type ActiveTab =
  | "ALL"
  | "TECHNICALS"
  | "SHAREHOLDING"
  | "CAPEX_SUBSIDIARY"
  | "CONCALLS"
  | "INDUSTRY_BOOM"
  | "REGULATORY_NEWS";

export default function StalkerDashboard({
  initialIntelligence,
}: {
  initialIntelligence: HolisticStockIntelligence;
}) {
  const [intelligence, setIntelligence] =
    useState<HolisticStockIntelligence>(initialIntelligence);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ALL");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  // Watchlist ("Up Here") & Portfolio state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [supabaseLive, setSupabaseLive] = useState(false);

  // Modals / Drawers
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [config, setConfig] = useState<RuntimeConfig>({
    supabaseUrl: "",
    supabaseAnonKey: "",
    openRouterApiKey: "",
    openRouterModel: "openrouter/luna-6",
  });

  // Add Holding Form state
  const [holdingQty, setHoldingQty] = useState("100");
  const [holdingAvgPrice, setHoldingAvgPrice] = useState(
    String(initialIntelligence.quote.price)
  );
  const [holdingTarget, setHoldingTarget] = useState(
    String(initialIntelligence.technicals.sellTargetZone.target1)
  );
  const [holdingStopLoss, setHoldingStopLoss] = useState(
    String(initialIntelligence.technicals.stopLoss)
  );
  const [holdingThesis, setHoldingThesis] = useState("");

  // News Filter
  const [newsFilter, setNewsFilter] = useState<string>("ALL");

  useEffect(() => {
    const runtimeCfg = getRuntimeConfig();
    setConfig(runtimeCfg);
    setSupabaseLive(isSupabaseConfigured());

    fetchWatchlist().then(setWatchlist);
    fetchPortfolioHoldings().then(setPortfolio);
  }, []);

  const loadStockIntelligence = useCallback(
    async (symbol: string) => {
      setLoadingSymbol(symbol);
      setSearchOpen(false);
      try {
        const runtimeCfg = getRuntimeConfig();
        const res = await fetch("/api/stocks/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol,
            openRouterApiKey: runtimeCfg.openRouterApiKey,
            openRouterModel: runtimeCfg.openRouterModel,
          }),
        });
        if (res.ok) {
          const data: HolisticStockIntelligence = await res.json();
          setIntelligence(data);
          setHoldingAvgPrice(String(data.quote.price));
          setHoldingTarget(String(data.technicals.sellTargetZone.target1));
          setHoldingStopLoss(String(data.technicals.stopLoss));
          await saveAnalysisToSupabase(data);
        }
      } catch (err) {
        console.error("Failed to load stock intelligence:", err);
      } finally {
        setLoadingSymbol(null);
      }
    },
    []
  );

  // Debounced Search
  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  const handlePinCurrentStock = async () => {
    const updated = await addToWatchlist({
      symbol: intelligence.symbol,
      ticker: intelligence.ticker,
      exchange: intelligence.exchange,
      companyName: intelligence.companyName,
      industry: intelligence.industryBoom.primaryIndustry,
    });
    setWatchlist(updated);
  };

  const handleRemoveWatchlist = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await removeFromWatchlist(symbol);
    setWatchlist(updated);
  };

  const handleSaveHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.max(Number(holdingQty) || 1, 1);
    const avg = Math.max(Number(holdingAvgPrice) || intelligence.quote.price, 1);
    const updated = await upsertPortfolioHolding({
      symbol: intelligence.symbol,
      ticker: intelligence.ticker,
      exchange: intelligence.exchange,
      companyName: intelligence.companyName,
      quantity: qty,
      avgBuyPrice: avg,
      targetPrice: Number(holdingTarget) || undefined,
      stopLoss: Number(holdingStopLoss) || undefined,
      convictionThesis:
        holdingThesis.trim() ||
        `${intelligence.technicals.verdict} | ${intelligence.capexAndSubsidiary.subsidiaryDiversification.newBoomingSector}`,
    });
    setPortfolio(updated);
    setPortfolioModalOpen(false);
  };

  const handleDeleteHolding = async (symbol: string) => {
    const updated = await removePortfolioHolding(symbol);
    setPortfolio(updated);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveRuntimeConfig(config);
    setConfig(updated);
    setSupabaseLive(isSupabaseConfigured());
    const [wl, pf] = await Promise.all([
      fetchWatchlist(),
      fetchPortfolioHoldings(),
    ]);
    setWatchlist(wl);
    setPortfolio(pf);
    setSettingsOpen(false);
    // Re-run current stock with new OpenRouter key/model if provided
    if (updated.openRouterApiKey) {
      loadStockIntelligence(intelligence.symbol);
    }
  };

  const isPinned = watchlist.some((w) => w.symbol === intelligence.symbol);
  const currentHolding = portfolio.find(
    (h) => h.symbol === intelligence.symbol
  );

  // Portfolio Aggregates
  const totalInvested = portfolio.reduce(
    (acc, h) => acc + h.quantity * h.avgBuyPrice,
    0
  );
  const totalCurrentValue = portfolio.reduce((acc, h) => {
    const livePrice =
      h.symbol === intelligence.symbol
        ? intelligence.quote.price
        : h.avgBuyPrice * 1.08;
    return acc + h.quantity * livePrice;
  }, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct =
    totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const {
    quote,
    technicals,
    shareholding,
    industryBoom,
    fundamentalsAndConcalls,
    capexAndSubsidiary,
    regulatoryFlags,
    news,
  } = intelligence;

  const filteredNews =
    newsFilter === "ALL"
      ? news
      : news.filter((n) => n.category === newsFilter);

  return (
    <div className="min-h-screen bg-[#060608] text-[#F5EFE6] pb-20">
      {/* =====================================================================
          TOP COMMAND HEADER & PINNED WATCHLIST RIBBON ("UP HERE")
      ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#24211D] bg-[#060608]/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4C5A9]/40 bg-[#131317] text-[#F5EFE6]">
                <Eye className="h-5 w-5 text-[#F5EFE6]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-mono text-sm font-bold tracking-wider text-[#F5EFE6]">
                    BHUSHIT THE STALKER
                  </h1>
                  <span className="rounded border border-[#2E2A24] bg-[#141418] px-1.5 py-0.5 font-mono text-[10px] text-[#D4C5A9]">
                    NSE • BSE FORENSICS
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8474]">
                  Institutional Shareholding • RSI/Fibonacci • Con-Calls • Capex
                  Bottlenecks • ED/SEBI Radar
                </p>
              </div>
            </div>

            {/* Universal NSE / BSE Stock Search Bar */}
            <div className="relative flex-1 max-w-xl min-w-[260px]">
              <div className="flex items-center rounded-lg border border-[#2E2A24] bg-[#0D0D10] px-3 py-2 focus-within:border-[#F5EFE6]">
                <Search className="mr-2.5 h-4 w-4 text-[#96876B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      const raw = searchQuery.trim().toUpperCase();
                      const formatted = raw.includes(".") ? raw : `${raw}.NS`;
                      loadStockIntelligence(formatted);
                    }
                  }}
                  placeholder="Search any NSE or BSE stock (e.g. WSTCSTPAPR, HAL, DIXON, RELIANCE, HFCL)..."
                  className="w-full bg-transparent text-xs text-[#F5EFE6] placeholder-[#6E624D] focus:outline-none font-mono"
                />
                {loadingSymbol && (
                  <RefreshCw className="ml-2 h-3.5 w-3.5 animate-spin text-[#F5EFE6]" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="ml-1 text-[#8E8474] hover:text-[#F5EFE6]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Search Autocomplete Dropdown */}
              {searchOpen && (
                <div className="absolute left-0 right-0 top-11 z-50 max-h-96 overflow-y-auto rounded-xl border border-[#2E2A24] bg-[#0D0D10] p-2 shadow-2xl">
                  <div className="mb-1.5 flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8E8474]">
                    <span>
                      {searching
                        ? "Scanning NSE & BSE..."
                        : "NSE / BSE Equities (Click to Analyze & Pin Up Here)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="text-[#D4C5A9] hover:underline"
                    >
                      Close
                    </button>
                  </div>

                  {searchResults.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => loadStockIntelligence(item.symbol)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[#17171C]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#F5EFE6]">
                            {item.ticker}
                          </span>
                          <span className="rounded border border-[#2E2A24] bg-[#141418] px-1.5 py-0.2 font-mono text-[10px] text-[#D4C5A9]">
                            {item.exchange}
                          </span>
                          {item.isManufacturing && (
                            <span className="rounded bg-[#1E1D1A] px-1.5 py-0.2 font-mono text-[10px] text-[#B8A686]">
                              Manufacturing / Capex Tracked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#D4C5A9]">
                          {item.companyName}
                        </p>
                      </div>
                      <span className="max-w-[200px] truncate text-right font-mono text-[10px] text-[#8E8474]">
                        {item.industry}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Status & Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPortfolioModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#2E2A24] bg-[#121216] px-3 py-2 font-mono text-xs text-[#F5EFE6] transition hover:border-[#D4C5A9]"
              >
                <Briefcase className="h-3.5 w-3.5 text-[#D4C5A9]" />
                <span>Portfolio ({portfolio.length})</span>
                <span
                  className={`ml-1 font-semibold ${
                    totalPnl >= 0 ? "text-[#4ADE80]" : "text-[#F87171]"
                  }`}
                >
                  {totalPnl >= 0 ? "+" : ""}
                  {totalPnlPct.toFixed(1)}%
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#2E2A24] bg-[#121216] px-3 py-2 font-mono text-xs text-[#D4C5A9] transition hover:border-[#F5EFE6] hover:text-[#F5EFE6]"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Supabase & Luna 6</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    supabaseLive ? "bg-[#4ADE80]" : "bg-[#FBBF24]"
                  }`}
                  title={
                    supabaseLive
                      ? "Supabase Connected"
                      : "Local Persistence Mode (Click to add Supabase Credentials)"
                  }
                />
              </button>
            </div>
          </div>

          {/* PINNED STOCKS RIBBON ("UP HERE") */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto border-t border-[#1A1815] pt-2.5 pb-1">
            <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-[#96876B]">
              <Pin className="h-3 w-3" /> Pinned Up Here:
            </span>
            {watchlist.map((item) => {
              const isSelected = item.symbol === intelligence.symbol;
              const isLoading = loadingSymbol === item.symbol;
              return (
                <div
                  key={item.symbol}
                  onClick={() => loadStockIntelligence(item.symbol)}
                  className={`group flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-mono transition ${
                    isSelected
                      ? "border-[#F5EFE6] bg-[#F5EFE6] text-[#060608] font-semibold"
                      : "border-[#24211D] bg-[#0E0E12] text-[#D4C5A9] hover:border-[#6E624D] hover:text-[#F5EFE6]"
                  }`}
                >
                  <span>{item.ticker}</span>
                  <span
                    className={`rounded px-1 text-[9px] ${
                      isSelected
                        ? "bg-[#060608]/15 text-[#060608]"
                        : "bg-[#1A1815] text-[#96876B]"
                    }`}
                  >
                    {item.exchange}
                  </span>
                  {isLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  )}
                  {watchlist.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveWatchlist(item.symbol, e)}
                      className={`opacity-60 hover:opacity-100 ${
                        isSelected ? "text-[#060608]" : "text-[#8E8474]"
                      }`}
                      title="Unpin from top bar"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {!isPinned && (
              <button
                type="button"
                onClick={handlePinCurrentStock}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-[#6E624D] px-2.5 py-1 font-mono text-xs text-[#F5EFE6] hover:border-[#F5EFE6]"
              >
                <Plus className="h-3 w-3" /> Pin {intelligence.ticker} Up Here
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN WORKSPACE CONTAINER
      ===================================================================== */}
      <main className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6">
        {/* 1. STOCK HERO & HOLISTIC EXECUTIVE SUMMARY */}
        <section className="rounded-2xl border border-[#24211D] bg-[#0B0B0E] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-md bg-[#F5EFE6] px-2.5 py-0.5 font-mono text-xs font-bold text-[#060608]">
                  {quote.exchange}: {quote.ticker}
                </span>
                <span className="rounded-md border border-[#2E2A24] bg-[#141418] px-2.5 py-0.5 font-mono text-xs text-[#D4C5A9]">
                  {industryBoom.primaryIndustry}
                </span>
                <span className="flex items-center gap-1 rounded-md border border-[#2E2A24] bg-[#141418] px-2.5 py-0.5 font-mono text-[11px] text-[#B8A686]">
                  <Sparkles className="h-3 w-3 text-[#F5EFE6]" />
                  LLM: {intelligence.modelUsed}
                </span>
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#F5EFE6] sm:text-3xl">
                {quote.companyName}
              </h2>
              <p className="mt-0.5 font-mono text-xs text-[#96876B]">
                Category: {industryBoom.operatingCategory}
              </p>
            </div>

            {/* Live Price + Action Verdict + Quick Portfolio Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-left lg:text-right">
                <div className="flex items-baseline gap-2 lg:justify-end">
                  <span className="font-mono text-3xl font-bold text-[#F5EFE6]">
                    ₹{quote.price.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`flex items-center font-mono text-sm font-medium ${
                      quote.change >= 0 ? "text-[#4ADE80]" : "text-[#F87171]"
                    }`}
                  >
                    {quote.change >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {quote.change >= 0 ? "+" : ""}
                    {quote.change} ({quote.change >= 0 ? "+" : ""}
                    {quote.changePercent}%)
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#8E8474]">
                  52W: ₹{quote.fiftyTwoWeekLow} – ₹{quote.fiftyTwoWeekHigh} •
                  MCap: ₹{quote.marketCapCr.toLocaleString("en-IN")} Cr
                </p>
              </div>

              {/* Technical Verdict Pill */}
              <div
                className={`rounded-xl border px-4 py-2.5 font-mono ${
                  technicals.verdict.includes("BUY")
                    ? "border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]"
                    : technicals.verdict.includes("SELL")
                    ? "border-[#F87171]/40 bg-[#F87171]/10 text-[#F87171]"
                    : "border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FBBF24]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-80">
                  Action Signal ({technicals.confidenceScore}% Conf.)
                </div>
                <div className="text-sm font-bold">{technicals.verdict}</div>
              </div>

              <button
                type="button"
                onClick={() => setPortfolioModalOpen(true)}
                className="rounded-xl bg-[#F5EFE6] px-4 py-2.5 font-mono text-xs font-semibold text-[#060608] transition hover:bg-[#E8DEC8]"
              >
                {currentHolding
                  ? `In Portfolio (${currentHolding.quantity} Sh.)`
                  : "+ Track in Portfolio"}
              </button>
            </div>
          </div>

          {/* Key Fundamental Multiples Strip */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-[#1E1D1A] pt-4 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { label: "P/E Ratio", value: `${quote.peRatio ?? "—"}x` },
              { label: "Price / Book", value: `${quote.pbRatio ?? "—"}x` },
              { label: "ROE", value: `${quote.roePercent ?? "—"}%` },
              { label: "ROCE", value: `${quote.rocePercent ?? "—"}%` },
              { label: "Debt / Equity", value: `${quote.debtToEquity ?? "—"}x` },
              { label: "Promoter Stake", value: `${shareholding.promoterPercent}%` },
              {
                label: "FII + DII Stake",
                value: `${(
                  shareholding.fiiPercent + shareholding.diiPercent
                ).toFixed(2)}%`,
              },
              {
                label: "RSI (14)",
                value: `${technicals.rsi14.value} (${
                  technicals.rsi14.value > 70
                    ? "Overbought"
                    : technicals.rsi14.value < 35
                    ? "Oversold"
                    : "Bullish/Neutral"
                })`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-[#1E1D1A] bg-[#0F0F13] px-3 py-2"
              >
                <div className="font-mono text-[10px] uppercase text-[#8E8474]">
                  {stat.label}
                </div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-[#F5EFE6]">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Holistic Forensic Thesis Box */}
          <div className="mt-4 rounded-xl border border-[#2E2A24] bg-[#111115] p-4">
            <div className="mb-1.5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#D4C5A9]">
              <Sparkles className="h-4 w-4 text-[#F5EFE6]" />
              Holistic Stalker Synthesis (Fundamental + Technical + Capex +
              Regulatory)
            </div>
            <p className="text-sm leading-relaxed text-[#E8DEC8]">
              {intelligence.holisticExecutiveSummary}
            </p>
          </div>
        </section>

        {/* SECTION NAVIGATION PILLS */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: "ALL", label: "All Holistic Intelligence (Full Dossier)" },
            { id: "TECHNICALS", label: "Technicals (RSI, Fibonacci, Buy/Sell/Hold)" },
            { id: "SHAREHOLDING", label: "Who Bought It (FII, DII, HNI & Insiders)" },
            {
              id: "CAPEX_SUBSIDIARY",
              label: "Capex, Subsidiary Pivot & Order Bottlenecks",
            },
            { id: "CONCALLS", label: "Con-Calls, Presentations & CEO/Board" },
            { id: "INDUSTRY_BOOM", label: "Industry & Boom Horizon" },
            { id: "REGULATORY_NEWS", label: "Regulatory (ED/SEBI) & All News" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`shrink-0 rounded-lg border px-3.5 py-2 font-mono text-xs transition ${
                activeTab === tab.id
                  ? "border-[#F5EFE6] bg-[#F5EFE6] text-[#060608] font-semibold"
                  : "border-[#24211D] bg-[#0D0D10] text-[#D4C5A9] hover:border-[#6E624D]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =====================================================================
            PILLAR 1: DEEP TECHNICAL ANALYSIS (BUY / SELL / HOLD + WHY: RSI & FIBONACCI)
        ===================================================================== */}
        {(activeTab === "ALL" || activeTab === "TECHNICALS") && (
          <section className="mt-6 rounded-2xl border border-[#24211D] bg-[#0B0B0E] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1D1A] pb-4">
              <div className="flex items-center gap-2.5">
                <Activity className="h-5 w-5 text-[#F5EFE6]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#F5EFE6]">
                    Deep Technical Analysis: When to Buy, Hold, or Sell & Why
                  </h3>
                  <p className="text-xs text-[#96876B]">
                    Quantitative reasoning backed by 14-Period RSI, Fibonacci
                    Retracements, Moving Averages & MACD
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="rounded-md border border-[#4ADE80]/30 bg-[#4ADE80]/10 px-2.5 py-1 text-[#4ADE80]">
                  Buy Zone: ₹{technicals.idealBuyZone.min} – ₹
                  {technicals.idealBuyZone.max}
                </span>
                <span className="rounded-md border border-[#F5EFE6]/30 bg-[#141418] px-2.5 py-1 text-[#F5EFE6]">
                  Targets: ₹{technicals.sellTargetZone.target1} / ₹
                  {technicals.sellTargetZone.target2}
                </span>
                <span className="rounded-md border border-[#F87171]/30 bg-[#F87171]/10 px-2.5 py-1 text-[#F87171]">
                  Stop Loss: ₹{technicals.stopLoss} (R:R{" "}
                  {technicals.riskRewardRatio})
                </span>
              </div>
            </div>

            {/* Interactive SVG Chart + Fibonacci Retracement Levels */}
            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PriceFibonacciChart
                  symbol={quote.symbol}
                  currentPrice={quote.price}
                  candles={quote.candles}
                  fibonacciLevels={technicals.fibonacci.levels}
                  idealBuyZone={technicals.idealBuyZone}
                  stopLoss={technicals.stopLoss}
                />

                {/* Headline Why Box */}
                <div className="mt-4 rounded-xl border border-[#2A2722] bg-[#111115] p-4">
                  <div className="font-mono text-xs font-semibold uppercase text-[#F5EFE6]">
                    Primary Technical Verdict & Reasoning
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#E8DEC8]">
                    {technicals.headlineReasoning}
                  </p>
                  <div className="mt-3 border-t border-[#22201C] pt-2.5 text-xs text-[#D4C5A9]">
                    <strong className="text-[#F5EFE6]">
                      Should You Hold Right Now?{" "}
                    </strong>
                    {technicals.holdVerdictExplanation}
                  </div>
                </div>
              </div>

              {/* Fibonacci Sequence Table */}
              <div className="rounded-xl border border-[#24211D] bg-[#0F0F13] p-4">
                <div className="flex items-center justify-between border-b border-[#1E1D1A] pb-2.5">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#F5EFE6]">
                    Fibonacci Retracement Ladder
                  </span>
                  <span className="font-mono text-[11px] text-[#96876B]">
                    Golden Pocket: ₹{technicals.fibonacci.goldenPocketPrice}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {technicals.fibonacci.levels.map((lvl) => {
                    const isGolden = lvl.numericRatio === 0.618;
                    return (
                      <div
                        key={lvl.ratio}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-xs ${
                          isGolden
                            ? "border-[#F5EFE6]/60 bg-[#1B1A17] text-[#F5EFE6]"
                            : "border-[#1E1D1A] bg-[#131317] text-[#D4C5A9]"
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{lvl.ratio}</div>
                          <div className="text-[10px] text-[#8E8474]">
                            {lvl.role}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#F5EFE6]">
                            ₹{lvl.price}
                          </div>
                          <div
                            className={`text-[10px] ${
                              lvl.distancePercent >= 0
                                ? "text-[#4ADE80]"
                                : "text-[#FBBF24]"
                            }`}
                          >
                            {lvl.distancePercent >= 0 ? "+" : ""}
                            {lvl.distancePercent}% from CMP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Indicator-by-Indicator Reasoning Cards (RSI, Fibonacci, DMA, MACD) */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#24211D] bg-[#0F0F13] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase text-[#D4C5A9]">
                    1. RSI (14) Momentum Diagnostics
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                      technicals.rsi14.value >= 70
                        ? "bg-[#F87171]/20 text-[#F87171]"
                        : technicals.rsi14.value <= 35
                        ? "bg-[#4ADE80]/20 text-[#4ADE80]"
                        : "bg-[#F5EFE6]/15 text-[#F5EFE6]"
                    }`}
                  >
                    RSI: {technicals.rsi14.value} • {technicals.rsi14.zone}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#E8DEC8]">
                  {technicals.rsi14.reasoning}
                </p>
              </div>

              <div className="rounded-xl border border-[#24211D] bg-[#0F0F13] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase text-[#D4C5A9]">
                    2. Fibonacci Sequence Structure
                  </span>
                  <span className="rounded bg-[#F5EFE6]/15 px-2 py-0.5 font-mono text-xs text-[#F5EFE6]">
                    Support ₹{technicals.fibonacci.nearestSupport} • Res ₹
                    {technicals.fibonacci.nearestResistance}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#E8DEC8]">
                  {technicals.fibonacci.reasoning}
                </p>
              </div>

              <div className="rounded-xl border border-[#24211D] bg-[#0F0F13] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase text-[#D4C5A9]">
                    3. Moving Averages (20 / 50 / 200 DMA)
                  </span>
                  <span className="rounded bg-[#1A1815] px-2 py-0.5 font-mono text-[11px] text-[#D4C5A9]">
                    {technicals.movingAverages.trendAlignment}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#E8DEC8]">
                  {technicals.movingAverages.reasoning}
                </p>
              </div>

              <div className="rounded-xl border border-[#24211D] bg-[#0F0F13] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase text-[#D4C5A9]">
                    4. MACD (12, 26, 9) Trend Impulse
                  </span>
                  <span className="rounded bg-[#1A1815] px-2 py-0.5 font-mono text-[11px] text-[#D4C5A9]">
                    {technicals.macd.crossoverState}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#E8DEC8]">
                  {technicals.macd.reasoning}
                </p>
              </div>
            </div>

            {/* Actionable Execution Rules: When to Buy / Hold / Sell */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#4ADE80]/30 bg-[#4ADE80]/5 p-4">
                <div className="font-mono text-xs font-bold uppercase text-[#4ADE80]">
                  When to BUY / Accumulate
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E8DEC8]">
                  {technicals.actionableChecklist.whenToBuy}
                </p>
              </div>
              <div className="rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/5 p-4">
                <div className="font-mono text-xs font-bold uppercase text-[#FBBF24]">
                  When to HOLD Existing Shares
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E8DEC8]">
                  {technicals.actionableChecklist.whenToHold}
                </p>
              </div>
              <div className="rounded-xl border border-[#F87171]/30 bg-[#F87171]/5 p-4">
                <div className="font-mono text-xs font-bold uppercase text-[#F87171]">
                  When to SELL / Book Profits
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E8DEC8]">
                  {technicals.actionableChecklist.whenToSell}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            PILLAR 2: MANUFACTURING CAPEX, CAPITAL FORMATION & SUBSIDIARY BOTTLENECK AUDIT
            (Explicitly highlights Subsidiary pivots like Optical Fiber + Capex vs Order Book Delays)
        ===================================================================== */}
        {(activeTab === "ALL" || activeTab === "CAPEX_SUBSIDIARY") && (
          <section className="mt-6 rounded-2xl border border-[#24211D] bg-[#0B0B0E] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1D1A] pb-4">
              <div className="flex items-center gap-2.5">
                <Factory className="h-5 w-5 text-[#F5EFE6]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#F5EFE6]">
                    Manufacturing Capex, Capital Formation & Subsidiary
                    Diversification Audit
                  </h3>
                  <p className="text-xs text-[#96876B]">
                    Tracks Gross Block, CWIP, Booming Subsidiary Pivots (e.g.
                    Optical Fiber) & Capex-vs-Order-Book Execution Delays
                  </p>
                </div>
              </div>

              <span
                className={`rounded-lg border px-3 py-1 font-mono text-xs font-semibold ${
                  capexAndSubsidiary.capexVsOrderBookBottleneck.bottleneckRiskLevel.includes(
                    "HIGH"
                  )
                    ? "border-[#FBBF24]/50 bg-[#FBBF24]/15 text-[#FBBF24]"
                    : "border-[#D4C5A9]/40 bg-[#141418] text-[#F5EFE6]"
                }`}
              >
                {
                  capexAndSubsidiary.capexVsOrderBookBottleneck
                    .bottleneckRiskLevel
                }{" "}
                • Plant Utilization:{" "}
                {capexAndSubsidiary.capacityUtilizationPercent}%
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left: Subsidiary Divergence into Booming Sector */}
              <div className="rounded-xl border border-[#2E2A24] bg-[#101014] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#4ADE80]">
                    Subsidiary & Sector Divergence Spotlight
                  </span>
                  <span className="rounded border border-[#4ADE80]/30 bg-[#4ADE80]/10 px-2 py-0.5 font-mono text-[10px] text-[#4ADE80]">
                    BOOM SECTOR PIVOT
                  </span>
                </div>

                <h4 className="mt-2 text-base font-semibold text-[#F5EFE6]">
                  {
                    capexAndSubsidiary.subsidiaryDiversification
                      .subsidiaryOrDivisionName
                  }
                </h4>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#22201C] bg-[#0B0B0E] p-3">
                    <div className="font-mono text-[10px] uppercase text-[#8E8474]">
                      Legacy Core Business
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#D4C5A9]">
                      {
                        capexAndSubsidiary.subsidiaryDiversification
                          .coreLegacyBusiness
                      }
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#4ADE80]/30 bg-[#0B0B0E] p-3">
                    <div className="font-mono text-[10px] uppercase text-[#4ADE80]">
                      New Booming Sector Pivot
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[#F5EFE6]">
                      {
                        capexAndSubsidiary.subsidiaryDiversification
                          .newBoomingSector
                      }
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-[#22201C] bg-[#141419] p-3">
                  <div className="font-mono text-[11px] font-semibold text-[#F5EFE6]">
                    {
                      capexAndSubsidiary.subsidiaryDiversification
                        .strategicVerdict
                    }
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#E8DEC8]">
                    {capexAndSubsidiary.subsidiaryDiversification.growthWhy}
                  </p>
                </div>

                {/* Capital Formation & Gross Block Metrics */}
                <div className="mt-4 space-y-2 border-t border-[#22201C] pt-3 text-xs">
                  <div>
                    <span className="font-mono text-[#96876B]">
                      Capital Formation & Fixed Assets:{" "}
                    </span>
                    <span className="text-[#E8DEC8]">
                      {capexAndSubsidiary.capitalFormationSummary}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[#96876B]">
                      Gross Block Split:{" "}
                    </span>
                    <span className="text-[#E8DEC8]">
                      {capexAndSubsidiary.grossBlockTrend}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[#96876B]">
                      CWIP (Capital Work in Progress):{" "}
                    </span>
                    <span className="text-[#E8DEC8]">
                      {capexAndSubsidiary.cwipStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Capex vs Order Book Bottleneck & Revenue Delay Warning */}
              <div className="rounded-xl border border-[#FBBF24]/40 bg-[#12110E] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
                    <AlertTriangle className="h-4 w-4" />
                    Capex vs. Order Book Bottleneck & Delay Forensic Check
                  </span>
                  <span className="rounded bg-[#FBBF24]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#FBBF24]">
                    SALES BOOK EXECUTION RISK
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-[#2C271D] bg-[#0B0B0E] p-3.5">
                    <div className="font-mono text-[11px] uppercase text-[#D4C5A9]">
                      1. Upfront Capex Intensity Check
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#F5EFE6]">
                      {
                        capexAndSubsidiary.capexVsOrderBookBottleneck
                          .currentCapexIntensity
                      }
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#2C271D] bg-[#0B0B0E] p-3.5">
                    <div className="font-mono text-[11px] uppercase text-[#D4C5A9]">
                      2. Why Under-Capex Creates Order Delays
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#E8DEC8]">
                      {
                        capexAndSubsidiary.capexVsOrderBookBottleneck
                          .bottleneckAnalysis
                      }
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#F87171]/40 bg-[#F87171]/10 p-3.5">
                    <div className="font-mono text-[11px] font-bold uppercase text-[#F87171]">
                      3. Sales Book & Revenue Leakage Impact
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#F5EFE6]">
                      {
                        capexAndSubsidiary.capexVsOrderBookBottleneck
                          .revenueDelayWarning
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            PILLAR 3: WHO BOUGHT IT — FIIs, DIIs, MARQUEE HNIs & INSIDER BUYING
        ===================================================================== */}
        {(activeTab === "ALL" || activeTab === "SHAREHOLDING") && (
          <section className="mt-6 rounded-2xl border border-[#24211D] bg-[#0B0B0E] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1D1A] pb-4">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#F5EFE6]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#F5EFE6]">
                    Who Bought It: DIIs, FIIs, Marquee HNIs & Insider/Director
                    Deals
                  </h3>
                  <p className="text-xs text-[#96876B]">
                    {shareholding.summaryVerdict}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="rounded border border-[#2E2A24] bg-[#141418] px-2.5 py-1 text-[#F5EFE6]">
                  Promoter Pledge: {shareholding.promoterPledgePercent}%
                </span>
                <span className="rounded border border-[#4ADE80]/30 bg-[#4ADE80]/10 px-2.5 py-1 text-[#4ADE80]">
                  DII QoQ: +{shareholding.diiChangeQoQ}%
                </span>
              </div>
            </div>

            {/* Ownership Proportion Visual Bar */}
            <div className="mt-4">
              <div className="mb-2 flex flex-wrap justify-between gap-2 font-mono text-xs">
                <span className="text-[#F5EFE6]">
                  Promoters: <strong>{shareholding.promoterPercent}%</strong> (
                  {shareholding.promoterChangeQoQ >= 0 ? "+" : ""}
                  {shareholding.promoterChangeQoQ}% QoQ)
                </span>
                <span className="text-[#D4C5A9]">
                  DIIs (Mutual Funds/LIC):{" "}
                  <strong>{shareholding.diiPercent}%</strong> (
                  {shareholding.diiChangeQoQ >= 0 ? "+" : ""}
                  {shareholding.diiChangeQoQ}% QoQ)
                </span>
                <span className="text-[#4ADE80]">
                  FIIs / FPIs: <strong>{shareholding.fiiPercent}%</strong> (
                  {shareholding.fiiChangeQoQ >= 0 ? "+" : ""}
                  {shareholding.fiiChangeQoQ}% QoQ)
                </span>
                <span className="text-[#96876B]">
                  Public & HNIs:{" "}
                  <strong>{shareholding.publicAndHniPercent}%</strong>
                </span>
              </div>

              <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#18181D]">
                <div
                  style={{ width: `${shareholding.promoterPercent}%` }}
                  className="bg-[#F5EFE6]"
                  title="Promoters"
                />
                <div
                  style={{ width: `${shareholding.diiPercent}%` }}
                  className="bg-[#C8B89A]"
                  title="DIIs"
                />
                <div
                  style={{ width: `${shareholding.fiiPercent}%` }}
                  className="bg-[#4ADE80]"
                  title="FIIs"
                />
                <div
                  style={{ width: `${shareholding.publicAndHniPercent}%` }}
                  className="bg-[#3A352D]"
                  title="Public & HNIs"
                />
              </div>
            </div>

            {/* Named Institutional & HNI Buyers + Insider Deals Grid */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Specific DIIs, FIIs & HNIs */}
              <div>
                <h4 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#D4C5A9]">
                  Named DIIs, FIIs & High-Net-Worth (HNI) Holders
                </h4>
                <div className="space-y-2.5">
                  {shareholding.notableBuyers.map((buyer, idx) => (
                    <div
                      key={buyer.name + idx}
                      className="rounded-xl border border-[#22201C] bg-[#0F0F13] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[#F5EFE6] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#060608]">
                            {buyer.category}
                          </span>
                          <span className="text-sm font-semibold text-[#F5EFE6]">
                            {buyer.name}
                          </span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="font-bold text-[#F5EFE6]">
                            {buyer.stakePercent}%
                          </span>
                          <span
                            className={`ml-1.5 text-[11px] ${
                              buyer.changeQoQ >= 0
                                ? "text-[#4ADE80]"
                                : "text-[#F87171]"
                            }`}
                          >
                            ({buyer.changeQoQ >= 0 ? "+" : ""}
                            {buyer.changeQoQ}%)
                          </span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-[#C8BFA8]">
                        {buyer.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promoter, CEO & Director Open-Market Purchases */}
              <div>
                <h4 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#D4C5A9]">
                  Promoter, CEO & Director Share Purchases (SAST / Insider
                  Deals)
                </h4>
                <div className="space-y-2.5">
                  {shareholding.insiderTransactions.map((tx, idx) => (
                    <div
                      key={tx.personName + idx}
                      className="rounded-xl border border-[#2E2A24] bg-[#111116] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-[#F5EFE6]">
                            {tx.personName}
                          </div>
                          <div className="font-mono text-[11px] text-[#96876B]">
                            {tx.designation} • {tx.mode} ({tx.date})
                          </div>
                        </div>
                        <span className="rounded border border-[#4ADE80]/40 bg-[#4ADE80]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#4ADE80]">
                          {tx.signal}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-[#1E1D1A] pt-2 font-mono text-xs text-[#E8DEC8]">
                        <span>
                          Qty: {tx.sharesQuantity.toLocaleString("en-IN")} shares
                        </span>
                        <span>Avg Price: ₹{tx.avgPrice}</span>
                        <span className="font-bold text-[#F5EFE6]">
                          Value: ₹{tx.valueCr} Cr
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            PILLAR 4: FUNDAMENTAL ANALYSIS — CON-CALLS, PRESENTATIONS, MEETINGS & SKIN-IN-THE-GAME
        ===================================================================== */}
        {(activeTab === "ALL" || activeTab === "CONCALLS") && (
          <section className="mt-6 rounded-2xl border border-[#24211D] bg-[#0B0B0E] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1D1A] pb-4">
              <div className="flex items-center gap-2.5">
                <Mic className="h-5 w-5 text-[#F5EFE6]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#F5EFE6]">
                    Fundamental & Boardroom Audit: Con-Calls, Investor
                    Presentations & Directors&apos; Conviction
                  </h3>
                  <p className="text-xs text-[#96876B]">
                    Synthesizes quarterly phone calls, investor presentations,
                    AGM meetings & management share buying
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-[#4ADE80]/40 bg-[#4ADE80]/10 px-3 py-1 font-mono text-xs font-semibold text-[#4ADE80]">
                Management Optimism:{" "}
                {fundamentalsAndConcalls.managementOptimismScore}/100 •{" "}
                {fundamentalsAndConcalls.managementTone}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#2E2A24] bg-[#101014] p-4">
                <div className="font-mono text-xs font-semibold uppercase text-[#F5EFE6]">
                  Why Con-Calls + Insider Buying Signal Conviction
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E8DEC8]">
                  {fundamentalsAndConcalls.fundamentalBuyThesis}
                </p>
              </div>

              <div className="rounded-xl border border-[#2E2A24] bg-[#101014] p-4">
                <div className="font-mono text-xs font-semibold uppercase text-[#4ADE80]">
                  CEO / Directors&apos; Talk vs. Open-Market Share Buying
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E8DEC8]">
                  {fundamentalsAndConcalls.skinInTheGameCorrelation}
                </p>
              </div>
            </div>

            {/* Con-Call, Presentation & AGM Breakdown Cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {fundamentalsAndConcalls.concallsAndMeetings.map((note, idx) => (
                <div
                  key={note.sourceType + idx}
                  className="flex flex-col justify-between rounded-xl border border-[#22201C] bg-[#0F0F13] p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-[#F5EFE6] px-2 py-0.5 font-mono text-[10px] font-bold text-[#060608]">
                        {note.sourceType}
                      </span>
                      <span className="font-mono text-[10px] text-[#4ADE80]">
                        {note.sentiment}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-[#D4C5A9]">
                      Speaker: {note.speaker} ({note.dateOrQuarter})
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#F5EFE6]">
                      {note.keyTakeaway}
                    </p>
                  </div>

                  <blockquote className="mt-3 border-l-2 border-[#D4C5A9] pl-2.5 italic text-[11px] text-[#B8A686]">
                    {note.verbatimOrParaphrasedInsight}
                  </blockquote>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================================
            PILLAR 5: INDUSTRY, CATEGORY & SECTOR BOOM HORIZON (MONTHS vs YEARS)
        ===================================================================== */}
        {(activeTab === "ALL" || activeTab === "INDUSTRY_BOOM") && (
          <section className="mt-6 rounded-2xl border border-[#24211D] bg-[#0B0B0E] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1D1A] pb-4">
              <div className="flex items-center gap-2.5">
                <Flame className="h-5 w-5 text-[#F5EFE6]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#F5EFE6]">
                    Industry, Operating Category & Sector Boom Horizon
                  </h3>
                  <p className="text-xs text-[#96876B]">
                    {industryBoom.primaryIndustry} •{" "}
                    {industryBoom.valueChainPosition}
                  </p>
                </div>
              </div>

              <span className="rounded-lg border border-[#F5EFE6]/40 bg-[#161512] px-3 py-1 font-mono text-xs font-bold text-[#F5EFE6]">
                {industryBoom.boomStatus} (Boom Score: {industryBoom.boomScore}
                /100)
              </span>
            </div>

            {/* 3 Horizon Cards: Next Few Months, 1-3 Years, 3-5+ Years */}
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                industryBoom.shortTermOutlook,
                industryBoom.mediumTermOutlook,
                industryBoom.longTermOutlook,
              ].map((horizonItem) => (
                <div
                  key={horizonItem.horizon}
                  className="rounded-xl border border-[#24211D] bg-[#0F0F13] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-[#F5EFE6]">
                      {horizonItem.horizon}
                    </span>
                    <span className="rounded border border-[#4ADE80]/30 bg-[#4ADE80]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#4ADE80]">
                      {horizonItem.trajectory}
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#E8DEC8]">
                    {horizonItem.reasoning}
                  </p>
                </div>
              ))}
            </div>

            {/* Structural Reasons Why the Sector Will Boom */}
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {industryBoom.boomDrivers.map((driver, idx) => (
                <div
                  key={driver.title + idx}
                  className="rounded-xl border border-[#22201C] bg-[#121216] p-4"
                >
                  <span className="rounded bg-[#24211D] px-2 py-0.5 font-mono text-[10px] text-[#D4C5A9]">
                    {driver.category}
                  </span>
                  <h4 className="mt-2 text-sm font-semibold text-[#F5EFE6]">
                    {driver.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#C8BFA8]">
                    {driver.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================================
            PILLAR 6: REGULATORY / ED / SEBI SCANNER & ALL-INCLUSIVE NEWS WIRE
        ===================================================================== */}
        {(activeTab === "ALL" || activeTab === "REGULATORY_NEWS") && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Regulatory, ED, SEBI & Pollution Control Scanner (5 cols) */}
            <section className="rounded-2xl border border-[#24211D] bg-[#0B0B0E] p-5 lg:col-span-5">
              <div className="flex items-center gap-2 border-b border-[#1E1D1A] pb-3.5">
                <ShieldAlert className="h-5 w-5 text-[#F5EFE6]" />
                <div>
                  <h3 className="text-base font-semibold text-[#F5EFE6]">
                    Regulatory, ED, SEBI & Compliance Radar
                  </h3>
                  <p className="text-[11px] text-[#96876B]">
                    Enforcement Directorate (ED), SEBI, NGT/Pollution & Customs
                    checks
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {regulatoryFlags.map((flag) => {
                  const isRed = flag.status.includes("ACTIVE");
                  const isWatch = flag.status.includes("MONITOR");
                  return (
                    <div
                      key={flag.id}
                      className={`rounded-xl border p-3.5 ${
                        isRed
                          ? "border-[#F87171]/40 bg-[#F87171]/10"
                          : isWatch
                          ? "border-[#FBBF24]/35 bg-[#FBBF24]/5"
                          : "border-[#22201C] bg-[#0F0F13]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#F5EFE6]">
                          {flag.agency}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                            isRed
                              ? "bg-[#F87171]/20 text-[#F87171]"
                              : isWatch
                              ? "bg-[#FBBF24]/20 text-[#FBBF24]"
                              : "bg-[#4ADE80]/15 text-[#4ADE80]"
                          }`}
                        >
                          {flag.status}
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs font-semibold text-[#E8DEC8]">
                        {flag.title}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#C8BFA8]">
                        {flag.description}
                      </p>
                      <div className="mt-2 font-mono text-[11px] text-[#D4C5A9]">
                        Impact: {flag.investorImpact}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Granular News & Exchange Dispatches Feed (7 cols) */}
            <section className="rounded-2xl border border-[#24211D] bg-[#0B0B0E] p-5 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1D1A] pb-3.5">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-[#F5EFE6]" />
                  <div>
                    <h3 className="text-base font-semibold text-[#F5EFE6]">
                      All News, Exchange Filings & Small Sector Updates
                    </h3>
                    <p className="text-[11px] text-[#96876B]">
                      Live RSS + corporate dispatches for {quote.companyName}
                    </p>
                  </div>
                </div>

                {/* News Category Filter */}
                <div className="flex flex-wrap gap-1">
                  {[
                    "ALL",
                    "CAPEX / SUBSIDIARY",
                    "CON-CALL / EARNINGS",
                    "FII / DII / INSIDER",
                    "REGULATORY / ED / SEBI",
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewsFilter(cat)}
                      className={`rounded px-2 py-1 font-mono text-[10px] transition ${
                        newsFilter === cat
                          ? "bg-[#F5EFE6] text-[#060608] font-semibold"
                          : "bg-[#141418] text-[#96876B] hover:text-[#F5EFE6]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {filteredNews.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-[#22201C] bg-[#0F0F13] p-3.5 transition hover:border-[#6E624D]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#1E1D1A] px-2 py-0.5 text-[#D4C5A9]">
                          {item.category}
                        </span>
                        <span className="text-[#8E8474]">
                          {item.source} • {item.publishedAt}
                        </span>
                      </div>
                      <span
                        className={`font-semibold ${
                          item.sentiment === "BULLISH"
                            ? "text-[#4ADE80]"
                            : item.sentiment === "WARNING"
                            ? "text-[#FBBF24]"
                            : "text-[#D4C5A9]"
                        }`}
                      >
                        {item.sentiment}
                      </span>
                    </div>

                    <h4 className="mt-1.5 flex items-start justify-between gap-2 text-sm font-medium text-[#F5EFE6]">
                      <span>{item.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#8E8474]" />
                    </h4>
                    <p className="mt-1 text-xs text-[#C8BFA8]">{item.snippet}</p>
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* =====================================================================
          PORTFOLIO TRACKER MODAL (ADD / MANAGE HOLDINGS)
      ===================================================================== */}
      {portfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#2E2A24] bg-[#0B0B0E] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1D1A] pb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#F5EFE6]">
                  NSE & BSE Portfolio Tracker
                </h3>
                <p className="font-mono text-xs text-[#96876B]">
                  {supabaseLive
                    ? "Synced Live with Supabase PostgreSQL"
                    : "Local Storage Active (Connect Supabase anytime in Settings)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPortfolioModalOpen(false)}
                className="rounded-lg border border-[#24211D] p-1.5 text-[#96876B] hover:text-[#F5EFE6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Add / Update Current Stock Form */}
            <form
              onSubmit={handleSaveHolding}
              className="mt-4 rounded-xl border border-[#24211D] bg-[#101014] p-4"
            >
              <div className="mb-3 font-mono text-xs font-semibold uppercase text-[#D4C5A9]">
                Add / Update Position: {quote.companyName} ({quote.symbol})
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#8E8474]">
                    Quantity (Shares)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={holdingQty}
                    onChange={(e) => setHoldingQty(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-1.5 font-mono text-xs text-[#F5EFE6]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#8E8474]">
                    Avg Buy Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={holdingAvgPrice}
                    onChange={(e) => setHoldingAvgPrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-1.5 font-mono text-xs text-[#F5EFE6]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#8E8474]">
                    Target Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={holdingTarget}
                    onChange={(e) => setHoldingTarget(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-1.5 font-mono text-xs text-[#F5EFE6]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#8E8474]">
                    Stop Loss (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={holdingStopLoss}
                    onChange={(e) => setHoldingStopLoss(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-1.5 font-mono text-xs text-[#F5EFE6]"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <input
                  type="text"
                  value={holdingThesis}
                  onChange={(e) => setHoldingThesis(e.target.value)}
                  placeholder="Conviction note (e.g. Optical fiber subsidiary pivot + promoter buying)..."
                  className="flex-1 rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-1.5 text-xs text-[#F5EFE6] placeholder-[#6E624D]"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#F5EFE6] px-4 py-1.5 font-mono text-xs font-semibold text-[#060608] hover:bg-[#E8DEC8]"
                >
                  Save to Portfolio
                </button>
              </div>
            </form>

            {/* Current Portfolio Holdings Table */}
            <div className="mt-5 space-y-2.5">
              {portfolio.map((item) => {
                const ltp =
                  item.symbol === quote.symbol
                    ? quote.price
                    : Number((item.avgBuyPrice * 1.08).toFixed(2));
                const invested = item.quantity * item.avgBuyPrice;
                const curVal = item.quantity * ltp;
                const pnl = curVal - invested;
                const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#22201C] bg-[#0F0F13] p-3.5"
                  >
                    <div
                      onClick={() => {
                        setPortfolioModalOpen(false);
                        loadStockIntelligence(item.symbol);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#F5EFE6]">
                          {item.ticker}
                        </span>
                        <span className="rounded bg-[#1E1D1A] px-1.5 py-0.5 font-mono text-[10px] text-[#D4C5A9]">
                          {item.exchange}
                        </span>
                        <span className="text-xs text-[#C8BFA8]">
                          {item.companyName}
                        </span>
                      </div>
                      {item.convictionThesis && (
                        <p className="mt-1 text-[11px] text-[#8E8474]">
                          {item.convictionThesis}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs">
                      <div>
                        <div className="text-[10px] text-[#8E8474]">
                          Qty × Avg
                        </div>
                        <div className="text-[#F5EFE6]">
                          {item.quantity} × ₹{item.avgBuyPrice}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8E8474]">P&L</div>
                        <div
                          className={`font-bold ${
                            pnl >= 0 ? "text-[#4ADE80]" : "text-[#F87171]"
                          }`}
                        >
                          {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(0)} (
                          {pnlPct.toFixed(1)}%)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHolding(item.symbol)}
                        className="text-[#8E8474] hover:text-[#F87171]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUPABASE & OPENROUTER (LUNA 6) CREDENTIALS DRAWER (PHASE 5 PLUG-IN)
      ===================================================================== */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#2E2A24] bg-[#0B0B0E] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1D1A] pb-4">
              <div>
                <h3 className="text-base font-semibold text-[#F5EFE6]">
                  Phase 5 Credentials: Supabase & OpenRouter (Luna 6)
                </h3>
                <p className="text-xs text-[#96876B]">
                  Paste your credentials here or in <code>.env.local</code>{" "}
                  whenever ready
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-[#24211D] p-1.5 text-[#96876B] hover:text-[#F5EFE6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-xs text-[#D4C5A9]">
                  NEXT_PUBLIC_SUPABASE_URL
                </label>
                <input
                  type="text"
                  value={config.supabaseUrl}
                  onChange={(e) =>
                    setConfig({ ...config, supabaseUrl: e.target.value })
                  }
                  placeholder="https://xyzcompany.supabase.co"
                  className="mt-1 w-full rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-2 font-mono text-xs text-[#F5EFE6]"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#D4C5A9]">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  value={config.supabaseAnonKey}
                  onChange={(e) =>
                    setConfig({ ...config, supabaseAnonKey: e.target.value })
                  }
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="mt-1 w-full rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-2 font-mono text-xs text-[#F5EFE6]"
                />
              </div>

              <div className="border-t border-[#1E1D1A] pt-3">
                <label className="block font-mono text-xs text-[#D4C5A9]">
                  OPENROUTER_API_KEY (OpenAI-Compatible Endpoint)
                </label>
                <input
                  type="password"
                  value={config.openRouterApiKey}
                  onChange={(e) =>
                    setConfig({ ...config, openRouterApiKey: e.target.value })
                  }
                  placeholder="sk-or-v1-..."
                  className="mt-1 w-full rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-2 font-mono text-xs text-[#F5EFE6]"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#D4C5A9]">
                  OPENROUTER_MODEL (Default: openrouter/luna-6)
                </label>
                <input
                  type="text"
                  value={config.openRouterModel}
                  onChange={(e) =>
                    setConfig({ ...config, openRouterModel: e.target.value })
                  }
                  placeholder="openrouter/luna-6"
                  className="mt-1 w-full rounded-lg border border-[#2E2A24] bg-[#09090B] px-3 py-2 font-mono text-xs text-[#F5EFE6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-lg border border-[#2E2A24] px-4 py-2 font-mono text-xs text-[#D4C5A9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#F5EFE6] px-4 py-2 font-mono text-xs font-semibold text-[#060608]"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
