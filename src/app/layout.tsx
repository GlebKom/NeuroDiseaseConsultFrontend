import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroDiseaseConsult",
  description: "Neurological disease consultation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}