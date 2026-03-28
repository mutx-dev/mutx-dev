const { notarize } = require("@electron/notarize");

function readEnv(name) {
  return process.env[name] && process.env[name].trim().length > 0
    ? process.env[name].trim()
    : null;
}

function getAuthConfig() {
  const keychainProfile = readEnv("APPLE_KEYCHAIN_PROFILE");
  const keychain = readEnv("APPLE_KEYCHAIN");

  if (keychainProfile) {
    return {
      label: `keychain profile ${keychainProfile}`,
      options: {
        keychainProfile,
        ...(keychain ? { keychain } : {}),
      },
    };
  }

  const appleApiKey = readEnv("APPLE_API_KEY");
  const appleApiKeyId = readEnv("APPLE_API_KEY_ID");
  const appleApiIssuer = readEnv("APPLE_API_ISSUER");

  if (appleApiKey && appleApiKeyId) {
    return {
      label: appleApiIssuer ? "App Store Connect API key" : "individual App Store Connect API key",
      options: {
        appleApiKey,
        appleApiKeyId,
        ...(appleApiIssuer ? { appleApiIssuer } : {}),
      },
    };
  }

  const appleId = readEnv("APPLE_ID");
  const appleIdPassword = readEnv("APPLE_APP_SPECIFIC_PASSWORD");
  const teamId = readEnv("APPLE_TEAM_ID");

  if (appleId && appleIdPassword && teamId) {
    return {
      label: "Apple ID credentials",
      options: {
        appleId,
        appleIdPassword,
        teamId,
      },
    };
  }

  return null;
}

module.exports = async (context) => {
  const { electronPlatformName, appOutDir, packager } = context;

  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;
  const auth = getAuthConfig();

  if (!auth) {
    console.log("[notarize] Skipping notarization: Apple notarization credentials are not configured.");
    console.log("[notarize] Configure either:");
    console.log("[notarize] - APPLE_KEYCHAIN_PROFILE (and optional APPLE_KEYCHAIN)");
    console.log("[notarize] - APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER (recommended)");
    console.log("[notarize] - APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID");
    return;
  }

  console.log(`[notarize] Starting notarization for ${appPath}`);
  console.log(`[notarize] appBundleId=${packager.appInfo.id}`);
  console.log(`[notarize] appOutDir=${appOutDir}`);
  console.log(`[notarize] auth=${auth.label}`);

  const startedAt = Date.now();

  try {
    await notarize({
      appBundleId: packager.appInfo.id,
      appPath,
      ...auth.options,
    });
    const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
    console.log(`[notarize] Completed in ${elapsedSeconds}s using ${auth.label}`);
  } catch (error) {
    console.error(`[notarize] Failed for ${appPath}`);
    console.error(error && error.stack ? error.stack : error);
    throw error;
  }
};
