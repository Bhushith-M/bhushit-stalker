import { NextRequest, NextResponse } from "next/server";
import { searchIndianStocks } from "@/lib/market-api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const results = await searchIndianStocks(query);
  return NextResponse.json({ results });
}
