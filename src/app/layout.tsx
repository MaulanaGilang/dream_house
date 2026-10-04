import type { Metadata, Viewport } from "next";
import { Archivo, Mrs_Saint_Delafield, Oranienbaum } from "next/font/google";
import "./globals.css";

const display = Oranienbaum({ variable: "--font-oranienbaum", subsets: ["latin"], weight: "400" });
const script = Mrs_Saint_Delafield({ variable: "--font-script-face", subsets: ["latin"], weight: "400" });
const body = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: "La Casa",
  description:
    "La Casa: a private two-storey Mediterranean family house on a 6 m bluff above a hidden cove in Indonesia. Film, drawings, rooms and materials.",
};

export const viewport: Viewport = {
  themeColor: "#f4f1ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${script.variable} ${body.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
