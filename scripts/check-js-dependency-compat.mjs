import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const packageManifests = readdirSync("node_modules", {
  encoding: "utf8",
  recursive: true,
})
  .filter((entry) => entry.endsWith("package.json"))
  .map((entry) => resolve("node_modules", entry));

const readManifest = (path) => JSON.parse(readFileSync(path, "utf8"));
const compareVersions = (left, right) => {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (delta !== 0) return delta;
  }

  return 0;
};

const braceManifests = packageManifests.filter(
  (path) => readManifest(path).name === "brace-expansion",
);

if (braceManifests.length === 0) {
  throw new Error("No installed brace-expansion packages found");
}

for (const manifestPath of braceManifests) {
  const { version } = readManifest(manifestPath);
  const major = Number(version.split(".")[0]);
  // Patched release lines for the active brace-expansion advisories.
  const minimum = major === 1 ? "1.1.21" : major === 2 ? "2.1.7" : "5.0.12";

  if (
    !Number.isInteger(major) ||
    major < 1 ||
    compareVersions(version, minimum) < 0
  ) {
    throw new Error(`Unpatched brace-expansion ${version} at ${manifestPath}`);
  }
}

const minimatchManifests = packageManifests.filter(
  (path) => readManifest(path).name === "minimatch",
);

if (minimatchManifests.length === 0) {
  throw new Error("No installed minimatch packages found");
}

for (const manifestPath of minimatchManifests) {
  const { version } = readManifest(manifestPath);
  const loaded = require(dirname(manifestPath));
  const match =
    typeof loaded === "function"
      ? loaded
      : (loaded.minimatch ?? loaded.default);

  if (typeof match !== "function") {
    throw new Error(`No callable minimatch export for ${version}`);
  }

  if (
    !match("src/index.ts", "src/**/*.ts") ||
    match("README.md", "src/**/*.ts")
  ) {
    throw new Error(`minimatch ${version} failed its compatibility probe`);
  }
}

// Electron packaging parses Info.plist through every installed plist copy.
// A security override of xmldom must preserve that parser contract.
for (const manifestPath of packageManifests.filter((path) => readManifest(path).name === "plist")) {
  const plist = require(dirname(manifestPath));
  const expected = { CFBundleName: "MUTX", CFBundleVersion: "1.4.0" };
  const parsed = plist.parse(plist.build(expected));
  if (parsed.CFBundleName !== expected.CFBundleName || parsed.CFBundleVersion !== expected.CFBundleVersion) {
    throw new Error(`plist failed its packaging compatibility probe at ${manifestPath}`);
  }
}

// Capacitor's Xcode writer uses uuid.v4 through CommonJS. Keep that concrete
// contract when replacing its vulnerable uuid dependency with the patched line.
const xcodeManifests = packageManifests.filter((path) => readManifest(path).name === "xcode");
if (xcodeManifests.length === 0) {
  throw new Error("No installed xcode writer found for the maintained Capacitor contract");
}
for (const manifestPath of xcodeManifests) {
  const xcodeRequire = createRequire(manifestPath);
  const { version } = readManifest(xcodeRequire.resolve("uuid/package.json"));
  if (!/^\d+\.\d+\.\d+$/.test(version) || compareVersions(version, "11.1.1") < 0) {
    throw new Error(`Unpatched xcode UUID ${version} at ${manifestPath}`);
  }
  const xcode = require(dirname(manifestPath));
  const project = xcode.project("compatibility-probe.pbxproj");
  project.hash = { project: { objects: {} } };
  const ids = Array.from({ length: 8 }, () => project.generateUuid());
  if (ids.some((id) => !/^[A-F0-9]{24}$/.test(id)) || new Set(ids).size !== ids.length) {
    throw new Error(`xcode failed its UUID compatibility probe at ${manifestPath}`);
  }
}

const braceVersions = [
  ...new Set(braceManifests.map((path) => readManifest(path).version)),
]
  .sort(compareVersions)
  .join(", ");
console.log(
  `Dependency compatibility passed: brace-expansion ${braceVersions}; ${minimatchManifests.length} minimatch and ${xcodeManifests.length} xcode installation(s) probed.`,
);
