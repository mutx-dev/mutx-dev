const PICO_HOSTS = new Set(["pico.mutx.dev", "pico.mutxx.dev", "pico.localhost"]);

export function isPicoHost(hostname?: string | null) {
  if (!hostname) {
    return false;
  }

  return PICO_HOSTS.has(hostname.toLowerCase());
}

export function getDefaultRedirectPathForHost(
  hostname?: string | null,
  fallback = "/dashboard",
) {
  return isPicoHost(hostname) ? "/" : fallback;
}

export function mergeRedirectPathWithSearch(
  nextPath?: string | null,
  search?: string | null,
) {
  if (!nextPath || !search || nextPath.includes("?")) {
    return nextPath;
  }

  const normalizedSearch = search.startsWith("?") ? search : `?${search}`;
  if (normalizedSearch === "?") {
    return nextPath;
  }

  const hashIndex = nextPath.indexOf("#");
  if (hashIndex === -1) {
    return `${nextPath}${normalizedSearch}`;
  }

  return `${nextPath.slice(0, hashIndex)}${normalizedSearch}${nextPath.slice(hashIndex)}`;
}

export function resolveRedirectPath(
  nextPath?: string | null,
  fallback = "/dashboard",
) {
  if (!nextPath) {
    return fallback;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  if (
    nextPath.startsWith("/login") ||
    nextPath.startsWith("/register") ||
    nextPath.startsWith("/api/auth/oauth/")
  ) {
    return fallback;
  }

  return nextPath;
}
