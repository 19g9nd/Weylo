import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import { CountriesProvider } from "./context/CountriesContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CategoriesProvider } from "./context/CategoriesContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthProvider>
          <AdminProvider>
            <CountriesProvider>
              <CategoriesProvider>
                <ProtectedRoute>{children}</ProtectedRoute>
              </CategoriesProvider>
            </CountriesProvider>
            <Analytics />
            <SpeedInsights />
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
