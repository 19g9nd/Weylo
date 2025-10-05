import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import { CountriesProvider } from "./context/CountriesContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CategoriesProvider } from "./context/CategoriesContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Weylo",
  description: "Travel website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AdminProvider>
            <CountriesProvider>
              <CategoriesProvider>{children}</CategoriesProvider>
            </CountriesProvider>
            <Analytics />
            <SpeedInsights />
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
