const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const packageJson = require("../../package.json");
const { verifyDmgArtifact } = require("./release-artifact-utils");
const productName = packageJson.build?.productName || packageJson.name;
const distDir = path.resolve(__dirname, "../../dist/desktop");

function readEnv(name) {
  return process.env[name] && process.env[name].trim().length > 0
    ? process.env[name].trim()
    : null;
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--app") {
      args.app = argv[index + 1];
      index += 1;
      continue;
    }

    if (current.startsWith("--app=")) {
      args.app = current.slice("--app=".length);
      continue;
    }

    if (current === "--dmg") {
      args.dmg = argv[index + 1];
      index += 1;
      continue;
    }

    if (current.startsWith("--dmg=")) {
      args.dmg = current.slice("--dmg=".length);
      continue;
    }

    if (current === "--timeout") {
      args.timeout = argv[index + 1];
      index += 1;
      continue;
    }

    if (current.startsWith("--timeout=")) {
      args.timeout = current.slice("--timeout=".length);
    }
  }

  return args;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function getOutput(result) {
  return `${result.stdout || ""}${result.stderr || ""}`.trim();
}

function isInsufficientContext(result) {
  return getOutput(result).includes("source=Insufficient Context");
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function resolveArtifactPath(value) {
  return value ? path.resolve(value) : null;
}

function findLatestApp() {
  const candidates = ["mac-arm64", "mac"]
    .map((dir) => path.join(distDir, dir, `${productName}.app`))
    .filter((artifactPath) => fs.existsSync(artifactPath))
    .map((artifactPath) => ({
      artifactPath,
      mtimeMs: fs.statSync(artifactPath).mtimeMs,
    }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  return candidates[0]?.artifactPath || null;
}

function findLatestDmg() {
  if (!fs.existsSync(distDir)) {
    return null;
  }

  const candidates = fs
    .readdirSync(distDir)
    .filter((entry) => entry.endsWith(".dmg"))
    .filter((entry) => !entry.startsWith(".temp"))
    .map((entry) => {
      const artifactPath = path.join(distDir, entry);
      return {
        artifactPath,
        mtimeMs: fs.statSync(artifactPath).mtimeMs,
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  return candidates[0]?.artifactPath || null;
}

function buildAuthArgs() {
  const keychainProfile = readEnv("APPLE_KEYCHAIN_PROFILE");
  const keychain = readEnv("APPLE_KEYCHAIN");

  if (keychainProfile) {
    const args = ["--keychain-profile", keychainProfile];
    if (keychain) {
      args.push("--keychain", keychain);
    }

    return {
      label: `keychain profile ${keychainProfile}`,
      args,
    };
  }

  const apiKey = readEnv("APPLE_API_KEY");
  const apiKeyId = readEnv("APPLE_API_KEY_ID");
  const apiIssuer = readEnv("APPLE_API_ISSUER");

  if (apiKey && apiKeyId) {
    const args = ["--key", apiKey, "--key-id", apiKeyId];
    if (apiIssuer) {
      args.push("--issuer", apiIssuer);
    }

    return {
      label: apiIssuer ? "App Store Connect API key" : "individual App Store Connect API key",
      args,
    };
  }

  const appleId = readEnv("APPLE_ID");
  const applePassword = readEnv("APPLE_APP_SPECIFIC_PASSWORD");
  const teamId = readEnv("APPLE_TEAM_ID");

  if (appleId && applePassword && teamId) {
    return {
      label: `Apple ID ${appleId}`,
      args: ["--apple-id", appleId, "--password", applePassword, "--team-id", teamId],
    };
  }

  return null;
}

function assertSigned(appPath) {
  const result = run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);
  if (result.status !== 0) {
    fail(`App is not validly signed:\n${getOutput(result)}`, result.status || 1);
  }
}

function zipApp(appPath, zipPath) {
  const result = run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appPath, zipPath]);
  if (result.status !== 0) {
    fail(`Failed to create notarization archive:\n${getOutput(result)}`, result.status || 1);
  }
}

function parseJson(result) {
  const raw = (result.stdout || "").trim() || getOutput(result);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function fetchLog(submissionId, authArgs) {
  const result = run("xcrun", ["notarytool", "log", ...authArgs, submissionId]);
  if (result.status === 0) {
    const output = getOutput(result);
    if (output) {
      console.error("\nNotary log:");
      console.error(output);
    }
  }
}

function submitForNotarization(filePath, authArgs, timeout) {
  const startedAt = Date.now();
  const submit = run("xcrun", [
    "notarytool",
    "submit",
    ...authArgs,
    "--wait",
    "--timeout",
    timeout,
    "--output-format",
    "json",
    filePath,
  ]);

  const response = parseJson(submit);
  const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);

  if (response?.id) {
    console.log(`Submission id: ${response.id}`);
  }

  if (submit.status !== 0) {
    console.error(getOutput(submit));
    if (response?.id) {
      fetchLog(response.id, authArgs);
    }
    process.exit(submit.status || 1);
  }

  console.log(`Notary status for ${path.basename(filePath)}: ${response?.status || "unknown"} (${elapsedSeconds}s)`);

  if (response?.status !== "Accepted") {
    if (response?.id) {
      fetchLog(response.id, authArgs);
    }
    fail(
      `Notarization did not complete successfully for ${path.basename(filePath)}. Final status: ${response?.status || "unknown"}`
    );
  }
}

function staple(artifactPath) {
  const staple = run("xcrun", ["stapler", "staple", "-v", artifactPath]);
  if (staple.status !== 0) {
    fail(`Stapling failed:\n${getOutput(staple)}`, staple.status || 1);
  }
}

function validateStapledTicket(artifactPath) {
  const validate = run("xcrun", ["stapler", "validate", artifactPath]);
  if (validate.status !== 0) {
    fail(`Stapled ticket validation failed:\n${getOutput(validate)}`, validate.status || 1);
  }
}

function validateApp(appPath) {
  const gatekeeper = run("spctl", ["--assess", "--type", "execute", "--verbose=4", appPath]);
  if (gatekeeper.status !== 0) {
    fail(`Gatekeeper still rejects the app:\n${getOutput(gatekeeper)}`, gatekeeper.status || 1);
  }
}

function validateDmg(dmgPath) {
  verifyDmgArtifact(dmgPath);
  const gatekeeper = run("spctl", ["--assess", "--type", "open", "--verbose=4", dmgPath]);
  if (gatekeeper.status !== 0 && !isInsufficientContext(gatekeeper)) {
    fail(`Gatekeeper still rejects the DMG:\n${getOutput(gatekeeper)}`, gatekeeper.status || 1);
  }

  if (gatekeeper.status !== 0 && isInsufficientContext(gatekeeper)) {
    console.log(`Gatekeeper returned Insufficient Context for ${path.basename(dmgPath)}; stapled ticket validation is the release gate.`);
  }
}

function notarizeApp(appPath, auth, timeout) {
  assertSigned(appPath);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mutx-notarize-"));
  const zipPath = path.join(tempDir, `${path.basename(appPath)}.zip`);

  console.log(`Preparing app ${appPath}`);
  zipApp(appPath, zipPath);
  console.log(`Submitting app archive ${zipPath}`);

  submitForNotarization(zipPath, auth.args, timeout);
  staple(appPath);
  validateStapledTicket(appPath);
  validateApp(appPath);
  console.log(`Stapled and validated app ${appPath}`);
}

function notarizeDmg(dmgPath, auth, timeout) {
  console.log(`Submitting DMG ${dmgPath}`);
  submitForNotarization(dmgPath, auth.args, timeout);
  staple(dmgPath);
  validateStapledTicket(dmgPath);
  validateDmg(dmgPath);
  console.log(`Stapled and validated DMG ${dmgPath}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const autoSelectArtifacts = !args.app && !args.dmg;
  const appPath = args.app
    ? resolveArtifactPath(args.app)
    : autoSelectArtifacts
      ? resolveArtifactPath(findLatestApp())
      : null;
  const dmgPath = args.dmg
    ? resolveArtifactPath(args.dmg)
    : autoSelectArtifacts
      ? resolveArtifactPath(findLatestDmg())
      : null;

  if ((!appPath || !fs.existsSync(appPath)) && (!dmgPath || !fs.existsSync(dmgPath))) {
    fail(
      [
        "No notarizable artifact found.",
        `Pass --app /absolute/path/to/${productName}.app and/or --dmg /absolute/path/to/${productName}.dmg,`,
        "or build one first under dist/desktop.",
      ].join("\n")
    );
  }

  const auth = buildAuthArgs();
  if (!auth) {
    fail(
      [
        "No notarization credentials configured.",
        "Set one of:",
        "- APPLE_KEYCHAIN_PROFILE (and optional APPLE_KEYCHAIN)",
        "- APPLE_API_KEY + APPLE_API_KEY_ID (+ APPLE_API_ISSUER for Team keys)",
        "- APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID",
      ].join("\n")
    );
  }

  const timeout = args.timeout || "2h";

  console.log(`Auth strategy: ${auth.label}`);

  if (appPath && fs.existsSync(appPath)) {
    notarizeApp(appPath, auth, timeout);
  }

  if (dmgPath && fs.existsSync(dmgPath)) {
    notarizeDmg(dmgPath, auth, timeout);
  }
}

main();
