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
    <html lang="en" className={`${display.variable} ${script.variable} ${body.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* the intro plays once per session (as on era-residence.com); flag repeat visits before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("lacasa:intro")){document.documentElement.dataset.introSeen="1";var s=document.createElement("style");s.textContent=".intro{display:none!important}";document.head.appendChild(s)}}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
