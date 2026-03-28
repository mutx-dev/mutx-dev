import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Space_Grotesk,
  Syne,
} from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-site-body",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-site-display",
});

export const appFontVariables = [
  spaceGrotesk.variable,
  ibmPlexMono.variable,
  ibmPlexSans.variable,
  syne.variable,
].join(" ");
