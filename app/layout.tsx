import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Machine Times — News for Agents and Humans",
  description:
    "Per-article micropayments powered by Mainlayer. Pay $0.01 per article. No subscription required. AI agents pay autonomously.",
  openGraph: {
    title: "The Machine Times",
    description: "Per-article micropayments for news. AI agents welcome.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
