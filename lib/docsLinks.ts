export function resolveDocHref(href: string, currentSlug: string[]): string {
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("/") ||
    /^[a-z][a-z0-9+.-]*:/i.test(href) ||
    href.startsWith("//")
  ) return href;

  const [hrefPath, hash = ""] = href.split("#", 2);
  const cleanHref = hrefPath.replace(/\.md$/i, "");
  const base = currentSlug.slice(0, -1);
  const segments = [...base, ...cleanHref.split("/")];
  const normalized: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") normalized.pop();
    else normalized.push(segment);
  }

  let route: string;
  if (normalized[0] === "api") {
    const apiPath = normalized.slice(1).join("/").replace(/^(index|reference)$/, "");
    route = apiPath ? `/docs/reference/${apiPath}` : "/docs/reference";
  } else if (normalized.join("/") === "sdk") {
    route = "/sdk";
  } else if (normalized.join("/") === "support") {
    route = "/support";
  } else {
    route = `/docs/${normalized.join("/")}`.replace(/\/(README|index)$/i, "");
  }

  return hash ? `${route}#${hash}` : route;
}
