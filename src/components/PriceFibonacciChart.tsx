"use client";

import React, { useState } from "react";
import { FibonacciLevel, PriceCandle } from "@/types/stock";

interface PriceFibonacciChartProps {
  symbol: string;
  currentPrice: number;
  candles: PriceCandle[];
  fibonacciLevels: FibonacciLevel[];
  idealBuyZone: { min: number; max: number };
  stopLoss: number;
}

export default function PriceFibonacciChart({
  symbol,
  currentPrice,
  candles,
  fibonacciLevels,
  idealBuyZone,
  stopLoss,
}: PriceFibonacciChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showFibOverlay, setShowFibOverlay] = useState<boolean>(true);

  const recentCandles = candles.slice(-90);
  if (recentCandles.length === 0) {
    return null;
  }

  const width = 860;
  const height = 310;
  const padLeft = 16;
  const padRight = 135;
  const padTop = 22;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allPrices = [
    ...recentCandles.map((c) => c.high),
    ...recentCandles.map((c) => c.low),
    ...fibonacciLevels.map((f) => f.price),
    stopLoss,
  ];
  const minPrice = Math.min(...allPrices) * 0.985;
  const maxPrice = Math.max(...allPrices) * 1.015;
  const priceSpan = Math.max(maxPrice - minPrice, 1);

  const toX = (i: number) =>
    padLeft + (i / Math.max(recentCandles.length - 1, 1)) * plotW;
  const toY = (p: number) =>
    padTop + ((maxPrice - p) / priceSpan) * plotH;

  const linePoints = recentCandles
    .map((c, i) => `${toX(i).toFixed(1)},${toY(c.close).toFixed(1)}`)
    .join(" ");

  const areaPoints = `${toX(0).toFixed(1)},${(padTop + plotH).toFixed(
    1
  )} ${linePoints} ${toX(recentCandles.length - 1).toFixed(1)},${(
    padTop + plotH
  ).toFixed(1)}`;

  const activeCandle =
    hoverIdx !== null && recentCandles[hoverIdx]
      ? recentCandles[hoverIdx]
      : recentCandles[recentCandles.length - 1];

  const buyZoneTopY = toY(idealBuyZone.max);
  const buyZoneBottomY = toY(idealBuyZone.min);

  return (
    <div className="rounded-xl border border-[#24211D] bg-[#0B0B0E] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#96876B]">
            {symbol} • 90-Session Price & Fibonacci Structure
          </span>
          <span className="rounded border border-[#2A2722] bg-[#141418] px-2 py-0.5 font-mono text-xs text-[#F5EFE6]">
            {activeCandle.date} • O: ₹{activeCandle.open} H: ₹{activeCandle.high}{" "}
            L: ₹{activeCandle.low} C: ₹{activeCandle.close}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowFibOverlay((prev) => !prev)}
          className={`rounded-md border px-2.5 py-1 text-xs font-mono transition ${
            showFibOverlay
              ? "border-[#D4C5A9] bg-[#F5EFE6] text-[#060608] font-medium"
              : "border-[#2A2722] bg-[#131317] text-[#D4C5A9]"
          }`}
        >
          {showFibOverlay ? "Fibonacci Retracements: ON" : "Show Fibonacci"}
        </button>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="creamAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5EFE6" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#D4C5A9" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#060608" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Ideal Buy Zone Shaded Band */}
          <rect
            x={padLeft}
            y={Math.min(buyZoneTopY, buyZoneBottomY)}
            width={plotW}
            height={Math.max(Math.abs(buyZoneBottomY - buyZoneTopY), 6)}
            fill="#4ADE80"
            fillOpacity="0.07"
          />

          {/* Fibonacci Retracement Horizontal Lines */}
          {showFibOverlay &&
            fibonacciLevels.map((fib) => {
              const y = toY(fib.price);
              const isGolden = fib.numericRatio === 0.618;
              const isHalf = fib.numericRatio === 0.5;
              const strokeColor = isGolden
                ? "#F5EFE6"
                : isHalf
                ? "#4ADE80"
                : "#3A352D";
              return (
                <g key={fib.ratio}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + plotW}
                    y2={y}
                    stroke={strokeColor}
                    strokeWidth={isGolden ? 1.4 : 0.9}
                    strokeDasharray={isGolden ? "4 2" : "3 3"}
                  />
                  <text
                    x={padLeft + plotW + 6}
                    y={y + 3}
                    fill={isGolden ? "#F5EFE6" : "#96876B"}
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {fib.ratio.split(" ")[0]} ₹{fib.price}
                  </text>
                </g>
              );
            })}

          {/* Stop Loss Line */}
          <line
            x1={padLeft}
            y1={toY(stopLoss)}
            x2={padLeft + plotW}
            y2={toY(stopLoss)}
            stroke="#F87171"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <text
            x={padLeft + 6}
            y={toY(stopLoss) - 4}
            fill="#F87171"
            fontSize="9"
            fontFamily="monospace"
          >
            STOP LOSS ₹{stopLoss}
          </text>

          {/* Price Area & Line */}
          <polygon points={areaPoints} fill="url(#creamAreaGrad)" />
          <polyline
            fill="none"
            stroke="#F5EFE6"
            strokeWidth="2"
            points={linePoints}
          />

          {/* Current Price Dot */}
          <circle
            cx={toX(recentCandles.length - 1)}
            cy={toY(currentPrice)}
            r="4"
            fill="#F5EFE6"
            stroke="#060608"
            strokeWidth="1.5"
          />

          {/* Hover Crosshair */}
          {hoverIdx !== null && recentCandles[hoverIdx] && (
            <g>
              <line
                x1={toX(hoverIdx)}
                y1={padTop}
                x2={toX(hoverIdx)}
                y2={padTop + plotH}
                stroke="#D4C5A9"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={toX(hoverIdx)}
                cy={toY(recentCandles[hoverIdx].close)}
                r="4.5"
                fill="#F5EFE6"
              />
            </g>
          )}

          {/* Invisible Hover Columns */}
          {recentCandles.map((c, i) => {
            const colW = plotW / recentCandles.length;
            return (
              <rect
                key={c.date + i}
                x={toX(i) - colW / 2}
                y={padTop}
                width={colW}
                height={plotH}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIdx(i)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
