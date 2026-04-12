import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";

const suisseNeueDisplay = localFont({
  src: [
    {
      path: "./marketing/SuisseNeue-Light-WebS.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./marketing/SuisseNeue-Light-WebXL.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

const suisseNeueSiteDisplay = localFont({
  src: [
    {
      path: "./marketing/SuisseNeue-Light-WebS.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./marketing/SuisseNeue-Light-WebXL.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-site-display",
  display: "swap",
});

const syndicatGroteskBody = localFont({
  src: "./marketing/SyndicatGrotesk-Regular.woff2",
  variable: "--font-site-body",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const appFontVariables = [
  suisseNeueDisplay.variable,
  suisseNeueSiteDisplay.variable,
  ibmPlexMono.variable,
  syndicatGroteskBody.variable,
].join(" ");
