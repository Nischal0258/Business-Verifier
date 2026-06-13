import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "InternIQ — Discover Internships Beyond MNCs",
  description: "AI-powered internship discovery platform. Search any company — from Google to your local startup. Get trust scores, reviews, and opportunities in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}