import { test, expect, type Page } from '@playwright/test';
import { marketingHomepage } from '../lib/marketingContent';
import { createDefaultPicoProgress } from '../lib/pico/academy';

type PicoProductStubOptions = {
  authenticated?: boolean
  isEmailVerified?: boolean
  webhookCount?: number
}

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

async function stubPicoProductApis(
  page: Page,
  {
    authenticated = true,
    isEmailVerified = true,
    webhookCount = 2,
  }: PicoProductStubOptions = {},
) {
  const progress = createDefaultPicoProgress();
  const sessionUser = {
    email: 'operator@mutx.dev',
    name: 'Pico Operator',
    role: 'ADMIN',
    is_email_verified: isEmailVerified,
  };
  let openAIConnection = {
    provider: 'openai',
    status: 'disconnected',
    source: 'none',
    connected: false,
    model: 'gpt-5-mini',
    maskedKey: null as string | null,
    message: 'No OpenAI key is connected. Tutor will use platform access if available, or fall back to grounded local synthesis.',
  };

  await page.route('**/api/auth/me', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Unauthorized',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionUser),
    });
  });

  await page.route('**/api/pico/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        authenticated
          ? { authenticated: true, user: sessionUser }
          : { authenticated: false, user: null }
      ),
    });
  });

  await page.route('**/api/webhooks', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Unauthorized',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        webhooks: Array.from({ length: webhookCount }, (_, index) => ({
          id: `wh_${index + 1}`,
          name: `Webhook ${index + 1}`,
        })),
      }),
    });
  });

  await page.route('**/api/pico/progress', async (route) => {
    const body = route.request().postData() || JSON.stringify(progress);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: route.request().method() === 'POST' ? body : JSON.stringify(progress),
    });
  });

  await page.route('**/api/pico/onboarding?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        provider: 'openclaw',
        status: 'in_progress',
        current_step: 'install',
        completed_steps: ['auth', 'provider'],
        failed_step: null,
        last_error: null,
        checklist_dismissed: false,
        assistant_name: 'Pico Starter',
        assistant_id: 'ast_123',
        workspace: 'founder-lab',
        gateway_url: 'http://localhost:4111',
        updated_at: '2026-04-12T10:15:00.000Z',
        steps: [
          { id: 'auth', title: 'Authenticate operator', completed: true },
          { id: 'provider', title: 'Select provider', completed: true },
          { id: 'install', title: 'Install runtime', completed: false },
          { id: 'onboard', title: 'Onboard gateway', completed: false },
          { id: 'track', title: 'Track local runtime', completed: false },
          { id: 'bind', title: 'Bind assistant', completed: false },
          { id: 'governance', title: 'Configure governance', completed: false },
          { id: 'deploy', title: 'Deploy starter assistant', completed: false },
          { id: 'verify', title: 'Verify local health', completed: false },
        ],
      }),
    });
  });

  await page.route('**/api/pico/runtime/openclaw', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        provider: 'openclaw',
        label: 'OpenClaw',
        status: 'healthy',
        gateway_url: 'http://localhost:4111',
        version: '0.9.2',
        binary_path: '/Users/operator/.mutx/providers/openclaw/bin/openclaw',
        config_path: '/Users/operator/.mutx/providers/openclaw/config.json',
        state_dir: '/Users/operator/.mutx/providers/openclaw/state',
        last_seen_at: '2026-04-12T10:14:00.000Z',
        last_synced_at: '2026-04-12T10:15:00.000Z',
        stale: false,
        binding_count: 1,
        bindings: [
          {
            assistant_id: 'ast_123',
            assistant_name: 'Pico Starter',
            workspace: 'founder-lab',
            model: 'gpt-5.4-mini',
          },
        ],
      }),
    });
  });

  await page.route('**/api/pico/tutor', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Run your first agent',
        summary: 'Install is done. Open the first prompt lesson and get one visible answer back.',
        answer: 'Install is done. Open the first prompt lesson and get one visible answer back.',
        confidence: 'high',
        nextActions: [
          'Open the first prompt lesson.',
          'Run one bounded prompt.',
          'Save the transcript as proof.',
        ],
        lessons: [
          {
            id: 'run-your-first-agent',
            title: 'Run your first agent',
            href: '/pico/academy/run-your-first-agent',
          },
        ],
        docs: [
          {
            label: 'Support lane',
            href: '/pico/support',
            sourcePath: 'pico/support',
          },
        ],
        recommendedLessonIds: ['run-your-first-agent'],
        escalate: false,
        structured: {
          situation: 'Hermes is installed, and the current blocker is proving one real run with a visible transcript.',
          diagnosis: 'The operator should move into the first prompt lesson instead of branching into more setup.',
          steps: [
            'Open the first prompt lesson.',
            'Run one bounded prompt.',
            'Save the transcript as proof.',
          ],
          commands: [
            {
              label: 'Save the proof artifact',
              code: 'printf "Prompt: Give me exactly 3 next steps to test this runtime locally.\\nAnswer: <paste the actual answer here>\\n" > ~/pico-first-run.txt',
              language: 'bash',
            },
          ],
          verify: ['Hermes returns one sane answer and the transcript survives after the shell closes.'],
          ifThisFails: ['Paste the exact command output or timeout instead of asking another broad question.'],
          officialLinks: [
            {
              label: 'github.com',
              href: 'https://github.com/nousresearch/hermes-agent',
              sourcePath: 'github.com',
            },
          ],
          sources: [
            {
              kind: 'lesson',
              title: 'Run your first agent',
              sourcePath: 'pico/academy/run-your-first-agent',
              href: '/pico/academy/run-your-first-agent',
              excerpt: 'Run one real prompt, get one visible answer, and save the transcript as proof.',
            },
            {
              kind: 'knowledge_pack',
              title: 'Hermes',
              sourcePath: 'knowledge/pico_ops/HERMES.md',
              excerpt: 'Hermes is the default recommendation when the user wants a persistent agent that improves over time.',
            },
          ],
          nextQuestion: null,
        },
        intent: 'install',
        skillLevel: 'intermediate',
        usedOfficialFallback: false,
      }),
    });
  });

  await page.route('**/api/pico/tutor/openai', async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Unauthorized',
        }),
      });
      return;
    }

    if (route.request().method() === 'PUT') {
      const payload = JSON.parse(route.request().postData() || '{}');
      const apiKey = typeof payload.apiKey === 'string' ? payload.apiKey : '';
      openAIConnection = {
        provider: 'openai',
        status: 'connected',
        source: 'user',
        connected: true,
        model: 'gpt-5-mini',
        maskedKey: apiKey ? `••••${apiKey.slice(-4)}` : '••••test',
        message: `Your OpenAI key ${apiKey ? `••••${apiKey.slice(-4)}` : '••••test'} is active for live tutor answers.`,
      };
    } else if (route.request().method() === 'DELETE') {
      openAIConnection = {
        provider: 'openai',
        status: 'disconnected',
        source: 'none',
        connected: false,
        model: 'gpt-5-mini',
        maskedKey: null,
        message: 'No OpenAI key is connected. Tutor will use platform access if available, or fall back to grounded local synthesis.',
      };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(openAIConnection),
    });
  });

  await page.route('**/api/dashboard/runs?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
      }),
    });
  });

  await page.route('**/api/dashboard/runs/**/traces?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
      }),
    });
  });

  await page.route('**/api/dashboard/budgets', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: 'starter',
        credits_total: 1000,
        credits_used: 120,
        credits_remaining: 880,
        usage_percentage: 12,
        reset_date: '2026-05-01T00:00:00.000Z',
      }),
    });
  });

  await page.route('**/api/dashboard/budgets/usage?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_credits_used: 120,
        credits_remaining: 880,
        credits_total: 1000,
        period_start: '2026-04-01T00:00:00.000Z',
        period_end: '2026-04-30T23:59:59.000Z',
        usage_by_agent: [],
        usage_by_type: [],
      }),
    });
  });

  await page.route('**/api/dashboard/monitoring/alerts?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
      }),
    });
  });

  await page.route('**/api/pico/approvals?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
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

    if (beforeCompleteSamples.length > 0) {
      expect(beforeCompleteSamples.every((sample) => sample.stageVisible)).toBe(true);
      expect(beforeCompleteSamples.every((sample) => sample.videoVisible)).toBe(true);
      expect(beforeCompleteSamples.every((sample) => sample.heroContentHidden)).toBe(true);
    } else {
      expect(visibilitySamples.some((sample) => sample.state === 'complete')).toBe(true);
    }

    await expect(loader).toBeHidden({ timeout: 9000 });
    await expect(html).toHaveAttribute('data-loader-state', 'complete');

    await expect(page.getByTestId('homepage-lockup')).toBeVisible();
    await expect(page.getByTestId('homepage-lockup-mark')).toBeVisible();
    await expect(page.getByRole('heading', { name: /see it\. control it\. prove it\./i })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText(/live visibility, hard boundaries, and reviewable history for every agent run\./i)
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /go to picomutx/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /download for mac/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^releases$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^docs$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /view github/i }).first()).toBeVisible();
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
    expect(heroActions).toEqual(['Go to PicoMUTX', 'Download for Mac', 'View GitHub']);
    expect(strayLargeLogos).toBe(0);
    await expect(page.getByTestId('marketing-loader-stage')).toHaveCount(0);

    const desktopFold = await page.evaluate(() => {
      const hero = document.querySelector('main section');
      const proof = document.querySelector('[data-testid="homepage-proof-section"]');
      const heroRect = hero?.getBoundingClientRect();
      const proofRect = proof?.getBoundingClientRect();

      return {
        heroHeight: heroRect?.height ?? 0,
        viewportHeight: window.innerHeight,
        proofTop: proofRect?.top ?? 0,
      };
    });

    expect(desktopFold.heroHeight).toBeGreaterThanOrEqual(desktopFold.viewportHeight - 1);
    expect(desktopFold.proofTop).toBeGreaterThan(0);

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
      const proof = document.querySelector('[data-testid="homepage-proof-section"]');
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
    expect(mobileMetrics.proofTop).toBeGreaterThan(0);

    await expect(page.getByRole('link', { name: /pico\.?mutx/i }).first()).toBeVisible();
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

  test('homepage demo section uses real dashboard story media and supporting assets', async () => {
    const demoTabs = marketingHomepage.salesSections.demo.tabs;
    const demoAssets = demoTabs.map((tab) => tab.mediaSrc);
    const storyAsset = marketingHomepage.salesSections.demo.story.mediaSrc;

    expect(demoAssets.length).toBeGreaterThan(0);
    expect(new Set(demoAssets).size).toBe(demoAssets.length);
    expect(demoAssets.every((src) => src.startsWith('/marketing/dashboard/'))).toBe(true);
    for (const tab of demoTabs) {
      if (tab.mediaType === 'image') {
        expect(tab.mediaSrc.endsWith('.jpg')).toBe(true);
        expect(tab.mediaPosterSrc).toBeUndefined();
      } else {
        expect(tab.mediaSrc.endsWith('.mp4')).toBe(true);
        expect(tab.mediaPosterSrc?.startsWith('/marketing/dashboard/')).toBe(true);
      }
    }
    expect(storyAsset.startsWith('/marketing/dashboard/')).toBe(true);
    expect(storyAsset.endsWith('.mp4')).toBe(true);
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

  test('docs routes keep the branded manual shell and expose a guided hub', async ({ page }) => {
    await page.goto('/docs', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /mutx docs operator manual/i })).toBeVisible();
    await expect(page.getByText(/canonical reference/i)).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /read mutx like a shipped system, not a static help center\./i,
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /open quickstart/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /read api reference/i })).toBeVisible();
    await expect(page.getByText(/field manual/i).first()).toBeVisible();

    await page.goto('/docs/deployment/quickstart', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /mutx docs operator manual/i })).toBeVisible();
    await expect(page.getByText(/canonical reference/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /quickstart/i }).first()).toBeVisible();
    await expect(page.locator('.docs-breadcrumbs')).toBeVisible();
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
    await expect(page.getByRole('link', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /continue with github/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /continue with discord/i })).toBeVisible();

    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /continue with github/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /continue with discord/i })).toBeVisible();

    await page.goto('/verify-email?email=operator%40mutx.dev&next=%2Fdashboard%2Fwebhooks', {
      waitUntil: 'domcontentloaded',
    });
    await expectRouteSurfaceSplit(page);
    await expect(page.getByText(/we sent a verification link to operator@mutx\.dev\./i)).toBeVisible();
    await expect(page.getByRole('button', { name: /resend verification/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to sign in/i })).toHaveAttribute(
      'href',
      /\/login\?next=%2Fdashboard%2Fwebhooks&email=operator%40mutx\.dev/i,
    );

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

  test('pico root is the landing page and keeps product routes deeper in /pico', async ({ page }) => {
    await page.goto('/pico', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('pico-waitlist-landing')).toBeVisible();
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('main')).toContainText(/PicoMUTX/i);
    await expect(page.getByTestId('pico-footer')).toBeVisible();
    await expect(page.getByRole('heading', { name: /get to your first working agent fast/i })).toHaveCount(0);
    await expect(page.getByTestId('pico-surface-compass')).toHaveCount(0);
    await expect(page.locator('a[href="/pico/onboarding"]')).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/pico');
  });

  test('pico pricing route keeps access lanes and live billing in one honest surface', async ({
    page,
  }) => {
    await page.goto('/pico/pricing', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('pico-pricing-route')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /see the access lane first\. see the billing layer second\./i }),
    ).toBeVisible();
    await expect(page.getByTestId('pico-pricing-access-lanes')).toContainText(/priority lane/i);
    await expect(page.getByTestId('pico-pricing-live-plans')).toContainText(
      /live product plans once pico is already in play/i,
    );
    await expect(page.getByText(/founding access is the front door\./i)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/pricing');
  });

  test('pico product routes render live surfaces and linked lesson flows stay inside /pico', async ({ page }) => {
    await stubPicoProductApis(page);

    const productRoutes = [
      { href: '/pico/onboarding', heading: /get to your first working agent fast/i },
      { href: '/pico/academy', heading: /install hermes locally/i },
      { href: '/pico/academy/install-hermes-locally', heading: /install hermes locally/i },
      { href: '/pico/tutor', heading: /ask for the exact next step/i },
      { href: '/pico/autopilot', heading: /trust the runtime because the surface tells the truth/i },
      { href: '/pico/support', heading: /get a human when the product path stops being enough/i },
    ];

    for (const route of productRoutes) {
      await page.goto(route.href, { waitUntil: 'domcontentloaded' });
      if (route.href.startsWith('/pico/academy/') && route.href !== '/pico/academy') {
        await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      } else {
        await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
      }
      if (route.href === '/pico/academy') {
        await expect(page.getByTestId('pico-academy-mission-billboard')).toBeVisible();
        await expect(page.getByTestId('pico-academy-progress-strip')).toBeVisible();
        await expect(page.getByTestId('pico-academy-campaign-map')).toBeVisible();
        await expect(page.locator('main').getByRole('link', { name: /install hermes now/i }).first()).toBeVisible();
        await expect(page.getByTestId('pico-academy-workspace-summary')).toBeVisible();
        await expect(page.getByText(/surface count/i)).toHaveCount(0);
      } else {
        await expect(page.getByTestId('pico-surface-compass')).toBeVisible();
      }
      if (route.href === '/pico/academy/install-hermes-locally') {
        await expect(page.getByTestId('pico-lesson-workspace')).toBeVisible();
        await expect(page.getByTestId('pico-lesson-proof')).toBeVisible();
        await expect(page.getByTestId('pico-lesson-campaign-hero')).toBeVisible();
      }
      expect(new URL(page.url()).pathname).toBe(route.href);
    }

    await expect(page.getByText(/signed in as operator@mutx\.dev/i)).toBeVisible();
    await expect(page.getByText(/email verified/i)).toBeVisible();
    await expect(page.getByText(/2 webhooks/i)).toBeVisible();

    await page.goto('/pico/onboarding', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /go to next chapter: lessons/i }).first().click();
    await expect(page.getByRole('heading', { name: /install hermes locally/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/academy');

    await page.goto('/pico/academy/install-hermes-locally', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /ask the tutor about this lesson/i }).click();
    await expect(page.getByText(/you are asking about install hermes locally/i)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/tutor');
    expect(new URL(page.url()).searchParams.get('lesson')).toBe('install-hermes-locally');

    await page.goto('/pico/academy/run-your-first-agent', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: /run your first agent/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/academy/run-your-first-agent');

    await page.goto('/pico/academy', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('pico-platform-surface')).toBeVisible();
    await expect(page.getByTestId('pico-platform-active-surface')).toContainText(/academy/i);
    await expect(page.getByTestId('pico-platform-surface-memory')).toBeVisible();
  });

  test('pico mobile route flow stays usable across onboarding, lessons, tutor, support, and autopilot', async ({ page }) => {
    await stubPicoProductApis(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/pico/onboarding', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /get to your first working agent fast/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /go to next chapter: lessons/i }).first()).toBeVisible();

    await page.getByRole('link', { name: /go to next chapter: lessons/i }).first().click();
    await expect(page.getByRole('heading', { name: /install hermes locally/i })).toBeVisible();
    await expect(page.getByTestId('pico-academy-mission-billboard')).toBeVisible();
    await expect(page.getByTestId('pico-academy-progress-strip')).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: /install hermes now/i }).first()).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/academy');

    await page.goto('/pico/academy/install-hermes-locally', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /ask the tutor about this lesson/i }).click();
    await expect(page.getByText(/you are asking about install hermes locally/i)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/tutor');

    await page.getByRole('link', { name: /open support lane/i }).first().click();
    await expect(page.getByRole('heading', { name: /get a human when the product path stops being enough/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/support');

    await page.getByRole('link', { name: /open autopilot/i }).first().click();
    await expect(page.getByRole('heading', { name: /trust the runtime because the surface tells the truth/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/autopilot');
  });

  test('pico onboarding hides the blocked first-prompt shortcut until install is complete', async ({ page }) => {
    await stubPicoProductApis(page);

    await page.goto('/pico/onboarding', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /already installed\? go to first prompt/i })).toHaveCount(0);
    await page.getByRole('link', { name: /install hermes now/i }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: /install hermes locally/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/academy/install-hermes-locally');
  });

  test('pico support CTA opens a real escalation intake instead of prereg copy', async ({ page }) => {
    await stubPicoProductApis(page, { authenticated: false });

    await page.goto('/pico/support', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^get human help$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /tell us where the product path broke/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /send support request/i })).toBeVisible();
    await expect(dialog.getByText(/pre-register|early access|preregistrati|accesso anticipato/i)).toHaveCount(0);
  });

  test('pico academy shell toggles keep atlas and recovery inside the product', async ({ page }) => {
    await stubPicoProductApis(page);

    await page.goto('/pico/academy', { waitUntil: 'domcontentloaded' });
    await page.locator('header').getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.getByText(/focus mode is active/i)).toBeVisible();

    await page.locator('header').getByRole('button', { name: 'Help', exact: true }).click();
    await expect(page.getByTestId('pico-help-lane-panel')).toBeVisible();

    await page.getByTestId('pico-help-lane-panel').getByRole('link', { name: /open support lane/i }).click();
    await expect(page.getByRole('heading', { name: /get a human when the product path stops being enough/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/support');
  });

  test('pico quick tour can be dismissed and reopened without owning the flow', async ({ page }) => {
    await stubPicoProductApis(page);

    await page.goto('/pico/academy', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('pico-welcome-tour')).toHaveCount(0);
    await page.getByTestId('pico-open-tour').click();
    await expect(page.getByTestId('pico-welcome-tour')).toBeVisible();
    await expect(page.getByTestId('pico-welcome-tour')).toContainText(/learn the codex once, then close it\./i);
    await page.getByRole('button', { name: /^next$/i }).click();
    await expect(page.getByTestId('pico-welcome-tour')).toContainText(/the codex only wants one mission to matter\./i);

    await page.getByRole('button', { name: /close quick tour/i }).click();
    await expect(page.getByTestId('pico-welcome-tour')).toHaveCount(0);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('pico-welcome-tour')).toHaveCount(0);

    await page.getByTestId('pico-open-tour').click();
    await expect(page.getByTestId('pico-welcome-tour')).toBeVisible();
  });

  test('pico route correction panels keep operators inside the product', async ({ page }) => {
    await stubPicoProductApis(page);

    await page.goto('/pico/tutor?lesson=install-hermes-locally', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/you are asking about install hermes locally/i)).toBeVisible();
    await page.getByRole('link', { name: 'Return to blocked lesson', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: /install hermes locally/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/academy/install-hermes-locally');

    await page.goto('/pico/autopilot', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Ask tutor about the next move', exact: true }).click();
    await expect(page.getByRole('heading', { name: /ask for the exact next step/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/tutor');
    expect(new URL(page.url()).searchParams.get('lesson')).toBe('install-hermes-locally');

    await page.goto('/pico/support', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /open autopilot/i }).first().click();
    await expect(page.getByRole('heading', { name: /trust the runtime because the surface tells the truth/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/pico/autopilot');
  });

  test('pico tutor renders structured guidance and evidence for a blocked lesson', async ({ page }) => {
    await stubPicoProductApis(page);

    await page.goto('/pico/tutor?lesson=run-your-first-agent', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder(/describe the blocker/i).fill('Hermes installed but I need the exact next move.');
    await page.getByRole('button', { name: /get next step/i }).click();

    await expect(page.getByText(/^Situation$/i)).toBeVisible();
    await expect(page.getByText(/^Diagnosis$/i)).toBeVisible();
    await expect(page.getByText(/^Commands$/i)).toBeVisible();
    await expect(page.getByText(/^Official links$/i)).toBeVisible();
    await expect(page.getByText(/move into the first prompt lesson/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'github.com' })).toHaveAttribute(
      'href',
      'https://github.com/nousresearch/hermes-agent',
    );
  });

  test('pico tutor lets an authenticated operator connect and disconnect an OpenAI key without leaving the flow', async ({ page }) => {
    await stubPicoProductApis(page);
    await page.goto('/pico/tutor?lesson=install-hermes-locally');

    await expect(page.getByTestId('pico-openai-connect-panel')).toBeVisible();
    await expect(page.getByTestId('pico-openai-connect-status')).toContainText(/no openai key is connected/i);

    await page.getByPlaceholder('sk-proj-...').fill('sk-proj-test-openai-connection-1234');
    await page.getByRole('button', { name: /connect openai/i }).click();

    await expect(page.getByTestId('pico-openai-connect-status')).toContainText(/active for live tutor answers/i);
    await expect(page.getByText(/connected as ••••1234/i)).toBeVisible();

    await page.getByRole('button', { name: /disconnect openai/i }).click();
    await expect(page.getByTestId('pico-openai-connect-status')).toContainText(/no openai key is connected/i);
  });

  test('pico lesson workspace persists execution context back into the academy', async ({ page }) => {
    await stubPicoProductApis(page);

    await page.goto('/pico/academy/install-hermes-locally', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('pico-step-toggle-first').click();
    await page.getByTestId('pico-lesson-proof').fill('Hermes opened from a fresh shell and returned version output.');

    await page.goto('/pico/academy', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('pico-academy-workspace-summary')).toBeVisible();
    await expect(page.getByTestId('pico-academy-workspace-summary').getByText(/1\/3 steps/i)).toBeVisible();
    await expect(page.getByTestId('pico-academy-workspace-summary').getByText(/^captured$/i)).toBeVisible();

    await page.goto('/pico/onboarding', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('pico-onboarding-mission-board')).toBeVisible();
    await expect(page.getByTestId('pico-onboarding-install-mission').getByText(/1\/3 steps/i)).toBeVisible();
    await expect(page.getByTestId('pico-onboarding-install-mission').getByText(/^captured$/i)).toBeVisible();

    await page.goto('/pico/autopilot', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('pico-autopilot-academy-context')).toBeVisible();
    await expect(page.getByTestId('pico-autopilot-academy-context').getByText(/1\/3/i)).toBeVisible();
    await expect(page.getByTestId('pico-autopilot-academy-context').getByText(/^captured$/i)).toBeVisible();
  });

  test('pico product routes expose hosted provider auth when no session is attached', async ({ page }) => {
    await stubPicoProductApis(page, { authenticated: false });

    await page.goto('/pico/onboarding', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /get to your first working agent fast/i })).toBeVisible();
    await expect(page.getByText(/hosted session required/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /^sign in$/i })).toHaveAttribute(
      'href',
      /\/login\?next=%2Fpico%2Fonboarding/i,
    );
    await expect(page.getByRole('link', { name: /^create account$/i })).toHaveAttribute(
      'href',
      /\/register\?next=%2Fpico%2Fonboarding/i,
    );
    await expect(page.getByRole('link', { name: /continue with google/i })).toHaveAttribute(
      'href',
      /\/api\/auth\/oauth\/google\/start\?intent=login&next=%2Fpico%2Fonboarding/i,
    );
    await expect(page.getByRole('link', { name: /continue with github/i })).toHaveAttribute(
      'href',
      /\/api\/auth\/oauth\/github\/start\?intent=login&next=%2Fpico%2Fonboarding/i,
    );
    await expect(page.getByRole('link', { name: /continue with discord/i })).toHaveAttribute(
      'href',
      /\/api\/auth\/oauth\/discord\/start\?intent=login&next=%2Fpico%2Fonboarding/i,
    );
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
