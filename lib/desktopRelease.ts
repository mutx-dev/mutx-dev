import packageJson from "../package.json";

export const MUTX_GITHUB_OWNER = "mutx-dev";
export const MUTX_GITHUB_REPO = "mutx-dev";
export const MUTX_GITHUB_RELEASES_URL = `https://github.com/${MUTX_GITHUB_OWNER}/${MUTX_GITHUB_REPO}/releases`;
export const MUTX_DOCS_URL = "https://docs.mutx.dev";

const MUTX_GITHUB_RELEASES_API_URL = `https://api.github.com/repos/${MUTX_GITHUB_OWNER}/${MUTX_GITHUB_REPO}/releases?per_page=20`;

export type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

export type GitHubRelease = {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  html_url: string;
  assets: GitHubReleaseAsset[];
};

export type DesktopReleaseInfo = {
  tagName: string;
  version: string;
  htmlUrl: string;
  assets: {
    arm64Dmg: string | null;
    x64Dmg: string | null;
    arm64Zip: string | null;
    x64Zip: string | null;
    checksums: string | null;
  };
};

type DesktopAssetKind = "arm64-dmg" | "x64-dmg" | "arm64-zip" | "x64-zip" | "checksums";

const stableReleaseTagPattern = /^v(\d+)\.(\d+)\.(\d+)$/;
export const MUTX_RELEASE_NOTES_URL = buildReleaseNotesUrl(packageJson.version);

function getGitHubRequestHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "mutx.dev-download-resolver",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.MUTX_GITHUB_RELEASES_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function parseStableReleaseVersion(tagName: string): [number, number, number] | null {
  const match = stableReleaseTagPattern.exec(tagName);
  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(left: [number, number, number], right: [number, number, number]) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }

  return 0;
}

export function buildDesktopArtifactName(version: string, kind: DesktopAssetKind) {
  switch (kind) {
    case "arm64-dmg":
      return `MUTX-${version}-macos-arm64.dmg`;
    case "x64-dmg":
      return `MUTX-${version}-macos-x64.dmg`;
    case "arm64-zip":
      return `MUTX-${version}-macos-arm64.zip`;
    case "x64-zip":
      return `MUTX-${version}-macos-x64.zip`;
    case "checksums":
      return `MUTX-${version}-SHA256SUMS.txt`;
    default: {
      const exhaustiveCheck: never = kind;
      return exhaustiveCheck;
    }
  }
}

export function buildReleaseNotesUrl(version: string) {
  const [major, minor] = version.split(".");
  return `${MUTX_DOCS_URL}/docs/releases/v${major}.${minor}`;
}

function getAssetUrl(assets: GitHubReleaseAsset[], assetName: string) {
  return assets.find((asset) => asset.name === assetName)?.browser_download_url ?? null;
}

export function findLatestStableAppRelease(releases: GitHubRelease[]) {
  const stableReleases = releases
    .map((release) => ({
      release,
      version: parseStableReleaseVersion(release.tag_name),
    }))
    .filter(
      (candidate): candidate is { release: GitHubRelease; version: [number, number, number] } =>
        !candidate.release.draft && !candidate.release.prerelease && candidate.version !== null,
    )
    .sort((left, right) => compareSemver(right.version, left.version));

  return stableReleases[0]?.release ?? null;
}

export function normalizeDesktopRelease(release: GitHubRelease): DesktopReleaseInfo | null {
  const versionParts = parseStableReleaseVersion(release.tag_name);
  if (!versionParts) {
    return null;
  }

  const version = versionParts.join(".");

  return {
    tagName: release.tag_name,
    version,
    htmlUrl: release.html_url,
    assets: {
      arm64Dmg: getAssetUrl(release.assets, buildDesktopArtifactName(version, "arm64-dmg")),
      x64Dmg: getAssetUrl(release.assets, buildDesktopArtifactName(version, "x64-dmg")),
      arm64Zip: getAssetUrl(release.assets, buildDesktopArtifactName(version, "arm64-zip")),
      x64Zip: getAssetUrl(release.assets, buildDesktopArtifactName(version, "x64-zip")),
      checksums: getAssetUrl(release.assets, buildDesktopArtifactName(version, "checksums")),
    },
  };
}

export async function fetchLatestStableDesktopRelease(
  fetchImpl: typeof fetch = fetch,
): Promise<DesktopReleaseInfo | null> {
  try {
    const response = await fetchImpl(MUTX_GITHUB_RELEASES_API_URL, {
      headers: getGitHubRequestHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[desktop-release] GitHub releases lookup failed with status ${response.status}`,
      );
      return null;
    }

    const releases = (await response.json()) as GitHubRelease[];
    const release = findLatestStableAppRelease(releases);
    return release ? normalizeDesktopRelease(release) : null;
  } catch (error) {
    console.error("[desktop-release] Failed to fetch latest stable GitHub release", error);
    return null;
  }
}
