import { test, expect, type Page } from '@playwright/test';
import { marketingHomepage } from '../lib/marketingContent';

async function expectLoaderStageCentered(page: Page, viewportLabel: string) {
  await page.waitForFunction(() => {
    const state = document.documentElement.dataset.loaderState;
    return (
      (state === 'active' || state === 'handoff') &&
      Boolean(document.querySelector('[data-testid="marketing-loader-stage"]'))
    );
  }, { timeout: 5000 });

  const alignmentSamples = await page.evaluate(async () => {
    const samples: Array<{ deltaX: number; deltaY: number }> = [];

    for (let index = 0; index < 6; index += 1) {
      const stage = document.querySelector<HTMLElement>('[data-testid="marketing-loader-stage"]');

      if (stage) {
        const rect = stage.getBoundingClientRect();
        samples.push({
          deltaX: Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
          deltaY: Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2),
        });
      }

      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));
    }

    return samples;
  });

  expect(alignmentSamples.length, `${viewportLabel} loader stage never rendered`).toBeGreaterThan(0);
  expect(
    alignmentSamples.every((sample) => sample.deltaX <= 4 && sample.deltaY <= 4),
    `${viewportLabel} loader stage drifted off center: ${JSON.stringify(alignmentSamples)}`
  ).toBe(true);
}

async function expectRouteSurfaceSplit(page: Page) {
  const dark = page.locator('[data-route-surface="dark"]').first();
  const light = page.locator('[data-route-surface="light"]').first();

  await expect(dark).toBeVisible();
  await expect(light).toBeVisible();

  const metrics = await page.evaluate(() => {
    const darkSurface = document.querySelector('[data-route-surface="dark"]');
    const lightSurface = document.querySelector('[data-route-surface="light"]');
    const heading = document.querySelector('main h1');

    const darkRect = darkSurface?.getBoundingClientRect();
    const lightRect = lightSurface?.getBoundingClientRect();
    const headingRect = heading?.getBoundingClientRect();
    const seamY = lightRect?.top ?? 0;

    const crossingPanel = Array.from(
      document.querySelectorAll('[class*="panel"], [data-testid="contact-lead-form"]')
    ).some((node) => {
      const rect = node.getBoundingClientRect();
      return rect.top < seamY - 1 && rect.bottom > seamY + 1;
    });

    return {
      darkBottom: darkRect?.bottom ?? 0,
      lightTop: lightRect?.top ?? 0,
      headingInsideDark: Boolean(
        darkRect &&
          headingRect &&
          headingRect.top >= darkRect.top - 1 &&
          headingRect.bottom <= darkRect.bottom + 1
      ),
      crossingPanel,
    };
  });

  expect(metrics.lightTop).toBeGreaterThanOrEqual(metrics.darkBottom - 1);
  expect(metrics.headingInsideDark).toBe(true);
  expect(metrics.crossingPanel).toBe(false);
}

