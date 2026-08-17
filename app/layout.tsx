import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Agent-Ready 100 | Composio Product Ops Study",
  description: "An evidence-backed integration readiness map across 100 requested apps.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
