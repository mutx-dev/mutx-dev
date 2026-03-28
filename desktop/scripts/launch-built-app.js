const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const packageJson = require("../../package.json");

const productName = packageJson.build?.productName || packageJson.name;
const distDir = path.resolve(__dirname, "../../dist/desktop");
const timeoutMs = Number(process.env.MUTX_DESKTOP_SMOKE_TIMEOUT_MS || "120000");

function findLatestApp() {
  const hostArch = process.arch;
  const preferredDirs =
    hostArch === "arm64"
      ? ["mac-arm64", "mac"]
      : hostArch === "x64"
        ? ["mac", "mac-arm64"]
        : ["mac-arm64", "mac"];

  const candidates = preferredDirs
    .map((dir) => path.join(distDir, dir, `${productName}.app`))
    .filter((artifactPath) => fs.existsSync(artifactPath));

  if (candidates.length === 0) {
    return null;
  }

  return candidates[0];
}

function resolveExecutablePath(appPath) {
  const executablePath = path.join(appPath, "Contents", "MacOS", productName);
  if (fs.existsSync(executablePath)) {
    return executablePath;
  }

  const fallbackPath = path.join(appPath, "Contents", "MacOS", packageJson.name);
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return null;
}

async function main() {
  const appPath = findLatestApp();
  if (!appPath) {
    console.error(`No built macOS app found in ${distDir}`);
    process.exit(1);
  }

  const executablePath = resolveExecutablePath(appPath);
  if (!executablePath) {
    console.error(`Could not find executable inside ${appPath}`);
    process.exit(1);
  }

  console.log(`Launching built app smoke from ${appPath}`);

  await new Promise((resolve, reject) => {
    const child = spawn(executablePath, ["--smoke-exit-after-ready"], {
      env: {
        ...process.env,
        MUTX_DESKTOP_SMOKE: "1",
      },
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(
        new Error(
          `Built app smoke timed out after ${timeoutMs}ms\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Built app smoke failed with exit code ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    });
  });

  console.log("Built app smoke launch succeeded.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