test.describe('mutx.dev QA', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.turnstile={render:(el,opts)=>{setTimeout(()=>opts?.callback?.("ci-test-token"),0);return "widget-id";},reset:()=>{},remove:()=>{}};',
      });
    });

    await page.route('**/_next/image**', async (route) => {
      const url = new URL(route.request().url());
      const originalUrl = url.searchParams.get('url');

      if (!originalUrl || originalUrl.includes('/logo.png')) {
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8nWsAAAAASUVORK5CYII=',
            'base64'
          ),
        });
        return;
      }

      await route.fallback();
    });

    await page.route('**/api/newsletter', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count: 612 }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: "You're on the list. Check your inbox.",
          emailSent: true,
        }),
      });
    });

    await page.route('https://calendly.com/assets/external/widget.css', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/css',
        body: '',
      });
    });

    await page.route('https://calendly.com/assets/external/widget.js', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.Calendly={initPopupWidget:()=>{},closePopupWidget:()=>{}};',
      });
    });
  });

  test('homepage hides copy behind the loader, lands the mark cleanly, and skips the cinematic replay in-session', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('public-auth-nav')).toHaveCount(0);
    await expect(page.getByText(/^Loading\.\.\.$/i)).toHaveCount(0);

    const html = page.locator('html');
    const loader = page.getByTestId('marketing-loader');
    await page.waitForFunction(() => {
      const state = document.documentElement.dataset.loaderState;
      return state === 'active' || state === 'handoff';
    }, { timeout: 5000 });
    await expect(loader).toBeVisible({ timeout: 5000 });
    await expectLoaderStageCentered(page, 'desktop');
    await expect(page.locator('[data-testid="marketing-loader"] video')).toHaveAttribute('poster', /mutx-logo-loader-poster\.webp/i);

    await expect
      .poll(async () => {
        return page.getByTestId('homepage-lockup-copy').evaluate((node) => {
          return Number.parseFloat(getComputedStyle(node).opacity);
        });
      })
      .toBeLessThan(0.1);
    await expect
      .poll(async () => {
        return page.getByTestId('homepage-hero-content').evaluate((node) => {
          return Number.parseFloat(getComputedStyle(node).opacity);
        });
      })
      .toBeLessThan(0.1);

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const stage = document.querySelector('[data-testid="marketing-loader-stage"]');
          return stage ? Number.parseFloat(getComputedStyle(stage).opacity || '1') : 0;
        });
      })
      .toBeGreaterThan(0.95);

    const visibilitySamples = await page.evaluate(async () => {
      const samples = [];

      for (let index = 0; index < 16; index += 1) {
        const stage = document.querySelector('[data-testid="marketing-loader-stage"]');
        const video = document.querySelector('[data-testid="marketing-loader"] video');
        const heroMark = document.querySelector('[data-testid="homepage-lockup-mark"]');
        const heroContent = document.querySelector('[data-testid="homepage-hero-content"]');
        const html = document.documentElement;
        const stageOpacity = stage ? Number.parseFloat(getComputedStyle(stage).opacity || '1') : 0;
        const videoOpacity = video ? Number.parseFloat(getComputedStyle(video).opacity || '1') : 0;
        const heroMarkOpacity = heroMark ? Number.parseFloat(getComputedStyle(heroMark).opacity || '1') : 0;
        const heroContentOpacity = heroContent
          ? Number.parseFloat(getComputedStyle(heroContent).opacity || '1')
          : 1;

        samples.push({
          state: html.dataset.loaderState || null,
          stageVisible: stageOpacity > 0.15,
          videoVisible: videoOpacity > 0.15,
          heroMarkVisible: heroMarkOpacity > 0.08,
          heroContentHidden: heroContentOpacity < 0.08,
        });

        await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));
      }

      return samples;
    });

    const beforeCompleteSamples = visibilitySamples.filter((sample) => sample.state !== 'complete');

    expect(beforeCompleteSamples.length).toBeGreaterThan(0);
    expect(beforeCompleteSamples.every((sample) => sample.stageVisible)).toBe(true);
    expect(beforeCompleteSamples.every((sample) => sample.videoVisible)).toBe(true);
    expect(beforeCompleteSamples.every((sample) => sample.heroContentHidden)).toBe(true);

    await expect(loader).toBeHidden({ timeout: 9000 });
    await expect(html).toHaveAttribute('data-loader-state', 'complete');

    await expect(page.getByTestId('homepage-lockup')).toBeVisible();
    await expect(page.getByTestId('homepage-lockup-mark')).toBeVisible();
    await expect(page.getByRole('heading', { name: /see it\. control it\. prove it\./i })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText(/your ai agents are already working/i)
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /choose a build/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^releases$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^docs$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^github$/i }).first()).toBeVisible();
    await expect(page.getByTestId('homepage-hero-proof-line')).toHaveCount(0);
    await expect(page.getByLabel(/hero proof points/i)).toHaveCount(0);
    await expect(page.getByLabel(/platform feature slides/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /read the platform model/i })).toHaveCount(0);

    const wordOpacityAfter = await page.getByTestId('homepage-lockup-word').evaluate((node) => {
      return Number.parseFloat(getComputedStyle(node).opacity);
    });
    const metaOpacityAfter = await page.getByTestId('homepage-lockup-meta').evaluate((node) => {
      return Number.parseFloat(getComputedStyle(node).opacity);
    });
    const heroActions = await page
      .locator('main section')
      .first()
      .getByRole('link')
      .evaluateAll((links) =>
        links.slice(0, 3).map((link) => link.textContent?.replace(/\s+/g, ' ').trim())
      );
    const strayLargeLogos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img[src='/logo.png']")).filter((node) => {
        const image = node as HTMLImageElement;
        const rect = image.getBoundingClientRect();
        const style = getComputedStyle(image);
        return rect.width > 120 && Number.parseFloat(style.opacity || '1') > 0.1;
      }).length;
    });

    expect(wordOpacityAfter).toBeGreaterThan(0.95);
    expect(metaOpacityAfter).toBeGreaterThan(0.95);
    await expect
      .poll(async () => {
        return page.getByTestId('homepage-hero-content').evaluate((node) => {
          return Number.parseFloat(getComputedStyle(node).opacity);
        });
      })
      .toBeGreaterThan(0.95);
    expect(heroActions).toEqual(['Download for Mac', 'Releases', 'Docs']);
    expect(strayLargeLogos).toBe(0);
    await expect(page.getByTestId('marketing-loader-stage')).toHaveCount(0);

    const desktopFold = await page.evaluate(() => {
      const hero = document.querySelector('main section');
      const proof = document.querySelector('[data-testid="homepage-proof-strip"]');
      const heroRect = hero?.getBoundingClientRect();
      const proofRect = proof?.getBoundingClientRect();

      return {
        heroHeight: heroRect?.height ?? 0,
        viewportHeight: window.innerHeight,
        proofTop: proofRect?.top ?? 0,
      };
    });

    expect(desktopFold.heroHeight).toBeGreaterThanOrEqual(desktopFold.viewportHeight - 1);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(loader).toBeHidden({ timeout: 2000 });
    await expect(html).toHaveAttribute('data-loader-state', 'complete', { timeout: 2000 });
  });

  test('landing page exposes the current production sections and final CTA only', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('marketing-loader')).toBeHidden({ timeout: 9000 });

    const visibleHeadings = await page.locator('h2').evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() ?? '').filter(Boolean)
    );

    expect(visibleHeadings.length).toBeGreaterThanOrEqual(3);
    expect(visibleHeadings.some((heading) => /see it for yourself/i.test(heading))).toBe(true);
    await expect(page.getByText(/^OPEN CONTROL\. SHIP CLEANLY\.$/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /next slide/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /close details/i })).toHaveCount(0);
    await expect(page.getByText(/the operator surface already ships\./i)).toHaveCount(0);

  });

  test('homepage settles cleanly on mobile after the loader handoff', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => {
      return Boolean(document.documentElement.dataset.loaderState);
    }, { timeout: 5000 });
    await expectLoaderStageCentered(page, 'mobile');
    await expect(page.getByTestId('marketing-loader')).toBeHidden({ timeout: 9000 });
    await expect(page.locator('html')).toHaveAttribute('data-loader-state', 'complete');

    const mobileMetrics = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      const headingRect = heading?.getBoundingClientRect();
      const word = document.querySelector('[data-testid="homepage-lockup-word"]');
      const proof = document.querySelector('[data-testid="homepage-proof-strip"]');
      const proofRect = proof?.getBoundingClientRect();

      return {
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        headingLeft: headingRect?.left ?? 0,
        headingRight: headingRect?.right ?? 0,
        wordOpacity: word ? Number.parseFloat(getComputedStyle(word).opacity) : 0,
        proofTop: proofRect?.top ?? 0,
      };
    });

    expect(mobileMetrics.bodyWidth).toBeLessThanOrEqual(mobileMetrics.viewportWidth);
    expect(mobileMetrics.headingLeft).toBeGreaterThanOrEqual(-1);
    expect(mobileMetrics.headingRight).toBeLessThanOrEqual(mobileMetrics.viewportWidth + 1);
    expect(mobileMetrics.wordOpacity).toBeGreaterThan(0.95);

    await expect(page.getByRole('link', { name: /choose a build/i }).first()).toBeVisible();
  });

  test('homepage scrolls after the loader settles', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      return (
        document.documentElement.dataset.loaderState === 'complete' &&
        document.documentElement.scrollHeight > window.innerHeight
      );
    }, { timeout: 9000 });

    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(320, 320);
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(350);
    const after = await page.evaluate(() => window.scrollY);

    expect(before).toBe(0);
    expect(after).toBeGreaterThan(0);
  });

  test('homepage still assets stay single-use in the content model', async () => {
    const stillAssets = [
      marketingHomepage.hero.backgroundSrc,
      marketingHomepage.salesSections.demo.tabs[2]?.mediaSrc,
    ];

    expect(new Set(stillAssets).size).toBe(stillAssets.length);
  });

  test('download page exposes the mac release lane and release-notes path', async ({ page }) => {
    await page.goto('/download/macos', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('public-auth-nav')).toBeVisible();
    await expect(page.getByTestId('public-auth-nav').getByRole('link')).toHaveCount(5);
    await expect(
      page.getByRole('heading', { name: /download mutx for macos\./i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /download for apple silicon/i })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /download for intel mac/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Release summary', exact: true }).first()).toBeVisible();
    await expect(
      page.getByText(
        /downloads, notes, and checksums stay in one public lane\./i
      )
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Release summary$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Docs notes$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Checksums$/i })).toBeVisible();
  });

  test('releases page exposes the current release summary and artifact links', async ({ page }) => {
    await page.goto('/releases', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('public-auth-nav')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /signed desktop release\./i })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /open mac downloads/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Apple Silicon DMG$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Intel Mac DMG$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Checksums$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Docs notes$/i })).toBeVisible();
    await expect(
      page.getByText(
        /current signed mac release, checksums, docs notes, and github tag\./i
      )
    ).toBeVisible();
  });

  test('contact, privacy, login, register, forgot-password, and reset-password routes keep working under the new shell', async ({
    page,
  }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByTestId('public-auth-nav')).toBeVisible();
    await expect(page.getByTestId('public-auth-nav').getByRole('link')).toHaveCount(5);
    await expect(
      page.getByRole('heading', { name: /talk to mutx\./i })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /book a call/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /email mutx/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send inquiry/i })).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByTestId('contact-lead-form')).toBeVisible();
    await expect(page.getByText(/bring the real workflow/i)).toHaveCount(0);
    await expect(page.getByText(/send a structured inquiry/i)).toHaveCount(0);
    await expect(page.getByText(/what to include/i)).toHaveCount(0);
    await expect(page.getByText(/make the first message useful\./i)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /^Email$/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /^Docs$/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /^Quickstart$/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /^GitHub$/i })).toHaveCount(0);
    await expect(page.getByText(/back to mutx\.dev/i)).toHaveCount(0);

    await page.goto('/privacy-policy', { waitUntil: 'domcontentloaded' });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
    await expect(page.getByText(/effective date: march 13, 2026/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /information we collect/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^security$/i })).toBeVisible();

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();

    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByText(/send reset instructions/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();

    await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByText(/invalid reset link/i)).toBeVisible();

    await page.goto('/reset-password?token=test-token', { waitUntil: 'domcontentloaded' });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByText(/choose a new password/i)).toBeVisible();
    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /reset password/i })).toBeVisible();
  });

  test('no console errors or remote Guild asset requests', async ({ page }) => {
    const errors: string[] = [];
    const requestUrls: string[] = [];
    const ignoredErrorPatterns = [
      /favicon\.ico/i,
      /favicon/i,
      /Failed to load resource: the server responded with a status of 503 \(Service Unavailable\)/i,
      /Image corrupt or truncated/i,
      /downloadable font: STAT: Invalid nameID: 17 .*Doto/i,
      /downloadable font: Table discarded .*Doto/i,
    ];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('request', (request) => {
      requestUrls.push(request.url());
    });

    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().includes('/api/turnstile/site-key')) {
        console.log('HTTP_ERROR', response.status(), response.url());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (error) => !ignoredErrorPatterns.some((pattern) => pattern.test(error))
    );

    expect(criticalErrors, 'Console errors: ' + criticalErrors.join('; ')).toHaveLength(0);
    expect(
      requestUrls.filter((url) => /guild\.ai|cdn\.prod\.website-files\.com/i.test(url)),
      'Unexpected remote Guild asset requests'
    ).toHaveLength(0);
    expect(
      requestUrls.filter((url) => /marketing\/loader\/mutx-logo-loader-fast\.webm/i.test(url)),
      'Unexpected stale loader asset requests'
    ).toHaveLength(0);
  });
});
