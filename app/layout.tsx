import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmogAssistant - Urban Air Quality Copilot",
  description: "Generative AI-powered assistant for winter smog navigation, proactive morning briefings, personalized low-emission routines, and indoor air mitigation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body 
        className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
