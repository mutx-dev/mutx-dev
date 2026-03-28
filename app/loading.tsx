import { MarketingHeroBackdrop } from "@/components/site/marketing/MarketingHeroBackdrop";
import styles from "@/components/site/marketing/MarketingHome.module.css";

export default function Loading() {
  return (
    <div className={styles.loaderFallback} aria-hidden="true">
      <MarketingHeroBackdrop fetchPriority="high" />
      <div className={styles.loaderVeil} />
      <div className={`${styles.loaderFallbackStage} ${styles.loaderMarkShell}`}>
        <div className={styles.loaderStageGlow} />
        <video
          poster="/marketing/loader/mutx-logo-loader-poster.webp"
          className={styles.loaderMarkVideo}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
        >
          <source src="/marketing/loader/mutx-logo-loader-60fps-2x.webm" type="video/webm" />
          <source src="/marketing/loader/mutx-logo-loader-60fps-2x.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
