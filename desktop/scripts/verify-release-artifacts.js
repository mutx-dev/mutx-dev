const {
  getReleaseArtifacts,
  verifyAppArtifact,
  verifyDmgArtifact,
  verifyZipArtifact,
} = require("./release-artifact-utils");

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function main() {
  const artifacts = getReleaseArtifacts();
  const failures = [];

  for (const artifact of artifacts) {
    const checks = [
      {
        label: `${artifact.arch} app`,
        path: artifact.appPath,
        verify: () => verifyAppArtifact(artifact.appPath, `${artifact.arch} app`),
      },
      {
        label: `${artifact.arch} zip`,
        path: artifact.zipPath,
        verify: () => verifyZipArtifact(artifact.zipPath),
      },
      {
        label: `${artifact.arch} dmg`,
        path: artifact.dmgPath,
        verify: () => verifyDmgArtifact(artifact.dmgPath),
      },
    ];

    checks.forEach((check) => {
      try {
        check.verify();
        console.log(`OK   ${check.label}  ${check.path}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`FAIL ${check.label}  ${check.path}\n${message}`);
      }
    });
  }

  if (failures.length > 0) {
    fail(failures.join("\n\n"));
  }

  console.log("All current release desktop artifacts passed integrity verification.");
}

main();
