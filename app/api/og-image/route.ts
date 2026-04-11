import { NextRequest, NextResponse } from "next/server";
import satori from "satori";
import sharp from "sharp";
import { readFile } from "fs/promises";
import { join } from "path";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIDTH = 1200;
const HEIGHT = 630;

// MUTX brand palette
const BG = "#060810";
const BG_GRADIENT_END = "#0c1220";
const TEXT_WHITE = "#ffffff";
const TEXT_MUTED = "#94a3b8";
const ACCENT = "#68e1ff";
const LOGO_RED = "#FF4E4E";

// ---------------------------------------------------------------------------
// Font loading (cached across invocations in the same cold start)
// ---------------------------------------------------------------------------

let geistRegular: ArrayBuffer | undefined;
let geistBold: ArrayBuffer | undefined;
const IMAGE_CACHE_TTL_MS = 60 * 60 * 1000;
const IMAGE_CACHE_MAX_ENTRIES = 200;
const imageCache = new Map<string, { png: Uint8Array; expiresAt: number }>();
const inflightImageRenders = new Map<string, Promise<Uint8Array>>();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function loadFont(weight: "regular" | "bold" = "regular"): Promise<ArrayBuffer> {
  if (weight === "bold" && geistBold) return geistBold;
  if (weight === "regular" && geistRegular) return geistRegular;

  const fileName = weight === "bold" ? "Geist-Bold.ttf" : "Geist-Regular.ttf";
  const fontPath = join(process.cwd(), "app/fonts", fileName);
  const buf = await readFile(fontPath);
  const ab = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;

  if (weight === "bold") {
    geistBold = ab;
  } else {
    geistRegular = ab;
  }
  return ab;
}

// ---------------------------------------------------------------------------
// SVG logo mark inlined (openclaw-mark.svg without the background rect)
// ---------------------------------------------------------------------------

function logoMarkSvg(size: number): string {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="og-body" x1="110" y1="80" x2="520" y2="540" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF4E4E"/>
      <stop offset="1" stop-color="#C92D2D"/>
    </linearGradient>
    <linearGradient id="og-arm" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#FF5959"/>
      <stop offset="1" stop-color="#B92525"/>
    </linearGradient>
  </defs>
  <path d="M200 86C184 72 161 73 147 88C133 102 132 124 145 138L187 180C201 194 224 194 238 181C252 167 252 145 239 131L200 86Z" fill="#FF5656"/>
  <path d="M440 86C456 72 479 73 493 88C507 102 508 124 495 138L453 180C439 194 416 194 402 181C388 167 388 145 401 131L440 86Z" fill="#FF5656"/>
  <ellipse cx="320" cy="330" rx="244" ry="232" fill="url(#og-body)"/>
  <path d="M59 256C25 253 -2 282 0 318C2 353 31 381 66 379C99 377 126 348 127 315C128 284 92 259 59 256Z" fill="url(#og-arm)"/>
  <path d="M581 256C615 253 642 282 640 318C638 353 609 381 574 379C541 377 514 348 513 315C512 284 548 259 581 256Z" fill="url(#og-arm)"/>
  <circle cx="242" cy="240" r="38" fill="#06121F"/>
  <circle cx="398" cy="240" r="38" fill="#06121F"/>
  <circle cx="242" cy="240" r="16" fill="#19E0DA"/>
  <circle cx="398" cy="240" r="16" fill="#19E0DA"/>
  <path d="M260 547H296V640H260V547Z" fill="#D43131"/>
  <path d="M344 547H380V640H344V547Z" fill="#D43131"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Escape helper for XML
// ---------------------------------------------------------------------------

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Build the Satori JSX tree
// ---------------------------------------------------------------------------

function buildCard({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  const displayTitle =
    title.length > 80 ? title.slice(0, 77) + "..." : title;
  const displayDesc = description
    ? description.length > 140
      ? description.slice(0, 137) + "..."
      : description
    : undefined;

  return {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(135deg, ${BG} 0%, ${BG_GRADIENT_END} 100%)`,
        padding: "64px 72px",
        fontFamily: "Geist",
        color: TEXT_WHITE,
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // ── Decorative accent line at top ──
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${LOGO_RED} 0%, ${ACCENT} 50%, ${LOGO_RED} 100%)`,
            },
          },
        },
        // ── Main content area ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              maxWidth: 900,
              gap: 20,
            },
            children: [
              // Badge (optional)
              ...(badge
                ? [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          backgroundColor: "rgba(104, 225, 255, 0.1)",
                          border: `1px solid rgba(104, 225, 255, 0.25)`,
                          borderRadius: 100,
                          padding: "6px 16px",
                          fontSize: 14,
                          color: ACCENT,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase" as const,
                          width: "fit-content",
                        },
                        children: [escapeXml(badge)],
                      },
                    },
                  ]
                : []),
              // Title
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 56,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: TEXT_WHITE,
                    letterSpacing: "-0.025em",
                  },
                  children: [escapeXml(displayTitle)],
                },
              },
              // Description
              ...(displayDesc
                ? [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 22,
                          lineHeight: 1.5,
                          color: TEXT_MUTED,
                          maxWidth: 760,
                        },
                        children: [escapeXml(displayDesc)],
                      },
                    },
                  ]
                : []),
            ],
          },
        },
        // ── Footer: logo + branding ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  },
                  children: [
                    // Inline SVG logo via img with data URI
                    {
                      type: "img",
                      props: {
                        width: 40,
                        height: 40,
                        src: `data:image/svg+xml;base64,${Buffer.from(logoMarkSvg(40)).toString("base64")}`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 22,
                          fontWeight: 700,
                          color: TEXT_WHITE,
                          letterSpacing: "0.08em",
                        },
                        children: ["MUTX"],
                      },
                    },
                  ],
                },
              },
              // Tagline
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 14,
                    color: TEXT_MUTED,
                    letterSpacing: "0.04em",
                  },
                  children: ["Open Control Plane for AI Agents"],
                },
              },
            ],
          },
        },
        // ── Subtle grid decoration ──
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "linear-gradient(rgba(104,225,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(104,225,255,0.03) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              pointerEvents: "none",
            },
          },
        },
      ],
    },
  };
}

