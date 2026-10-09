import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STALKER TERMINAL — NSE & BSE Portfolio & Forensic Stock Intelligence",
  description:
    "Deep Fundamental, Technical (RSI, Fibonacci), Shareholding (FII/DII/HNI/Insider), Con-Call, Capex Bottleneck & Regulatory (ED/SEBI) Stock Intelligence for NSE & BSE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060608] text-[#F5EFE6] selection:bg-[#F5EFE6] selection:text-[#060608]">
        {children}
      </body>
    </html>
  );
}
