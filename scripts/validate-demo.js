#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');
const { URL } = require('url');

let DEMO_PORT = 3000;
const DEMO_HOST = 'localhost';
const STARTUP_TIMEOUT = 90000;
const CHECK_INTERVAL = 2000;

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

async function waitForServer(host, port, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await get(`http://${host}:${port}`);
      return true;
    } catch {
      await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }
  }
  return false;
}

async function validateRoute(path, expectedStatus = 200) {
  const url = new URL(path, `http://${DEMO_HOST}:${DEMO_PORT}`);
  console.log(`  Validating ${path}...`);
  const res = await get(url);
  if (res.status !== expectedStatus) {
    throw new Error(`${path} returned ${res.status}, expected ${expectedStatus}`);
  }
  console.log(`  ✓ ${path} -> ${res.status}`);
  return true;
}

async function main() {
  console.log('MUTX Demo Validation');
  console.log('=====================\n');

  let devServer = null;
  let detectedPort = null;

  try {
    console.log('Starting Next.js dev server...');
    devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: true,
      env: { ...process.env }
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

    console.log(`Waiting for server...`);
    
    const start = Date.now();
    while (!detectedPort && Date.now() - start < STARTUP_TIMEOUT) {
      await new Promise(r => setTimeout(r, 500));
    }

    if (!detectedPort) {
      detectedPort = 3000;
      const ready = await waitForServer(DEMO_HOST, detectedPort, 5000);
      if (!ready) {
        throw new Error(`Server did not start within ${STARTUP_TIMEOUT}ms`);
      }
    } else {
      DEMO_PORT = detectedPort;
    }

    console.log(`Server ready on port ${DEMO_PORT}. Validating demo routes...\n`);

    await validateRoute('/', 200);
    await validateRoute('/app', 200);
    await validateRoute('/contact', 200);
    await validateRoute('/privacy-policy', 200);

    console.log('\n=====================');
    console.log('✓ Demo validation passed');
    console.log('=====================\n');
    console.log(`Demo available at: http://${DEMO_HOST}:${DEMO_PORT}`);
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
