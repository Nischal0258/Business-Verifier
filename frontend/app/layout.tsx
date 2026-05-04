import type { Metadata } from "next";
import "./globals.css";
import CustomCursor from "@/components/layout/CustomCursor";

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
      <body className="antialiased">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
