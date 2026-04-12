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
