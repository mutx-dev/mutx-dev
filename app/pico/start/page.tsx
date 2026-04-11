import type { Metadata } from "next";

import { PicoStartPage } from "@/components/pico/PicoStartPage";

export const metadata: Metadata = {
  title: "Pico start",
  description:
    "First-run Pico checklist: sign in, start the academy, deploy the starter assistant, and review control.",
};

export default function PicoStartRoute() {
  return <PicoStartPage />;
}