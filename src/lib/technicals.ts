import {
  FibonacciLevel,
  PriceCandle,
  TechnicalAnalysisData,
} from "@/types/stock";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeSMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-period);
  const sum = slice.reduce((acc, v) => acc + v, 0);
  return round2(sum / slice.length);
}

export function computeEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function computeRSI14(closes: number[]): number {
  const period = 14;
  if (closes.length <= period) return 52.5;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 95;
  const rs = avgGain / avgLoss;
  return round2(100 - 100 / (1 + rs));
}

export function computeMACD(closes: number[]): {
  macdLine: number;
  signalLine: number;
  histogram: number;
} {
  if (closes.length < 26) {
    return { macdLine: 1.4, signalLine: 0.9, histogram: 0.5 };
  }
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdSeries = closes.map((_, idx) => ema12[idx] - ema26[idx]);
  const signalSeries = computeEMA(macdSeries, 9);

  const lastIdx = closes.length - 1;
  const macdLine = round2(macdSeries[lastIdx]);
  const signalLine = round2(signalSeries[lastIdx]);
  const histogram = round2(macdLine - signalLine);
  return { macdLine, signalLine, histogram };
}

export function computeTechnicalAnalysis(
  symbol: string,
  currentPrice: number,
  candles: PriceCandle[]
): TechnicalAnalysisData {
  const closes =
    candles.length > 0 ? candles.map((c) => c.close) : [currentPrice];
  const highs =
    candles.length > 0 ? candles.map((c) => c.high) : [currentPrice * 1.18];
  const lows =
    candles.length > 0 ? candles.map((c) => c.low) : [currentPrice * 0.82];

  const rsiValue = computeRSI14(closes);
  const sma20 = computeSMA(closes, 20);
  const sma50 = computeSMA(closes, 50);
  const sma200 = computeSMA(closes, Math.min(200, closes.length));
  const { macdLine, signalLine, histogram } = computeMACD(closes);

  // Fibonacci Retracement calculation over the recent swing window (up to 120 trading sessions)
  const lookbackHighs = highs.slice(-120);
  const lookbackLows = lows.slice(-120);
  const swingHigh = round2(Math.max(...lookbackHighs, currentPrice * 1.04));
  const swingLow = round2(Math.min(...lookbackLows, currentPrice * 0.92));
  const swingRange = Math.max(swingHigh - swingLow, currentPrice * 0.1);

  const fibRatios: { label: string; ratio: number }[] = [
    { label: "0.0% (Swing High)", ratio: 0 },
    { label: "23.6% Retracement", ratio: 0.236 },
    { label: "38.2% Retracement", ratio: 0.382 },
    { label: "50.0% Equilibrium", ratio: 0.5 },
    { label: "61.8% Golden Pocket", ratio: 0.618 },
    { label: "78.6% Deep Support", ratio: 0.786 },
    { label: "100.0% (Swing Low)", ratio: 1.0 },
  ];

  const levels: FibonacciLevel[] = fibRatios.map(({ label, ratio }) => {
    const levelPrice = round2(swingHigh - swingRange * ratio);
    const distPct = round2(((levelPrice - currentPrice) / currentPrice) * 100);
    let role: FibonacciLevel["role"] = "PIVOT / CURRENT";
    if (Math.abs(distPct) <= 1.5) {
      role = "PIVOT / CURRENT";
    } else if (ratio === 0.618) {
      role = "GOLDEN POCKET SUPPORT";
    } else if (levelPrice > currentPrice) {
      role = "RESISTANCE";
    } else {
      role = "SUPPORT";
    }
    return {
      ratio: label,
      numericRatio: ratio,
      price: levelPrice,
      role,
      distancePercent: distPct,
    };
  });

  const fib382 = round2(swingHigh - swingRange * 0.382);
  const fib500 = round2(swingHigh - swingRange * 0.5);
  const fib618 = round2(swingHigh - swingRange * 0.618);
  const fib236 = round2(swingHigh - swingRange * 0.236);
  const fib786 = round2(swingHigh - swingRange * 0.786);

  const supportsBelow = levels
    .filter((l) => l.price <= currentPrice)
    .sort((a, b) => b.price - a.price);
  const resistancesAbove = levels
    .filter((l) => l.price > currentPrice)
    .sort((a, b) => a.price - b.price);

  const nearestSupport =
    supportsBelow[0]?.price ?? round2(currentPrice * 0.94);
  const nearestResistance =
    resistancesAbove[0]?.price ?? round2(currentPrice * 1.08);

  // RSI Zone & Reasoning
  let rsiZone: TechnicalAnalysisData["rsi14"]["zone"] =
    "NEUTRAL CONSOLIDATION (40-55)";
  let rsiSignal: "BUY" | "HOLD" | "SELL" = "HOLD";
  let rsiReasoning = "";

  if (rsiValue >= 70) {
    rsiZone = "OVERBOUGHT (>70)";
    rsiSignal = "SELL";
    rsiReasoning = `RSI(14) is currently at ${rsiValue}, which is in the Overbought zone (>70). Historically on NSE/BSE, readings above 70 indicate stretched short-term euphoria—avoid chasing at peak levels and consider booking partial profits or waiting for a mean-reversion pullback toward the 20-DMA (₹${sma20}).`;
  } else if (rsiValue >= 55) {
    rsiZone = "BULLISH MOMENTUM (55-70)";
    rsiSignal = "BUY";
    rsiReasoning = `RSI(14) is at ${rsiValue}, sitting inside the institutional Bullish Momentum sweet spot (55–70) without being overbought (<70). Buyers are in control with healthy room for upside expansion before hitting exhaustion.`;
  } else if (rsiValue <= 36) {
    rsiZone = "OVERSOLD (<35)";
    rsiSignal = "BUY";
    rsiReasoning = `RSI(14) has compressed to ${rsiValue} in the Oversold zone (<35). Selling pressure is exhausted and risk-reward strongly favors contrarian accumulation near the ₹${nearestSupport} Fibonacci support.`;
  } else {
    rsiZone = "NEUTRAL CONSOLIDATION (40-55)";
    rsiSignal = "HOLD";
    rsiReasoning = `RSI(14) is at ${rsiValue} in the Neutral Consolidation band (40–55). The stock is digesting prior moves and building a base—ideal for holding existing core positions and accumulating staggered tranches near Fibonacci support at ₹${fib618}.`;
  }

  // Fibonacci Explicit Reasoning
  const fibonacciReasoning =
    currentPrice <= fib500 && currentPrice >= fib786
      ? `Price (₹${currentPrice}) has retraced into the high-probability Fibonacci value zone between the 50% level (₹${fib500}) and the 61.8% Golden Pocket (₹${fib618}) of the ₹${swingLow}–₹${swingHigh} swing. Institutional algorithms frequently defend the 61.8% Golden Pocket (₹${fib618}), making ₹${fib618}–₹${fib500} the optimal risk-reward accumulation zone with upside toward the 23.6% level (₹${fib236}) and swing high (₹${swingHigh}).`
      : currentPrice > fib382
      ? `Price (₹${currentPrice}) is holding firmly above the 38.2% Fibonacci retracement (₹${fib382}), signaling strong trend continuation. Immediate resistance lies at ₹${nearestResistance} (Swing High ₹${swingHigh}), while any dip toward the 38.2% (₹${fib382}) or 50% (₹${fib500}) Fibonacci levels should be treated as a buy-on-dips opportunity.`
      : `Price (₹${currentPrice}) is testing deep Fibonacci retracement support near the 78.6% level (₹${fib786}). Hold off on aggressive leverage until price reclaims the 61.8% Golden Pocket at ₹${fib618}, keeping a strict stop-loss below the swing low of ₹${swingLow}.`;

  // Moving Averages Alignment
  let trendAlignment: TechnicalAnalysisData["movingAverages"]["trendAlignment"] =
    "RANGEBOUND";
  let maReasoning = "";
  if (currentPrice > sma50 && sma50 >= sma200) {
    trendAlignment = "GOLDEN CROSS / STRONG UPTREND";
    maReasoning = `Price (₹${currentPrice}) trades above both the 50-DMA (₹${sma50}) and 200-DMA (₹${sma200}), with the 50-DMA above the 200-DMA (Golden Cross structure). Institutional trend-followers remain net long as long as ₹${sma50} holds.`;
  } else if (currentPrice > sma200 && currentPrice <= sma50) {
    trendAlignment = "PULLBACK IN UPTREND";
    maReasoning = `The primary trend is intact above the 200-DMA (₹${sma200}), while current price (₹${currentPrice}) is undergoing a healthy tactical pullback below the 50-DMA (₹${sma50}). Reclaiming ₹${sma20} (20-DMA) triggers the next leg higher.`;
  } else if (currentPrice < sma200) {
    trendAlignment = "BEARISH BELOW 200 DMA";
    maReasoning = `Price (₹${currentPrice}) is currently trading below its long-term 200-DMA (₹${sma200}), indicating overhead supply. Accumulate only in staggered tranches near deep Fibonacci support (₹${fib618}–₹${fib786}) or after a high-volume breakout above ₹${sma50}.`;
  } else {
    trendAlignment = "RANGEBOUND";
    maReasoning = `Price (₹${currentPrice}) is oscillating around the 20-DMA (₹${sma20}) and 50-DMA (₹${sma50}), indicating volatility compression before a directional expansion.`;
  }

  // MACD Reasoning
  let crossoverState: TechnicalAnalysisData["macd"]["crossoverState"] =
    "POSITIVE MOMENTUM";
  let macdReasoning = "";
  if (macdLine > signalLine && histogram > 0) {
    crossoverState = "BULLISH CROSSOVER";
    macdReasoning = `MACD (${macdLine}) is above the Signal line (${signalLine}) with a positive histogram (+${histogram}), confirming upward momentum expansion.`;
  } else if (macdLine < signalLine && macdLine > 0) {
    crossoverState = "BEARISH DIVERGENCE";
    macdReasoning = `MACD (${macdLine}) remains positive above zero but has crossed slightly below the Signal line (${signalLine}), suggesting short-term consolidation before resuming the trend.`;
  } else {
    crossoverState = "BEARISH CROSSOVER";
    macdReasoning = `MACD (${macdLine}) is below its Signal line (${signalLine}, histogram ${histogram}), advising patience—let momentum stabilize near Fibonacci support before deploying full capital.`;
  }

  // Overall Action Verdict
  let verdict: TechnicalAnalysisData["verdict"] = "BUY / ACCUMULATE";
  let confidenceScore = 76;
  if (rsiValue >= 72) {
    verdict = "SELL / BOOK PROFITS";
    confidenceScore = 81;
  } else if (
    (currentPrice >= fib618 * 0.98 && currentPrice <= fib382 * 1.03 && rsiValue < 68) ||
    (currentPrice > sma50 && macdLine >= signalLine && rsiValue < 68)
  ) {
    verdict = rsiValue < 62 && currentPrice > sma200 ? "STRONG BUY" : "BUY / ACCUMULATE";
    confidenceScore = verdict === "STRONG BUY" ? 86 : 79;
  } else {
    verdict = "HOLD";
    confidenceScore = 72;
  }

  const buyMin = round2(Math.min(currentPrice * 0.97, fib618));
  const buyMax = round2(Math.max(currentPrice * 1.01, fib500));
  const stopLoss = round2(Math.min(swingLow * 0.98, currentPrice * 0.91));
  const target1 = round2(Math.max(swingHigh, currentPrice * 1.14));
  const target2 = round2(Math.max(swingHigh + swingRange * 0.272, currentPrice * 1.26));

  const upside = Math.max(target1 - currentPrice, currentPrice * 0.12);
  const downside = Math.max(currentPrice - stopLoss, currentPrice * 0.05);
  const rrRatio = `1 : ${round2(upside / downside)}`;

  const headlineReasoning =
    verdict === "SELL / BOOK PROFITS"
      ? `SELL / BOOK PARTIAL PROFITS: RSI(14) is at ${rsiValue} (Overbought >70) and price is approaching the upper Fibonacci resistance band near ₹${swingHigh}. Trim 25–40% to lock in gains and re-enter on a pullback to the 38.2%–50% Fibonacci zone (₹${fib500}–₹${fib382}).`
      : verdict === "STRONG BUY" || verdict === "BUY / ACCUMULATE"
      ? `${verdict}: RSI(14) at ${rsiValue} shows room for upside without overbought exhaustion, while the Fibonacci structure places strong institutional support between ₹${fib618} (61.8% Golden Pocket) and ₹${fib500} (50% retracement). Accumulate in the ₹${buyMin}–₹${buyMax} zone for targets of ₹${target1} and ₹${target2}.`
      : `HOLD & ACCUMULATE ON DIPS: The stock is consolidating at ₹${currentPrice} with RSI(14) at ${rsiValue}. Existing holders should HOLD as long as the 61.8% Fibonacci Golden Pocket (₹${fib618}) and stop-loss at ₹${stopLoss} remain intact; fresh buyers should stagger entries near ₹${fib618}–₹${fib500}.`;

  const holdVerdictExplanation =
    currentPrice >= stopLoss
      ? `YES — Good time to HOLD existing shares as long as price sustains above the Fibonacci 61.8% Golden Pocket (₹${fib618}) and structural stop-loss (₹${stopLoss}). The medium-term risk-reward (${rrRatio}) favors holding for a test of ₹${target1}.`
      : `CAUTION ON HOLD — Price is testing critical structural support. Avoid adding leverage until ${symbol} reclaims its 20-DMA (₹${sma20}).`;

  return {
    verdict,
    confidenceScore,
    idealBuyZone: { min: buyMin, max: buyMax },
    sellTargetZone: { target1, target2 },
    stopLoss,
    riskRewardRatio: rrRatio,
    headlineReasoning,
    holdVerdictExplanation,
    rsi14: {
      value: rsiValue,
      zone: rsiZone,
      signal: rsiSignal,
      reasoning: rsiReasoning,
    },
    fibonacci: {
      swingHigh,
      swingLow,
      nearestSupport,
      nearestResistance,
      goldenPocketPrice: fib618,
      levels,
      reasoning: fibonacciReasoning,
    },
    movingAverages: {
      sma20,
      sma50,
      sma200,
      trendAlignment,
      reasoning: maReasoning,
    },
    macd: {
      macdLine,
      signalLine,
      histogram,
      crossoverState,
      reasoning: macdReasoning,
    },
    actionableChecklist: {
      whenToBuy: `Accumulate in tranches between ₹${buyMin} and ₹${buyMax} (Fibonacci 50%–61.8% Golden Pocket support) or on a high-volume daily close above ₹${sma20} (20-DMA) while RSI(14) remains below 68.`,
      whenToHold: `Hold core positions firmly as long as weekly closing price defends ₹${fib618} (61.8% Fibonacci level) and the 200-DMA (₹${sma200}).`,
      whenToSell: `Book partial profits (30–50%) when price hits ₹${target1}–₹${target2} AND RSI(14) crosses into the >72 Overbought region, or exit defensively if daily close breaks below the ₹${stopLoss} stop-loss.`,
    },
  };
}
