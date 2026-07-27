import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CityMediaExperience from "./components/CityMediaExperience";
import OperationsEnhancer from "./components/OperationsEnhancer";
import VisualAtmosphere from "./components/VisualAtmosphere";
import "./globals.css";
import "./operations.css";
import "./visual-v4.css";
import "./media-v5.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://civiclens-ai.mdomor01815.workers.dev"),
  title: {
    default: "CivicLens AI — Urban Hazard Intelligence",
    template: "%s | CivicLens AI",
  },
  description:
    "Explainable urban hazard detection, citizen reporting and geospatial intelligence for safer streets.",
  applicationName: "CivicLens AI",
  keywords: [
    "urban hazard detection",
    "computer vision",
    "pothole detection",
    "civic reporting",
    "geospatial intelligence",
    "Dhaka smart city",
    "explainable AI",
  ],
  authors: [{ name: "Azizul Hakim", url: "https://github.com/AzizulHakim00" }],
  creator: "Azizul Hakim",
  publisher: "CivicLens AI",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CivicLens AI — Urban Hazard Intelligence",
    description:
      "An explainable AI platform for road-hazard detection, citizen reporting and authority operations.",
    url: "/",
    siteName: "CivicLens AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CivicLens AI",
    description: "Explainable urban hazard detection and geospatial reporting platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "codex-preview": "development",
    "visual-version": "5.0",
    "media-version": "5.0",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#050b18",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <VisualAtmosphere />
        {children}
        <CityMediaExperience />
        <OperationsEnhancer />
      </body>
    </html>
  );
}
