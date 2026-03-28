const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const packageJson = require("../../package.json");
const { verifyCurrentReleaseArtifacts } = require("./release-artifact-utils");

const productName = packageJson.build?.productName || packageJson.name;
const version = packageJson.version;
const distDir = path.resolve(__dirname, "../../dist/desktop");
const notarizeExistingScript = path.resolve(__dirname, "./notarize-existing.js");

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function getCurrentReleaseDmgs() {
  if (!fs.existsSync(distDir)) {
    return [];
  }

  const prefix = `${productName}-${version}-macos-`;

  return fs
    .readdirSync(distDir)
    .filter((entry) => entry.startsWith(prefix) && entry.endsWith(".dmg"))
    .filter((entry) => !entry.startsWith(".temp"))
    .map((entry) => path.join(distDir, entry))
    .sort();
}

function hasStapledTicket(artifactPath) {
  const result = spawnSync("xcrun", ["stapler", "validate", artifactPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return result.status === 0;
}

function notarizeDmg(dmgPath) {
  console.log(`Notarizing release DMG ${dmgPath}`);

  const result = spawnSync(
    process.execPath,
    [notarizeExistingScript, "--dmg", dmgPath, "--timeout", "2h"],
    {
      stdio: "inherit",
      env: process.env,
    }
  );

  if (result.status !== 0) {
    fail(`Failed to notarize DMG ${dmgPath}`, result.status || 1);
  }
}

function main() {
  console.log(`Verifying current ${productName} ${version} desktop artifacts before notarization...`);
  verifyCurrentReleaseArtifacts();

  const dmgs = getCurrentReleaseDmgs();

  if (dmgs.length === 0) {
    fail(`No ${productName} ${version} DMGs found under ${distDir}`);
  }

  for (const dmgPath of dmgs) {
    if (hasStapledTicket(dmgPath)) {
      console.log(`Skipping already stapled DMG ${dmgPath}`);
      continue;
    }

    notarizeDmg(dmgPath);
  }

  console.log(`Release DMG notarization complete for ${productName} ${version}.`);
}

main();
