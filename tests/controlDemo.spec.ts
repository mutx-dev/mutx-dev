import { expect, test } from '@playwright/test';

const CONTROL_ROUTES = [
  '/control',
  '/control/agents',
  '/control/deployments',
  '/control/runs',
  '/control/environments',
  '/control/access',
  '/control/connectors',
  '/control/audit',
  '/control/usage',
  '/control/settings',
];

test.describe('interactive control demo', () => {
  test('labels sample data, uses the operator workspace, and keeps links internal', async ({ page }) => {
    await page.goto('/control', { waitUntil: 'domcontentloaded' });

    const root = page.getByTestId('control-demo-root');
    await expect(page.getByTestId('control-demo-label')).toHaveText(
      /demo · sample data · changes stay in this tab/i,
    );
    await expect(root).toHaveAttribute('aria-label', /interactive control demo/i);
    await expect(root).toHaveAttribute('data-control-visual-system', 'operator-workspace');
    await expect(root).toHaveAttribute('data-no-live-writes', 'true');
    await expect(root).toHaveCSS('background-color', 'rgb(240, 239, 233)');
    await expect(page.getByRole('dialog', { name: /presenter notes/i })).toHaveCount(0);
    await expect(page.getByText(/presenter notes/i)).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Overview summary' })).toHaveCount(0);

    const hrefs = await root.locator('a[href]').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).filter((href): href is string => Boolean(href)),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.every((href) => href === '/control' || href.startsWith('/control/'))).toBe(true);
  });

  test('opens presenter mode from the keyboard, traps focus, announces state, and restores focus', async ({ page }) => {
    await page.goto('/control', { waitUntil: 'domcontentloaded' });

    const presenter = page.getByRole('button', { name: 'Presenter' });
    await presenter.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: /presenter notes/i });
    const close = dialog.getByRole('button', { name: /close presenter notes/i });
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();
    const announcement = page.getByTestId('control-demo-announcement');
    await expect(announcement).toHaveText(/presenter notes opened/i);
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(presenter).toBeFocused();
    await expect(announcement).toHaveText(/presenter notes closed/i);
  });

  test('supports keyboard-only local interventions and route search', async ({ page, browserName }) => {
    await page.goto('/control', { waitUntil: 'domcontentloaded' });

    const quickAction = page.locator('button:visible', { hasText: 'Deploy new version' }).first();
    await quickAction.focus();
    await expect(quickAction).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(quickAction).toContainText(/preview selected/i);
    await expect(page.getByTestId('control-demo-action-status').filter({ hasText: /preview selected: deploy new version/i }).first()).toBeAttached();

    const search = page.locator('input[aria-label="Search demo pages"]:visible');
    await search.focus();
    await page.keyboard.type('settings');

    const results = page.locator('[data-testid="control-demo-search-results"]:visible');
    await expect(results).toContainText(/pages/i);
    const settingsResult = results.getByRole('link', { name: /settings/i });
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(settingsResult).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/control\/settings$/);
    await expect(page.getByTestId('control-demo-label')).toBeVisible();
  });

  test('keeps approval decisions local, visible, and resettable', async ({ page }) => {
    await page.goto('/control', { waitUntil: 'domcontentloaded' });

    const mutations: string[] = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) mutations.push(`${request.method()} ${request.url()}`);
    });
    const result = page.getByTestId('control-demo-decision-result');
    await expect(result).toHaveText('Waiting for review.');

    await page.getByRole('button', { name: 'Approve example' }).click();
    await expect(result).toHaveText('Example marked approved in this tab. No tool call was run.');
    await expect(page.getByText('Example approved', { exact: true })).toHaveCount(2);
    await page.getByRole('link', { name: 'Open run history' }).click();
    await expect(page).toHaveURL(/\/control\/runs$/);
    await expect(page.getByTestId('control-demo-decision-result')).toContainText('Example marked approved');
    await expect(page.getByText('Approved in this tab', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Decline example' }).click();
    await expect(result).toHaveText('Example marked declined in this tab. No tool call was run.');
    await expect(page.getByText('Example declined', { exact: true })).toHaveCount(2);
    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    await expect(page).toHaveURL(/\/control$/);
    await expect(page.getByTestId('control-demo-decision-result')).toContainText('Example marked declined');

    await page.getByRole('button', { name: 'Reset example' }).click();
    await expect(result).toHaveText('Example reset to waiting for review.');
    await expect(page.getByText('Waiting for review', { exact: true })).toBeVisible();
    expect(mutations).toEqual([]);
  });

  test('keeps the demo static with reduced motion enabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/control', { waitUntil: 'domcontentloaded' });

    const root = page.getByTestId('control-demo-root');
    await expect(root).toHaveAttribute('data-motion', 'reduced');
    await expect(page.getByTestId('control-demo-stage')).toHaveCSS('transform', 'none');
    await expect(root).not.toHaveAttribute('data-demo-tick');
  });

  for (const width of [320, 768, 1280, 1600]) {
    test(`keeps the ${width}px workspace contained and touch targets usable`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 720 : 900 });
      await page.goto('/control', { waitUntil: 'domcontentloaded' });

      await expect(page.getByTestId('control-demo-label')).toBeVisible();
      await expect(page.locator('input[aria-label="Search demo pages"]:visible')).toBeVisible();
      await expect(page.getByRole('link', { name: /open settings/i })).toHaveAttribute('href', '/control/settings');

      const presenterBox = await page.getByRole('button', { name: 'Presenter' }).boundingBox();
      const settingsBox = await page.getByRole('link', { name: /open settings/i }).boundingBox();
      expect(presenterBox?.height).toBeGreaterThanOrEqual(44);
      expect(settingsBox?.height).toBeGreaterThanOrEqual(44);

      const layout = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        rootRight: document.querySelector('[data-testid="control-demo-root"]')?.getBoundingClientRect().right,
      }));
      expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.rootRight).toBeLessThanOrEqual(layout.viewportWidth);

      if (width <= 768) {
        const decisionBox = await page.getByRole('heading', { name: 'Decision required' }).locator('xpath=ancestor::section[1]').boundingBox();
        const runBox = await page.getByRole('heading', { name: 'Selected run' }).locator('xpath=ancestor::section[1]').boundingBox();
        expect(decisionBox?.y).toBeLessThan(runBox?.y ?? 0);
      }

      if (width === 320) {
        await page.getByRole('button', { name: 'Presenter' }).click();
        const dialogBox = await page.getByRole('dialog', { name: /presenter notes/i }).boundingBox();
        expect(dialogBox?.width).toBeLessThanOrEqual(320);
        await page.keyboard.press('Escape');
      }
    });
  }

  test('puts the decision before run history on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/control/runs');
    const decision = await page.getByRole('heading', { name: 'Decision required' }).boundingBox();
    const selected = await page.getByRole('heading', { name: 'Selected run' }).boundingBox();
    const history = await page.getByRole('heading', { name: 'Recent runs' }).boundingBox();
    expect(decision?.y).toBeLessThan(selected?.y ?? 0);
    expect(decision?.y).toBeLessThan(history?.y ?? 0);
  });

  test('uses a scoped recovery page for an unknown demo route', async ({ page }) => {
    const response = await page.goto('/control/this-route-does-not-exist');
    // Next.js streams the loading boundary before discovering an invalid slug.
    // Its documented not-found contract allows 200 for streamed responses.
    expect([200, 404]).toContain(response?.status());
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await expect(page.locator('[data-boundary-kind="not-found"]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute('href', '/control');
  });

  test('renders every internal control route without browser console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    const headings = new Set<string>();
    for (const route of CONTROL_ROUTES) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('control-demo-root')).toBeVisible();
      await expect(page.getByTestId('control-demo-label')).toBeVisible();
      const heading = await page.getByRole('heading', { level: 1 }).innerText();
      expect(headings.has(heading)).toBe(false);
      headings.add(heading);
      // Let route prefetches settle before replacing the document, especially in WebKit.
      await page.waitForLoadState('networkidle');
    }

    expect(errors).toEqual([]);
  });
});
