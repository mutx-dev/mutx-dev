const fs = require("fs");
const { execSync } = require("child_process");

function readEnv(name) {
  return process.env[name] && process.env[name].trim().length > 0
    ? process.env[name].trim()
    : null;
}

function printOk(message) {
  console.log(`[ok] ${message}`);
}

function printWarn(message) {
  console.log(`[warn] ${message}`);
}

function printFail(message) {
  console.log(`[fail] ${message}`);
}

function checkNotaryCredentials() {
  const keychainProfile = readEnv("APPLE_KEYCHAIN_PROFILE");
  const keychain = readEnv("APPLE_KEYCHAIN");

  if (keychainProfile) {
    printOk(`APPLE_KEYCHAIN_PROFILE is set (${keychainProfile})`);
    if (keychain) {
      printOk(`APPLE_KEYCHAIN is set (${keychain})`);
    } else {
      printWarn("APPLE_KEYCHAIN is not set (default login keychain will be used)");
    }
    return true;
  }

  const apiKeyPath = readEnv("APPLE_API_KEY");
  const keyId = readEnv("APPLE_API_KEY_ID");
  const issuer = readEnv("APPLE_API_ISSUER");
  const teamId = readEnv("APPLE_TEAM_ID");
  const appleId = readEnv("APPLE_ID");
  const applePassword = readEnv("APPLE_APP_SPECIFIC_PASSWORD");

  if (apiKeyPath || keyId || issuer) {
    let success = true;

    if (!apiKeyPath) {
      printFail("APPLE_API_KEY is not set");
      success = false;
    } else if (!fs.existsSync(apiKeyPath)) {
      printFail(`APPLE_API_KEY file not found: ${apiKeyPath}`);
      success = false;
    } else {
      printOk(`APPLE_API_KEY found at ${apiKeyPath}`);
    }

    if (!keyId) {
      printFail("APPLE_API_KEY_ID is not set");
      success = false;
    } else {
      printOk(`APPLE_API_KEY_ID is set (${keyId})`);
    }

    if (!issuer) {
      printWarn("APPLE_API_ISSUER is not set (valid for Individual API keys on Xcode 26+)");
    } else {
      printOk(`APPLE_API_ISSUER is set (${issuer})`);
    }

    if (!teamId) {
      printWarn("APPLE_TEAM_ID is not set (optional for API key flow)");
    } else {
      printOk(`APPLE_TEAM_ID is set (${teamId})`);
    }

    return success;
  }

  if (appleId || applePassword || teamId) {
    let success = true;

    if (!appleId) {
      printFail("APPLE_ID is not set");
      success = false;
    } else {
      printOk(`APPLE_ID is set (${appleId})`);
    }

    if (!applePassword) {
      printFail("APPLE_APP_SPECIFIC_PASSWORD is not set");
      success = false;
    } else {
      printOk("APPLE_APP_SPECIFIC_PASSWORD is set");
    }

    if (!teamId) {
      printFail("APPLE_TEAM_ID is not set");
      success = false;
    } else {
      printOk(`APPLE_TEAM_ID is set (${teamId})`);
    }

    return success;
  }

  printFail("No notarization credentials configured");
  printWarn("Set APPLE_KEYCHAIN_PROFILE, or APPLE_API_KEY/APPLE_API_KEY_ID, or APPLE_ID/APPLE_APP_SPECIFIC_PASSWORD/APPLE_TEAM_ID");
  return false;
}

function checkDeveloperIdCertificate() {
  try {
    const output = execSync(
      'security find-identity -v -p codesigning',
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );

    if (output.includes("Developer ID Application")) {
      printOk("Developer ID Application certificate found in keychain");
      return true;
    }

    printFail("No Developer ID Application certificate found in keychain");
    return false;
  } catch {
    printFail("Could not inspect macOS keychain for signing identities");
    return false;
  }
}

function checkXcodeTools() {
  try {
    const output = execSync("xcrun notarytool --version", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    printOk(`notarytool available (${output})`);
    return true;
  } catch {
    printFail("xcrun notarytool not available; install Xcode command line tools");
    return false;
  }
}

function main() {
  console.log("Checking MUTX Apple signing environment...\n");

  const checks = [
    checkNotaryCredentials(),
    checkDeveloperIdCertificate(),
    checkXcodeTools(),
  ];

  const passed = checks.every(Boolean);

  console.log("");
  if (passed) {
    console.log("Apple signing environment looks ready.");
    process.exit(0);
  }

  console.log("Apple signing environment is not ready yet.");
  process.exit(1);
}

main();
