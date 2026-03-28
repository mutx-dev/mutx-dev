import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import process from "node:process";
import { extname, relative, resolve } from "node:path";

const ROOT = process.cwd();
const PORT = Number.parseInt(process.env.PORT || "3000", 10) || 3000;
const HOST = process.env.HOSTNAME || "0.0.0.0";
const INTERNAL_PORT_RANGE = { min: 3200, max: 3299 };
const SERVER_ENTRY = resolve(ROOT, ".next", "standalone", "server.js");
const STANDALONE_ROOT = resolve(ROOT, ".next", "standalone");
const STATIC_ROOT = resolve(STANDALONE_ROOT, ".next", "static");
const PUBLIC_ROOT = resolve(STANDALONE_ROOT, "public");
const SERVER_START_TIMEOUT_MS = 15000;

let proxyServer = null;
let nextServerProcess = null;

function listListeners(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  if (result.status !== 0 || !result.stdout.trim()) {
    return [];
  }

  return result.stdout
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPortBusy(port) {
  return new Promise((resolveBusy) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolveBusy(true);
    });

    socket.once("error", () => {
      resolveBusy(false);
    });

    socket.setTimeout(500, () => {
      socket.destroy();
      resolveBusy(false);
    });
  });
}

async function findAvailablePort(start, end) {
  for (let port = start; port <= end; port += 1) {
    if (!(await isPortBusy(port))) {
      return port;
    }
  }

  throw new Error(`No free port found in range ${start}-${end}.`);
}

function ensureStandaloneAssets() {
  const prepareScript = resolve(ROOT, "scripts", "prepare-standalone.mjs");
  const hasStatic = existsSync(STATIC_ROOT);
  const hasPublic = existsSync(PUBLIC_ROOT);

  if ((hasStatic && hasPublic) || !existsSync(prepareScript)) {
    return;
  }

  const result = spawnSync(process.execPath, [prepareScript], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error("Could not prepare standalone assets");
  }
}

function resolveSafePath(baseDir, pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath.replace(/^\/+/, "");
  const targetPath = resolve(baseDir, relativePath);
  const pathRelative = relative(baseDir, targetPath);

  if (pathRelative.startsWith("..") || pathRelative === "") {
    return null;
  }

  return targetPath;
}

function getContentType(filePath) {
  switch (extname(filePath)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".gif":
      return "image/gif";
    case ".ico":
      return "image/x-icon";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".map":
      return "application/json; charset=utf-8";
    case ".mp4":
      return "video/mp4";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".webm":
      return "video/webm";
    case ".webp":
      return "image/webp";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

function writeStaticHeaders(response, filePath, fileStat, cacheControl) {
  response.writeHead(200, {
    "Cache-Control": cacheControl,
    "Content-Length": String(fileStat.size),
    "Content-Type": getContentType(filePath),
  });
}

function tryServeStaticAsset(request, response) {
  const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
  let filePath = null;
  let cacheControl = "public, max-age=31536000, immutable";

  if (requestUrl.pathname.startsWith("/_next/static/")) {
    filePath = resolveSafePath(
      STATIC_ROOT,
      requestUrl.pathname.replace(/^\/_next\/static\/+/, ""),
    );
  } else if (!requestUrl.pathname.startsWith("/_next/")) {
    filePath = resolveSafePath(PUBLIC_ROOT, requestUrl.pathname);
    cacheControl = "public, max-age=3600";
  }

  if (!filePath || !existsSync(filePath)) {
    return false;
  }

  const fileStat = statSync(filePath);
  if (!fileStat.isFile()) {
    return false;
  }

  writeStaticHeaders(response, filePath, fileStat, cacheControl);

  if (request.method === "HEAD") {
    response.end();
    return true;
  }

  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    response.end("Failed to read static asset");
  });
  stream.pipe(response);
  return true;
}

function proxyToNext(request, response, internalPort) {
  return new Promise((resolveProxy) => {
    const proxyRequest = http.request(
      {
        host: "127.0.0.1",
        port: internalPort,
        path: request.url,
        method: request.method,
        headers: request.headers,
      },
      (proxyResponse) => {
        response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
        proxyResponse.pipe(response);
        proxyResponse.on("end", resolveProxy);
      },
    );

    proxyRequest.on("error", (error) => {
      response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(`Standalone proxy failed: ${error.message}`);
      resolveProxy();
    });

    request.pipe(proxyRequest);
  });
}

function waitForServer(url, childProcess, timeoutMs = SERVER_START_TIMEOUT_MS) {
  const startedAt = Date.now();

  return new Promise((resolveReady, rejectReady) => {
    let settled = false;

    const cleanup = () => {
      childProcess.removeListener("error", handleError);
      childProcess.removeListener("exit", handleExit);
    };

    const settle = (callback, value) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback(value);
    };

    const handleError = (error) => {
      settle(rejectReady, error);
    };

    const handleExit = (code, signal) => {
      settle(
        rejectReady,
        new Error(`Standalone Next server exited before ready (code=${code}, signal=${signal || "none"})`),
      );
    };

    childProcess.once("error", handleError);
    childProcess.once("exit", handleExit);

    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        settle(resolveReady);
      });

      req.on("error", () => {
        if (Date.now() - startedAt >= timeoutMs) {
          settle(rejectReady, new Error(`Standalone Next server did not start in time: ${url}`));
          return;
        }
        setTimeout(check, 250);
      });
    };

    check();
  });
}

function stopServers(exitCode = 0) {
  if (proxyServer) {
    proxyServer.close();
    proxyServer = null;
  }

  if (nextServerProcess) {
    try {
      nextServerProcess.kill("SIGTERM");
    } catch {
      // Ignore shutdown errors during exit.
    }
    nextServerProcess = null;
  }

  process.exit(exitCode);
}

async function main() {
  if (!existsSync(SERVER_ENTRY)) {
    throw new Error("Standalone build output not found. Run `npm run build` before `npm run start`.");
  }

  ensureStandaloneAssets();

  if (await isPortBusy(PORT)) {
    const listeners = listListeners(PORT);
    const detail =
      listeners.length > 0
        ? `\n${listeners.join("\n")}`
        : "\nA process is already accepting connections on that port.";

    throw new Error(`Refusing to start because port ${PORT} is already in use.${detail}`);
  }

  const internalPort = await findAvailablePort(INTERNAL_PORT_RANGE.min, INTERNAL_PORT_RANGE.max);
  const nextServerUrl = `http://127.0.0.1:${internalPort}`;

  nextServerProcess = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(internalPort),
      HOSTNAME: "127.0.0.1",
    },
  });

  await waitForServer(`${nextServerUrl}/dashboard`, nextServerProcess);

  proxyServer = http.createServer(async (request, response) => {
    if (tryServeStaticAsset(request, response)) {
      return;
    }

    await proxyToNext(request, response, internalPort);
  });

  nextServerProcess.on("exit", (code, signal) => {
    if (proxyServer) {
      proxyServer.close();
      proxyServer = null;
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  proxyServer.listen(PORT, HOST, () => {
    console.log(
      `[start-standalone] Listening on http://127.0.0.1:${PORT} (proxying Next on ${nextServerUrl})`,
    );
  });
}

process.on("SIGINT", () => stopServers(0));
process.on("SIGTERM", () => stopServers(0));

main().catch((error) => {
  console.error("[start-standalone] Failed to launch standalone server:", error);
  stopServers(1);
});
