"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";

import styles from "./MarketingHome.module.css";

const SESSION_KEY = "mutx-home-loader-played";
const ROOT_PLAYED_ATTRIBUTE = "data-home-loader-played";
const ROOT_TARGET_VISIBLE_ATTRIBUTE = "data-loader-target-visible";
const STAGE_SETTLE_DURATION_MS = 660;
const HANDOFF_DURATION_MS = 680;
const FALLBACK_EXIT_MS = 320;
const ACTIVE_FALLBACK_DURATION_MS = 2800;
const VIDEO_REVEAL_AT_MS = 90;
const LOADER_VIDEO_WEBM_SRC = "/marketing/loader/mutx-logo-loader-60fps-2x.webm";
const LOADER_VIDEO_MP4_SRC = "/marketing/loader/mutx-logo-loader-60fps-2x.mp4";

type LoaderState = "active" | "handoff" | "complete";

type ExitTransform = {
  scale: number;
  x: number;
  y: number;
};

type FrameAwareVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

const DEFAULT_EXIT_TRANSFORM: ExitTransform = {
  scale: 0.46,
  x: 0,
  y: -180,
};

export function MarketingLoader() {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [loaderState, setLoaderState] = useState<LoaderState>("active");
  const [canHandoffToTarget, setCanHandoffToTarget] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [exitTransform, setExitTransform] = useState<ExitTransform>(DEFAULT_EXIT_TRANSFORM);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeTimerRef = useRef<number | null>(null);
  const handoffFrameRef = useRef<number | null>(null);
  const videoRevealFrameRef = useRef<number | null>(null);
  const videoRevealQueuedRef = useRef(false);
  const completeOnceRef = useRef(false);
  const handoffQueuedRef = useRef(false);
  const handoffStartedAtRef = useRef<number>(0);
  const handoffDistanceRef = useRef<number>(0);

  const clearVideoRevealFrame = useCallback(() => {
    const video = videoRef.current as FrameAwareVideo | null;

    if (videoRevealFrameRef.current !== null && typeof video?.cancelVideoFrameCallback === "function") {
      video.cancelVideoFrameCallback(videoRevealFrameRef.current);
    }

    videoRevealFrameRef.current = null;
    videoRevealQueuedRef.current = false;
  }, []);

  const clearTimers = useCallback(() => {
    if (activeTimerRef.current !== null) {
      window.clearTimeout(activeTimerRef.current);
      activeTimerRef.current = null;
    }

    if (handoffFrameRef.current !== null) {
      window.cancelAnimationFrame(handoffFrameRef.current);
      handoffFrameRef.current = null;
    }

    clearVideoRevealFrame();
  }, [clearVideoRevealFrame]);

  const markLoaderPlayed = useCallback(() => {
    document.documentElement.setAttribute(ROOT_PLAYED_ATTRIBUTE, "1");
    document.documentElement.setAttribute("data-loader-state", "complete");
  }, []);

  const syncExitTransform = useCallback(() => {
    const stageRect = stageRef.current?.getBoundingClientRect();
    const targetRect = document
      .querySelector<HTMLElement>("[data-loader-target='marketing-brand-mark']")
      ?.getBoundingClientRect();

    if (!stageRect || !targetRect) {
      setExitTransform(DEFAULT_EXIT_TRANSFORM);
      return false;
    }

    const stageCenterX = stageRect.left + stageRect.width / 2;
    const stageCenterY = stageRect.top + stageRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    setExitTransform({
      scale: Math.max(targetRect.width / stageRect.width, 0.24),
      x: targetCenterX - stageCenterX,
      y: targetCenterY - stageCenterY,
    });

    return true;
  }, []);

  const finishLoader = useCallback(() => {
    if (completeOnceRef.current) {
      return;
    }

    completeOnceRef.current = true;

    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore storage failures and still finish the handoff cleanly.
    }

    window.requestAnimationFrame(() => {
      markLoaderPlayed();
      setLoaderState("complete");
      setIsVisible(false);
    });
  }, [markLoaderPlayed]);

  const beginHandoff = useCallback(() => {
    if (handoffQueuedRef.current || completeOnceRef.current) {
      return;
    }

    handoffQueuedRef.current = true;
    clearTimers();

    window.requestAnimationFrame(() => {
      const stageRect = stageRef.current?.getBoundingClientRect();
      const targetRect = document
        .querySelector<HTMLElement>("[data-loader-target='marketing-brand-mark']")
        ?.getBoundingClientRect();
      const hasTarget = syncExitTransform();

      if (stageRect && targetRect) {
        const stageCenterX = stageRect.left + stageRect.width / 2;
        const stageCenterY = stageRect.top + stageRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        handoffDistanceRef.current = Math.hypot(
          targetCenterX - stageCenterX,
          targetCenterY - stageCenterY,
        );
      } else {
        handoffDistanceRef.current = 0;
      }

      setCanHandoffToTarget(hasTarget);
      setTargetVisible(false);
      handoffStartedAtRef.current = window.performance.now();
      setLoaderState("handoff");
    });
  }, [clearTimers, syncExitTransform]);

  useEffect(() => {
    document.documentElement.setAttribute("data-loader-state", loaderState);
  }, [loaderState]);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(
      "[data-loader-target='marketing-brand-mark']",
    );

    if (targetVisible) {
      document.documentElement.setAttribute(ROOT_TARGET_VISIBLE_ATTRIBUTE, "1");
      target?.setAttribute("data-loader-target-visible", "1");
      return undefined;
    }

    document.documentElement.removeAttribute(ROOT_TARGET_VISIBLE_ATTRIBUTE);
    target?.removeAttribute("data-loader-target-visible");
    return undefined;
  }, [targetVisible]);

  useEffect(() => {
    if (prefersReducedMotion) {
      completeOnceRef.current = true;
      setTargetVisible(true);
      markLoaderPlayed();
      setLoaderState("complete");
      setIsVisible(false);
      return undefined;
    }

    const hasPlayed =
      document.documentElement.getAttribute(ROOT_PLAYED_ATTRIBUTE) === "1" ||
      window.sessionStorage.getItem(SESSION_KEY) === "1";

    if (hasPlayed) {
      completeOnceRef.current = true;
      setTargetVisible(true);
      markLoaderPlayed();
      setLoaderState("complete");
      setIsVisible(false);
      return undefined;
    }

    completeOnceRef.current = false;
    handoffQueuedRef.current = false;
    setLoaderState("active");
    setIsVisible(true);
    setCanHandoffToTarget(false);
    setTargetVisible(false);
    setVideoVisible(false);
    videoRevealQueuedRef.current = false;
    videoRevealFrameRef.current = null;
    setExitTransform(DEFAULT_EXIT_TRANSFORM);

    return () => {
      clearTimers();
    };
  }, [clearTimers, markLoaderPlayed, prefersReducedMotion]);

  useEffect(() => {
    if (!isVisible || loaderState !== "active") {
      return undefined;
    }

    const video = videoRef.current;
    if (!video) {
      activeTimerRef.current = window.setTimeout(() => {
        beginHandoff();
      }, ACTIVE_FALLBACK_DURATION_MS);

      return () => {
        if (activeTimerRef.current !== null) {
          window.clearTimeout(activeTimerRef.current);
          activeTimerRef.current = null;
        }
      };
    }

    const frameAwareVideo = video as FrameAwareVideo;

    const scheduleFallback = () => {
      if (activeTimerRef.current !== null) {
        window.clearTimeout(activeTimerRef.current);
      }

      const durationMs =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.ceil(video.duration * 1000) + 180
          : ACTIVE_FALLBACK_DURATION_MS;

      activeTimerRef.current = window.setTimeout(() => {
        beginHandoff();
      }, durationMs);
    };

    const revealVideo = () => {
      clearVideoRevealFrame();
      setVideoVisible(true);
    };

    const revealVideoIfReady = () => {
      if (video.currentTime * 1000 >= VIDEO_REVEAL_AT_MS) {
        revealVideo();
      }
    };

    const queueVideoRevealOnFrame = () => {
      if (videoRevealQueuedRef.current || videoVisible) {
        return;
      }

      if (typeof frameAwareVideo.requestVideoFrameCallback === "function") {
        videoRevealQueuedRef.current = true;
        videoRevealFrameRef.current = frameAwareVideo.requestVideoFrameCallback(() => {
          revealVideo();
        });
        return;
      }

      revealVideoIfReady();
    };

    const handleLoadedMetadata = () => {
      scheduleFallback();
    };

    const handleCanPlay = () => {
      void video.play().catch(() => {
        beginHandoff();
      });
    };

    const handlePlaying = () => {
      queueVideoRevealOnFrame();
    };

    const handleTimeUpdate = () => {
      revealVideoIfReady();
    };

    const handleEnded = () => {
      revealVideo();
      beginHandoff();
    };

    const handleError = () => {
      clearVideoRevealFrame();
      setVideoVisible(false);
      beginHandoff();
    };

    if (video.readyState >= 1) {
      scheduleFallback();
    } else {
      activeTimerRef.current = window.setTimeout(() => {
        beginHandoff();
      }, ACTIVE_FALLBACK_DURATION_MS);
    }

    if (video.readyState >= 3) {
      handleCanPlay();
      queueVideoRevealOnFrame();
    }

    revealVideoIfReady();

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);

      if (activeTimerRef.current !== null) {
        window.clearTimeout(activeTimerRef.current);
        activeTimerRef.current = null;
      }
    };
  }, [beginHandoff, clearVideoRevealFrame, isVisible, loaderState, videoVisible]);

  useEffect(() => {
    if (!isVisible || loaderState !== "handoff" || !canHandoffToTarget || targetVisible) {
      return undefined;
    }

    const syncTargetVisibility = () => {
      const stageRect = stageRef.current?.getBoundingClientRect();
      const targetRect = document
        .querySelector<HTMLElement>("[data-loader-target='marketing-brand-mark']")
        ?.getBoundingClientRect();

      if (!stageRect || !targetRect) {
        handoffFrameRef.current = window.requestAnimationFrame(syncTargetVisibility);
        return;
      }

      const stageCenterX = stageRect.left + stageRect.width / 2;
      const stageCenterY = stageRect.top + stageRect.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      const centerDistance = Math.hypot(targetCenterX - stageCenterX, targetCenterY - stageCenterY);
      const widthDistance = Math.abs(stageRect.width - targetRect.width);
      const progressThreshold = handoffDistanceRef.current
        ? Math.max(handoffDistanceRef.current * 0.5, targetRect.width * 0.52)
        : targetRect.width * 0.52;
      const threshold = Math.max(progressThreshold, 22);

      if (centerDistance <= threshold && widthDistance <= threshold) {
        setTargetVisible(true);
        handoffFrameRef.current = null;
        return;
      }

      handoffFrameRef.current = window.requestAnimationFrame(syncTargetVisibility);
    };

    handoffFrameRef.current = window.requestAnimationFrame(syncTargetVisibility);

    return () => {
      if (handoffFrameRef.current !== null) {
        window.cancelAnimationFrame(handoffFrameRef.current);
        handoffFrameRef.current = null;
      }
    };
  }, [canHandoffToTarget, isVisible, loaderState, targetVisible]);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const stage = stageRef.current;
    const target = document.querySelector<HTMLElement>(
      "[data-loader-target='marketing-brand-mark']",
    );

    if (!stage || !target || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      if (loaderState === "active") {
        syncExitTransform();
      }
    });

    observer.observe(stage);
    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, loaderState, syncExitTransform]);

  useEffect(() => {
    return () => {
      clearTimers();
      document
        .querySelector<HTMLElement>("[data-loader-target='marketing-brand-mark']")
        ?.removeAttribute("data-loader-target-visible");
      document.documentElement.removeAttribute(ROOT_TARGET_VISIBLE_ATTRIBUTE);
      document.documentElement.removeAttribute("data-loader-state");
    };
  }, [clearTimers]);

  if (!isVisible) {
    return null;
  }

  const stageTransition =
    loaderState === "handoff"
      ? {
          duration: (canHandoffToTarget ? HANDOFF_DURATION_MS : FALLBACK_EXIT_MS) / 1000,
          ease: [0.22, 1, 0.36, 1] as const,
        }
      : {
          duration: STAGE_SETTLE_DURATION_MS / 1000,
          ease: [0.22, 1, 0.36, 1] as const,
        };

  return (
    <div className={styles.loader} data-testid="marketing-loader">
      <motion.div
        className={styles.loaderVeil}
        initial={{ opacity: 1 }}
        animate={
          loaderState === "handoff"
            ? { opacity: [1, 0.66, 0.16] }
            : { opacity: 1 }
        }
        transition={{
          duration: (canHandoffToTarget ? HANDOFF_DURATION_MS : FALLBACK_EXIT_MS) / 1000,
          ease: [0.22, 1, 0.36, 1],
          times: canHandoffToTarget ? [0, 0.7, 1] : [0, 0.45, 1],
        }}
      />

      <div className={styles.loaderStageAnchor}>
        <motion.div
          ref={stageRef}
          data-testid="marketing-loader-stage"
          className={`${styles.loaderStage} ${styles.loaderMarkShell}`}
          initial={{ opacity: 1, scale: 0.82, y: 0 }}
          animate={
            loaderState === "handoff"
              ? canHandoffToTarget
                ? {
                    opacity: 1,
                    scale: exitTransform.scale,
                    x: exitTransform.x,
                    y: exitTransform.y,
                  }
                : {
                    opacity: 0,
                    scale: 0.72,
                    y: -72,
                  }
              : {
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0,
              }
          }
          transition={stageTransition}
          onAnimationComplete={() => {
            if (loaderState !== "handoff") {
              return;
            }

            if (window.performance.now() - handoffStartedAtRef.current < HANDOFF_DURATION_MS * 0.7) {
              return;
            }

            if (!canHandoffToTarget) {
              finishLoader();
              return;
            }

            if (!targetVisible) {
              setTargetVisible(true);
              window.requestAnimationFrame(() => {
                finishLoader();
              });
              return;
            }

            finishLoader();
          }}
        >
          <motion.div
            className={styles.loaderStageGlow}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={
              loaderState === "handoff"
                ? canHandoffToTarget
                  ? { opacity: [0.28, 0.16, 0], scale: [1, 1.02, 0.92] }
                  : { opacity: 0, scale: 0.86 }
                : { opacity: [0.16, 0.38, 0.24], scale: [0.9, 1.06, 1] }
            }
            transition={{
              duration:
                (loaderState === "handoff" ? HANDOFF_DURATION_MS : STAGE_SETTLE_DURATION_MS) /
                1000,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          <video
            ref={videoRef}
            className={`${styles.loaderMarkVideo} ${videoVisible ? styles.loaderMarkVideoVisible : ""}`}
            muted
            playsInline
            autoPlay
            preload="auto"
          >
            <source src={LOADER_VIDEO_WEBM_SRC} type="video/webm" />
            <source src={LOADER_VIDEO_MP4_SRC} type="video/mp4" />
          </video>
        </motion.div>
      </div>
    </div>
  );
}
