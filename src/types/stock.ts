export type ExchangeType = "NSE" | "BSE";

export interface StockSearchResult {
  symbol: string;       // e.g. "WSTCSTPAPR.NS" or "WSTCSTPAPR.BO"
  ticker: string;       // e.g. "WSTCSTPAPR"
  exchange: ExchangeType;
  companyName: string;
  industry: string;
  category: string;
  isManufacturing: boolean;
}

export interface PriceCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  ticker: string;
  exchange: ExchangeType;
  companyName: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  avgVolume: number;
  marketCapCr: number;
  peRatio: number | null;
  pbRatio: number | null;
  roePercent: number | null;
  rocePercent: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  bookValue: number | null;
  currency: string;
  lastUpdated: string;
  candles: PriceCandle[];
}

export interface InstitutionalHolder {
  name: string;
  category: "DII" | "FII" | "HNI" | "PROMOTER";
  stakePercent: number;
  changeQoQ: number; // e.g. +0.45 or -0.12
  action: "ACCUMULATED" | "FRESH ENTRY" | "HELD" | "TRIMMED";
  rationale: string;
}

export interface InsiderTransaction {
  date: string;
  personName: string;
  designation: "Promoter Group" | "CEO / MD" | "Executive Director" | "Key Managerial Personnel" | "Marquee HNI";
  mode: "Open Market Purchase" | "Creeping Acquisition" | "Preferential Allotment" | "Block Deal Buy" | "Open Market Sale";
  sharesQuantity: number;
  avgPrice: number;
  valueCr: number;
  signal: "BULLISH SKIN-IN-THE-GAME" | "NEUTRAL" | "CAUTION";
}

export interface ShareholdingData {
  promoterPercent: number;
  promoterPledgePercent: number;
  fiiPercent: number;
  diiPercent: number;
  publicAndHniPercent: number;
  promoterChangeQoQ: number;
  fiiChangeQoQ: number;
  diiChangeQoQ: number;
  summaryVerdict: string;
  notableBuyers: InstitutionalHolder[];
  insiderTransactions: InsiderTransaction[];
}

export interface FibonacciLevel {
  ratio: string;        // "0.0%", "23.6%", "38.2%", "50.0%", "61.8% (Golden Pocket)", "78.6%", "100.0%"
  numericRatio: number; // 0, 0.236, 0.382, 0.5, 0.618, 0.786, 1
  price: number;
  role: "RESISTANCE" | "PIVOT / CURRENT" | "SUPPORT" | "GOLDEN POCKET SUPPORT";
  distancePercent: number;
}

export interface TechnicalAnalysisData {
  verdict: "STRONG BUY" | "BUY / ACCUMULATE" | "HOLD" | "SELL / BOOK PROFITS";
  confidenceScore: number; // 0 - 100
  idealBuyZone: { min: number; max: number };
  sellTargetZone: { target1: number; target2: number };
  stopLoss: number;
  riskRewardRatio: string;
  headlineReasoning: string;
  holdVerdictExplanation: string;

  rsi14: {
    value: number;
    zone: "OVERBOUGHT (>70)" | "BULLISH MOMENTUM (55-70)" | "NEUTRAL CONSOLIDATION (40-55)" | "OVERSOLD (<35)";
    signal: "BUY" | "HOLD" | "SELL";
    reasoning: string;
  };

  fibonacci: {
    swingHigh: number;
    swingLow: number;
    nearestSupport: number;
    nearestResistance: number;
    goldenPocketPrice: number;
    levels: FibonacciLevel[];
    reasoning: string;
  };

  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    trendAlignment: "GOLDEN CROSS / STRONG UPTREND" | "PULLBACK IN UPTREND" | "RANGEBOUND" | "BEARISH BELOW 200 DMA";
    reasoning: string;
  };

  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossoverState: "BULLISH CROSSOVER" | "POSITIVE MOMENTUM" | "BEARISH DIVERGENCE" | "BEARISH CROSSOVER";
    reasoning: string;
  };

  actionableChecklist: {
    whenToBuy: string;
    whenToHold: string;
    whenToSell: string;
  };
}

