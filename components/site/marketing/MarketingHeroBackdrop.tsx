import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import styles from "./MarketingHome.module.css";

type MarketingHeroBackdropProps = {
  className?: string;
  imageClassName?: string;
  fetchPriority?: "auto" | "high" | "low";
  src?: string;
  position?: string;
  scale?: number;
  shiftX?: string;
};

export function MarketingHeroBackdrop({
  className,
  imageClassName,
  fetchPriority = "auto",
  src = "/landing/webp/victory-core.webp",
  position,
  scale,
  shiftX,
}: MarketingHeroBackdropProps) {
  const backdropStyle = {
    "--marketing-backdrop-position": position,
    "--marketing-backdrop-scale": scale ? String(scale) : undefined,
    "--marketing-backdrop-shift-x": shiftX,
  } as CSSProperties;

  return (
    <div className={cn(styles.marketingBackdrop, className)} aria-hidden="true" style={backdropStyle}>
      <img
        src={src}
        alt=""
        className={cn(styles.marketingBackdropImage, imageClassName)}
        decoding="async"
        fetchPriority={fetchPriority}
      />
      <div className={styles.marketingBackdropShade} />
      <div className={styles.marketingBackdropGrid} />
    </div>
  );
}
