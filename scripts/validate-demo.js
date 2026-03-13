#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');
const { URL } = require('url');

const DEMO_HOST = process.env.DEMO_HOST || 'localhost';
let DEMO_PORT = Number(process.env.DEMO_PORT || process.env.PORT || '3000');
const API_BASE_URL = process.env.DEMO_API_URL || process.env.DEMO_API_BASE || 'http://localhost:8000';
const STARTUP_TIMEOUT = Number(process.env.DEMO_STARTUP_TIMEOUT || '90000');
const CHECK_INTERVAL = Number(process.env.DEMO_CHECK_INTERVAL || '2000');
const USE_EXISTING_FRONTEND = process.env.DEMO_SKIP_START === '1' || process.env.DEMO_USE_EXISTING_FRONTEND === '1';
const CHECK_API = process.env.DEMO_CHECK_API !== '0';

function formatApiUrl(path) {
  const base = API_BASE_URL.replace(/\/$/, '');
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${base}${path}`;
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function waitForServer(url, timeout, label = 'server') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await get(url);
      return true;
    } catch {
      await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }
  }
  throw new Error(`${label} did not become ready within ${timeout}ms`);
}

async function validateRoute(pathOrUrl, expectedStatus = 200) {
  const url = /^https?:\/\//.test(pathOrUrl)
    ? pathOrUrl
    : `http://${DEMO_HOST}:${DEMO_PORT}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;

  console.log(`  Validating ${new URL(url).pathname} at ${url}...`);
  const res = await get(url);
  if (res.status !== expectedStatus) {
    throw new Error(`${url} returned ${res.status}, expected ${expectedStatus}`);
  }
  console.log(`  ✓ ${new URL(url).pathname} -> ${res.status}`);
  return true;
}

async function main() {
  console.log('MUTX Demo Validation');
  console.log('=====================\n');

  let devServer = null;
  let detectedPort = null;

  try {
    if (USE_EXISTING_FRONTEND) {
      console.log('Using existing frontend server from environment.');
      const candidate = `http://${DEMO_HOST}:${DEMO_PORT}`;
      await waitForServer(candidate, STARTUP_TIMEOUT, `Frontend on ${candidate}`);
    } else {
      console.log('Starting Next.js dev server...');
      devServer = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        detached: true,
        env: { ...process.env },
        cwd: process.cwd(),
      });

      devServer.stdout.on('data', (data) => {
        const output = data.toString();
        const portMatch = output.match(/localhost:(\d+)/);
        if (portMatch) {
          detectedPort = parseInt(portMatch[1], 10);
        }
      });

      devServer.stderr.on('data', (data) => {
        const output = data.toString();
        const portMatch = output.match(/localhost:(\d+)/);
        if (portMatch) {
          detectedPort = parseInt(portMatch[1], 10);
        }
      });

      console.log('Waiting for server...');

      const start = Date.now();
      while (!detectedPort && Date.now() - start < STARTUP_TIMEOUT) {
        await new Promise(r => setTimeout(r, 500));
      }

      if (!detectedPort) {
        detectedPort = DEMO_PORT;
        await waitForServer(`http://${DEMO_HOST}:${DEMO_PORT}`, 5000, `Frontend on ${DEMO_HOST}:${DEMO_PORT}`);
      } else {
        DEMO_PORT = detectedPort;
      }
    }

    const frontendBase = `http://${DEMO_HOST}:${DEMO_PORT}`;
    console.log(`Server ready on ${frontendBase}. Validating demo routes...\n`);

    if (CHECK_API) {
      await validateRoute(formatApiUrl('/health'));
      await validateRoute(formatApiUrl('/ready'));
    }

    await validateRoute('/');
    await validateRoute('/app');
    await validateRoute('/contact');
    await validateRoute('/privacy-policy');

    console.log('\n=====================');
    console.log('✓ Demo validation passed');
    console.log('=====================\n');
    console.log(`Demo available at: ${frontendBase}`);
    console.log('  - Homepage: /');
    console.log('  - App shell: /app');
    return 0;
  } catch (err) {
    console.error('\n=====================');
    console.error('✗ Demo validation failed');
    console.error('=====================');
    console.error(err.message);
    return 1;
  } finally {
    if (devServer) {
      try {
        process.kill(-devServer.pid, 'SIGTERM');
      } catch {
        try {
          process.kill(devServer.pid, 'SIGTERM');
        } catch {}
      }
    }
  }
}

main().then(code => process.exit(code)).catch(err => {
  console.error(err);
  process.exit(1);
});
