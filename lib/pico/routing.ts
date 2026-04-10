const PICO_HOSTS = new Set(["pico.mutx.dev", "pico.localhost"]);

export function normalizePicoHost(host?: string | null) {
  return (host ?? "").split(":")[0].trim().toLowerCase();
}

export function isPicoHost(host?: string | null) {
  return PICO_HOSTS.has(normalizePicoHost(host));
}

export function getPicoBasePath(host?: string | null) {
  return isPicoHost(host) ? "" : "/pico";
}

export function buildPicoPath(basePath: string, path = "/") {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}` || "/";
}
