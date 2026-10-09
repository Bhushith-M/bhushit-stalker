import { NextRequest, NextResponse } from "next/server";
import {
  fetchStockNewsFeed,
  fetchStockQuoteAndHistory,
} from "@/lib/market-api";
import { computeTechnicalAnalysis } from "@/lib/technicals";
import { generateHolisticAnalysisWithOpenRouter } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symbol = String(body.symbol || "WSTCSTPAPR.NS");
    const openRouterApiKey = body.openRouterApiKey
      ? String(body.openRouterApiKey)
      : undefined;
    const openRouterModel = body.openRouterModel
      ? String(body.openRouterModel)
      : undefined;

    const quote = await fetchStockQuoteAndHistory(symbol);
    const technicals = computeTechnicalAnalysis(
      quote.symbol,
      quote.price,
      quote.candles
    );
    const news = await fetchStockNewsFeed(quote.ticker, quote.companyName);

    const intelligence = await generateHolisticAnalysisWithOpenRouter({
      quote,
      technicals,
      news,
      apiKey: openRouterApiKey,
      model: openRouterModel,
    });

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error("Error in /api/stocks/analyze:", error);
    return NextResponse.json(
      { error: "Failed to analyze stock" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "WSTCSTPAPR.NS";
  const quote = await fetchStockQuoteAndHistory(symbol);
  const technicals = computeTechnicalAnalysis(
    quote.symbol,
    quote.price,
    quote.candles
  );
  const news = await fetchStockNewsFeed(quote.ticker, quote.companyName);
  const intelligence = await generateHolisticAnalysisWithOpenRouter({
    quote,
    technicals,
    news,
  });
  return NextResponse.json(intelligence);
}
