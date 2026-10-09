# Bhushit The Stalker — NSE & BSE Portfolio & Forensic Stock Intelligence

An institutional-grade Indian equity (**NSE** & **BSE**) portfolio tracker and holistic fundamental, technical, capex-bottleneck, and regulatory intelligence platform built with **Next.js (App Router)**, **Public Market & News APIs**, **OpenRouter (OpenAI SDK / Luna 6)**, and **Supabase**, styled in a **Minimal Cream on Obsidian Black** theme.

---

## Core Capabilities Built Across Phases 1–4

1. **Universal NSE & BSE Search + Pinned Top Ribbon ("Up Here")**:
   - Search any Indian stock on NSE (`.NS`) or BSE (`.BO`) and pin it to the top ribbon or add it to your portfolio with live P&L tracking.
2. **Who Bought It (Shareholding, FIIs, DIIs, Marquee HNIs & Insiders)**:
   - Tracks Promoter %, Promoter Pledge %, FII/FPI %, DII (Mutual Funds/LIC) %, and Public/HNI stakes, along with named institutional buyers and Promoter/CEO/Director open-market SAST purchases.
3. **Deep Quantitative Technical Analysis (When to Buy, Sell, Hold + Why)**:
   - Computes real **14-Period Wilder's RSI**, **Fibonacci Retracements** (`0%`, `23.6%`, `38.2%`, `50%`, `61.8% Golden Pocket`, `78.6%`, `100%`), **Moving Averages** (`20/50/200 DMA`), and **MACD (12, 26, 9)** with explicit indicator-backed reasoning.
4. **Industry, Category & Boom Horizon Analysis**:
   - Evaluates Short-Term (3–6 months), Medium-Term (1–3 years), and Long-Term (3–5+ years) boom trajectories and macro/policy catalysts (PLI, BharatNet, Make in India).
5. **Manufacturing Capex, Capital Formation & Subsidiary Bottleneck Audit**:
   - Inspects Gross Block, CWIP (Capital Work in Progress), and Subsidiary pivots into booming sectors (e.g., **West Coast Paper Mills (`WSTCSTPAPR.NS`)** diverging into **Optical Fiber Cable (OFC)** via West Coast Optilinks).
   - **Capex vs. Order Book Bottleneck Check**: Flags when a company has not front-loaded enough Capex to fulfill a surge in incoming orders, warning of delivery delays and potential revenue leakage from the sales book.
6. **Con-Calls, Investor Presentations, AGM & Board Room Sentiment**:
   - Synthesizes quarterly phone calls (con-calls), corporate presentations, and AGM notes, correlating management optimism with insider share purchases.
7. **Regulatory, ED, SEBI & Compliance Red-Flag Scanner + Live News Wire**:
   - Monitors Enforcement Directorate (ED), SEBI, NGT / Pollution Control Board, Anti-Dumping, and corporate governance alerts alongside a live categorized news feed.

---

## Quick Start

1. **Install Node.js (v18+ / v20+) & Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables (`.env.local`)** *(or paste directly inside the in-app "Supabase & Luna 6" Settings modal)*:
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `OPENROUTER_MODEL`: `openrouter/luna-6` (or any OpenRouter model ID)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key

3. **Initialize Supabase Tables (Phase 5)**:
   - Open your Supabase Dashboard → **SQL Editor** and run [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql).

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.
