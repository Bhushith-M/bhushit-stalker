import React from "react";
import StalkerDashboard from "@/components/StalkerDashboard";
import {
  fetchStockNewsFeed,
  fetchStockQuoteAndHistory,
} from "@/lib/market-api";
import { computeTechnicalAnalysis } from "@/lib/technicals";
import { generateHolisticAnalysisWithOpenRouter } from "@/lib/openrouter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const defaultSymbol = "WSTCSTPAPR.NS";
  const quote = await fetchStockQuoteAndHistory(defaultSymbol);
  const technicals = computeTechnicalAnalysis(
    quote.symbol,
    quote.price,
    quote.candles
  );
  const news = await fetchStockNewsFeed(quote.ticker, quote.companyName);
  const initialIntelligence = await generateHolisticAnalysisWithOpenRouter({
    quote,
    technicals,
    news,
  });

  return <StalkerDashboard initialIntelligence={initialIntelligence} />;
}
