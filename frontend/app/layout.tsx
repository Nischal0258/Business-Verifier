import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import AdvancedCursor from "@/components/layout/AdvancedCursor";

export const metadata: Metadata = {
  title: "VerifyIQ — Business Verification & Analytics",
  description: "Verify any business in seconds. Used by investors, banks, and procurement teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased cursor-container">
        <Providers>
          <AdvancedCursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}