function getCacheKey({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}): string {
  return JSON.stringify({
    title: title.trim(),
    description: description?.trim() ?? "",
    badge: badge?.trim() ?? "",
  });
}

function getCachedImage(cacheKey: string): Uint8Array | undefined {
  const cached = imageCache.get(cacheKey);
  if (!cached) return undefined;
  if (cached.expiresAt <= Date.now()) {
    imageCache.delete(cacheKey);
    return undefined;
  }
  return cached.png;
}

function setCachedImage(cacheKey: string, png: Uint8Array): void {
  if (imageCache.size >= IMAGE_CACHE_MAX_ENTRIES) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) imageCache.delete(oldestKey);
  }
  imageCache.set(cacheKey, {
    png,
    expiresAt: Date.now() + IMAGE_CACHE_TTL_MS,
  });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const title = searchParams.get("title") || "MUTX";
  const description = searchParams.get("description") || undefined;
  const badge = searchParams.get("badge") || undefined;
  const cacheKey = getCacheKey({ title, description, badge });

  const cachedPng = getCachedImage(cacheKey);
  if (cachedPng) {
    return new NextResponse(toArrayBuffer(cachedPng), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400, immutable",
        "CDN-Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  try {
    let renderPromise = inflightImageRenders.get(cacheKey);
    if (!renderPromise) {
      renderPromise = (async () => {
        const [regularFontData, boldFontData] = await Promise.all([
          loadFont("regular"),
          loadFont("bold"),
        ]);

        // 1. Render React tree → SVG via Satori
        const element = buildCard({ title, description, badge }) as unknown as ReactNode;
        const svg = await satori(element, {
          width: WIDTH,
          height: HEIGHT,
          fonts: [
            {
              name: "Geist",
              data: regularFontData,
              style: "normal",
              weight: 400,
            },
            {
              name: "Geist",
              data: boldFontData,
              style: "normal",
              weight: 700,
            },
          ],
        });

        // 2. SVG → PNG via sharp
        const png = await sharp({
          create: {
            width: WIDTH,
            height: HEIGHT,
            channels: 4,
            background: { r: 6, g: 8, b: 16, alpha: 1 },
          },
        })
          .composite([
            {
              input: Buffer.from(svg),
              density: 150,
            },
          ])
          .png({
            quality: 90,
            compressionLevel: 6,
          })
          .toBuffer();

        return new Uint8Array(png);
      })();
      inflightImageRenders.set(cacheKey, renderPromise);
    }

    const png = await renderPromise;
    setCachedImage(cacheKey, png);
    inflightImageRenders.delete(cacheKey);

    // 3. Return PNG with cache headers
    return new NextResponse(toArrayBuffer(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400, immutable",
        "CDN-Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    inflightImageRenders.delete(cacheKey);
    console.error("[og-image] Error generating image:", error);
    return new NextResponse("Failed to generate OG image", { status: 500 });
  }
}
