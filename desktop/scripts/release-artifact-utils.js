const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const packageJson = require("../../package.json");

const productName = packageJson.build?.productName || packageJson.name;
const currentVersion = packageJson.version;
const distDir = path.resolve(__dirname, "../../dist/desktop");
const checksumPath = path.join(distDir, `${productName}-${currentVersion}-SHA256SUMS.txt`);

const archDefinitions = {
  arm64: {
    arch: "arm64",
    appDir: "mac-arm64",
  },
  x64: {
    arch: "x64",
    appDir: "mac",
  },
};

function buildArtifactName(arch, ext) {
  return `${productName}-${currentVersion}-macos-${arch}.${ext}`;
}

function ensureArch(arch) {
  if (!archDefinitions[arch]) {
    throw new Error(`Unsupported desktop arch: ${arch}`);
  }
}

function getArchArtifacts(arch) {
  ensureArch(arch);
  const definition = archDefinitions[arch];

  return {
    arch,
    appPath: path.join(distDir, definition.appDir, `${productName}.app`),
    zipPath: path.join(distDir, buildArtifactName(arch, "zip")),
    zipBlockmapPath: path.join(distDir, `${buildArtifactName(arch, "zip")}.blockmap`),
    dmgPath: path.join(distDir, buildArtifactName(arch, "dmg")),
    dmgBlockmapPath: path.join(distDir, `${buildArtifactName(arch, "dmg")}.blockmap`),
  };
}

function getReleaseArtifacts(archs = Object.keys(archDefinitions)) {
  return archs.map((arch) => getArchArtifacts(arch));
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
}

function getOutput(result) {
  return `${result.stdout || ""}${result.stderr || ""}`.trim();
}

function ensureExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }
}

function assertCodesignVerify(appPath, label) {
  ensureExists(appPath, label);
  const result = run("codesign", ["--verify", "--deep", "--strict", "--verbose=4", appPath]);
  if (result.status !== 0) {
    throw new Error(`${label} failed recursive signature verification:\n${getOutput(result)}`);
  }
}

function withMountedDmg(dmgPath, callback) {
  ensureExists(dmgPath, `DMG ${path.basename(dmgPath)}`);

  const mountPoint = fs.mkdtempSync(path.join(os.tmpdir(), "mutx-dmg-mount-"));
  const attach = run("hdiutil", [
    "attach",
    "-noverify",
    "-nobrowse",
    "-readonly",
    "-mountpoint",
    mountPoint,
    dmgPath,
  ]);

  if (attach.status !== 0) {
    fs.rmSync(mountPoint, { recursive: true, force: true });
    throw new Error(`Failed to mount DMG ${dmgPath}:\n${getOutput(attach)}`);
  }

  let callbackError = null;
  let callbackResult;
  try {
    callbackResult = callback(mountPoint);
  } catch (error) {
    callbackError = error;
  }

  const detach = run("hdiutil", ["detach", mountPoint]);
  let detachError = null;
  if (detach.status !== 0) {
    const forceDetach = run("hdiutil", ["detach", "-force", mountPoint]);
    if (forceDetach.status !== 0) {
      detachError = new Error(`Failed to detach DMG mount ${mountPoint}:\n${getOutput(forceDetach)}`);
    }
  }

  fs.rmSync(mountPoint, { recursive: true, force: true });

  if (callbackError) {
    throw callbackError;
  }

  if (detachError) {
    throw detachError;
  }

  return callbackResult;
}

function verifyApplicationsSymlink(mountPoint) {
  const applicationsPath = path.join(mountPoint, "Applications");
  ensureExists(applicationsPath, "Applications symlink");

  const stats = fs.lstatSync(applicationsPath);
  if (!stats.isSymbolicLink()) {
    throw new Error(`DMG Applications entry is not a symlink: ${applicationsPath}`);
  }

  const target = fs.readlinkSync(applicationsPath);
  if (target !== "/Applications") {
    throw new Error(`DMG Applications symlink points to ${target}, expected /Applications`);
  }
}

function verifyAppArtifact(appPath, label = `App ${path.basename(appPath)}`) {
  assertCodesignVerify(appPath, label);
}

function verifyZipArtifact(zipPath, appName = productName) {
  ensureExists(zipPath, `ZIP ${path.basename(zipPath)}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mutx-zip-verify-"));

  try {
    const extract = run("ditto", ["-x", "-k", zipPath, tempDir]);
    if (extract.status !== 0) {
      throw new Error(`Failed to extract ZIP ${zipPath}:\n${getOutput(extract)}`);
    }

    const appPath = path.join(tempDir, `${appName}.app`);
    assertCodesignVerify(appPath, `Extracted ZIP app ${path.basename(zipPath)}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function verifyDmgArtifact(dmgPath, appName = productName) {
  withMountedDmg(dmgPath, (mountPoint) => {
    verifyApplicationsSymlink(mountPoint);
    const appPath = path.join(mountPoint, `${appName}.app`);
    assertCodesignVerify(appPath, `Mounted DMG app ${path.basename(dmgPath)}`);
  });
}

function verifyCurrentReleaseArtifacts({ archs = Object.keys(archDefinitions), includeDmgs = true } = {}) {
  const artifacts = getReleaseArtifacts(archs);

  artifacts.forEach((artifact) => {
    verifyAppArtifact(artifact.appPath, `${artifact.arch} app`);
    verifyZipArtifact(artifact.zipPath);

    if (includeDmgs) {
      verifyDmgArtifact(artifact.dmgPath);
    }
  });
}

module.exports = {
  archDefinitions,
  buildArtifactName,
  checksumPath,
  currentVersion,
  distDir,
  getArchArtifacts,
  getOutput,
  getReleaseArtifacts,
  productName,
  run,
  verifyAppArtifact,
  verifyCurrentReleaseArtifacts,
  verifyDmgArtifact,
  verifyZipArtifact,
  withMountedDmg,
};
