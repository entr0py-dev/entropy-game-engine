import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./ClientProviders";
// REMOVED: import Sidebar from "@/components/Sidebar"; <--- We will move this to page.tsx

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Entropy Game Engine",
  description: "OS Backend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Set background to transparent to allow Framer to show through */}
      <body className={inter.className} style={{ background: 'transparent' }}>
        <ClientProviders>
          {/* Sidebar is removed from here so we can hide it in Embed Mode */}
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}