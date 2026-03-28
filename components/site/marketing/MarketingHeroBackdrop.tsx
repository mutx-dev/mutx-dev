import { cn } from "@/lib/utils";

import styles from "./MarketingHome.module.css";

type MarketingHeroBackdropProps = {
  className?: string;
  imageClassName?: string;
  fetchPriority?: "auto" | "high" | "low";
  src?: string;
};

export function MarketingHeroBackdrop({
  className,
  imageClassName,
  fetchPriority = "auto",
  src = "/landing/webp/victory-core.webp",
}: MarketingHeroBackdropProps) {
  return (
    <div className={cn(styles.marketingBackdrop, className)} aria-hidden="true">
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
