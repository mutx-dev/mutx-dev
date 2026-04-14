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