export interface IndustryBoomData {
  primaryIndustry: string;
  operatingCategory: string;
  valueChainPosition: string;
  boomStatus: "BOOMING NOW" | "INFLECTING SOON (3-6 MONTHS)" | "MULTI-YEAR STRUCTURAL BOOM (1-5 YRS)" | "CYCLICAL / MATURE";
  boomScore: number; // 0-100
  shortTermOutlook: {
    horizon: "Next 3–6 Months";
    trajectory: "ACCELERATING" | "STEADY" | "HEADWINDS";
    reasoning: string;
  };
  mediumTermOutlook: {
    horizon: "Next 1–3 Years";
    trajectory: "HIGH GROWTH BOOM" | "MODERATE EXPANSION" | "CYCLICAL";
    reasoning: string;
  };
  longTermOutlook: {
    horizon: "Next 3–5+ Years";
    trajectory: "MEGA-TREND WINNER" | "COMPOUNDER" | "TRANSITION NEEDED";
    reasoning: string;
  };
  boomDrivers: {
    title: string;
    category: "POLICY / PLI" | "DEMAND SURGE" | "EXPORT / CHINA+1" | "SUBSIDIARY PIVOT";
    explanation: string;
  }[];
}

export interface ConcallMeetingNote {
  sourceType: "Q-o-Q Con-Call (Phone Call)" | "Investor Presentation" | "AGM / Board Meeting" | "CEO / MD Interview";
  dateOrQuarter: string;
  speaker: string;
  sentiment: "HIGHLY OPTIMISTIC" | "CONSTRUCTIVE" | "CAUTIOUS";
  keyTakeaway: string;
  verbatimOrParaphrasedInsight: string;
}

export interface FundamentalConcallData {
  managementOptimismScore: number; // 0-100
  managementTone: "HIGHLY OPTIMISTIC & BUYING" | "CONSTRUCTIVE EXECUTION" | "CAUTIOUS / CONSERVATIVE";
  fundamentalBuyThesis: string;
  skinInTheGameCorrelation: string; // How CEO/Director talk aligns with insider buying
  concallsAndMeetings: ConcallMeetingNote[];
  valuationAssessment: string;
}

export interface CapexSubsidiaryData {
  isManufacturingOrIndustrial: boolean;
  capitalFormationSummary: string;
  grossBlockTrend: string;
  cwipStatus: string; // Capital Work in Progress
  capacityUtilizationPercent: number;

  subsidiaryDiversification: {
    hasDivergedIntoNewSector: boolean;
    subsidiaryOrDivisionName: string;
    coreLegacyBusiness: string;
    newBoomingSector: string;
    strategicVerdict: string;
    growthWhy: string;
  };

  capexVsOrderBookBottleneck: {
    bottleneckRiskLevel: "HIGH EXECUTION DELAY RISK" | "MODERATE CAPACITY WATCH" | "SUFFICIENT CAPACITY";
    currentCapexIntensity: string;
    orderBookPressure: string;
    bottleneckAnalysis: string;
    revenueDelayWarning: string;
  };
}

export interface RegulatoryFlag {
  id: string;
  agency: "ED (Enforcement Directorate)" | "SEBI" | "NGT / Pollution Control" | "Income Tax / GST" | "Anti-Dumping / Customs" | "Auditor / Governance";
  status: "CLEAN / NO ACTIVE PROBE" | "MONITOR / INDUSTRY OVERHANG" | "ACTIVE NOTICE / RED FLAG";
  title: string;
  description: string;
  investorImpact: string;
}

export interface StockNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  category: "CON-CALL / EARNINGS" | "CAPEX / SUBSIDIARY" | "FII / DII / INSIDER" | "REGULATORY / ED / SEBI" | "MARKET / SMALL NEWS";
  sentiment: "BULLISH" | "NEUTRAL" | "WARNING";
  snippet: string;
}

export interface HolisticStockIntelligence {
  symbol: string;
  ticker: string;
  exchange: ExchangeType;
  companyName: string;
  analyzedAt: string;
  modelUsed: string;
  isLiveAI: boolean;
  quote: StockQuote;
  shareholding: ShareholdingData;
  technicals: TechnicalAnalysisData;
  industryBoom: IndustryBoomData;
  fundamentalsAndConcalls: FundamentalConcallData;
  capexAndSubsidiary: CapexSubsidiaryData;
  regulatoryFlags: RegulatoryFlag[];
  news: StockNewsItem[];
  holisticExecutiveSummary: string;
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  ticker: string;
  exchange: ExchangeType;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  convictionThesis?: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  ticker: string;
  exchange: ExchangeType;
  companyName: string;
  industry: string;
}
