"use client";

import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

type ViewportVideoProps = {
  src: string;
  className?: string;
  poster?: string;
  ariaLabel?: string;
  rootMargin?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
};

export function ViewportVideo({
  src,
  className,
  poster,
  ariaLabel,
  rootMargin = "320px 0px",
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = "none",
}: ViewportVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (inView && autoPlay) {
      void video.play().catch(() => undefined);
      return;
    }

    if (!inView) {
      video.pause();
    }
  }, [autoPlay, inView]);

  return (
    <div ref={ref}>
      <video
        ref={videoRef}
        className={className}
        src={inView ? src : undefined}
        poster={poster}
        aria-label={ariaLabel}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
      />
    </div>
  );
}
