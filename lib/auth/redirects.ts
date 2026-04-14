const PICO_HOSTS = new Set(["pico.mutx.dev", "pico.mutxx.dev", "pico.localhost"]);

export function getDefaultRedirectPathForHost(
  hostname?: string | null,
  fallback = "/dashboard",
) {
  if (!hostname) {
    return fallback;
  }

  return PICO_HOSTS.has(hostname.toLowerCase()) ? "/" : fallback;
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
