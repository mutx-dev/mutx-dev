import { Doto } from "next/font/google";
import localFont from "next/font/local";

export const marketingSans = localFont({
  src: "./marketing/SyndicatGrotesk-Regular.woff2",
  variable: "--font-marketing-sans",
  display: "swap",
});

export const marketingDisplay = localFont({
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
  variable: "--font-marketing-display",
  display: "swap",
});

export const marketingMono = localFont({
  src: "./marketing/SuisseNeue-Light-WebS.woff2",
  variable: "--font-marketing-mono",
  display: "swap",
});

export const marketingAccent = Doto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-marketing-accent",
  display: "swap",
});
