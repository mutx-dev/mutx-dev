import { expect, test, type Page } from '@playwright/test';

import {
  createDefaultPicoProgress,
  type PicoProgressState,
} from '../lib/pico/academy';

type AcademyStub = {
  getProgress: () => PicoProgressState;
  writes: PicoProgressState[];
};

async function stubAcademyApis(page: Page): Promise<AcademyStub> {
  let progress = createDefaultPicoProgress();
  const writes: PicoProgressState[] = [];
  const user = {
    email: 'academy@mutx.dev',
    name: 'Academy Operator',
    role: 'ADMIN',
    is_email_verified: true,
  };

  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });

  await page.route('**/api/pico/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: true, user }),
    });
  });

  await page.route('**/api/pico/progress', async (route) => {
    if (route.request().method() === 'POST') {
      progress = JSON.parse(route.request().postData() ?? '{}') as PicoProgressState;
      writes.push(progress);
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(progress),
    });
  });

  return {
    getProgress: () => progress,
    writes,
  };
}

test.describe('Pico Academy evidence completion', () => {
  test('blocks bypasses, persists real evidence, and completes only after every checkpoint', async ({ page }) => {
    const academy = await stubAcademyApis(page);

    await page.goto('/pico/academy/install-hermes-locally', {
      waitUntil: 'domcontentloaded',
    });

    const completion = page.getByRole('button', { name: 'Hermes is installed' }).first();
    const completionStatus = page.getByTestId('pico-lesson-completion-status');

    await expect(completion).toBeDisabled();
    await expect(completionStatus).toContainText(/do not seal the chapter until the proof/i);

    await completion.evaluate((button: HTMLButtonElement) => button.click());
    expect(academy.getProgress().completedLessons).toEqual([]);

    for (let index = 0; index < 3; index += 1) {
      await page.locator(`[data-step-selector="desktop"][data-step-index="${index}"]`).click();
      await page.getByRole('button', { name: 'Mark step done' }).click();
    }

    await page.getByTestId('pico-lesson-proof').fill('done');
    await expect(completion).toBeDisabled();
    await expect(completionStatus).toContainText(/do not seal the chapter until the proof/i);

    const evidence = 'Fresh-shell output: /usr/local/bin/hermes opened successfully.';
    await page.getByTestId('pico-lesson-proof').fill(evidence);

    await expect(completionStatus).toContainText(/ready/i);
    await expect(completion).toBeEnabled();
    await expect
      .poll(() =>
        academy.writes.some(
          (write) => write.lessonWorkspaces['install-hermes-locally']?.evidence === evidence,
        ),
      )
      .toBe(true);

    await completion.click();

    await expect(completionStatus).toContainText(/sealed/i);
    await expect(page.getByRole('link', { name: /run your first agent now/i }).first()).toBeVisible();
    await expect
      .poll(() => academy.getProgress().completedLessons)
      .toContain('install-hermes-locally');
  });

  test('supports keyboard step navigation and removes Academy entrance motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stubAcademyApis(page);
    await page.goto('/pico/academy/install-hermes-locally', {
      waitUntil: 'domcontentloaded',
    });

    const firstStep = page.locator('[data-step-selector="desktop"][data-step-index="0"]');
    const secondStep = page.locator('[data-step-selector="desktop"][data-step-index="1"]');

    await expect(firstStep).toBeEnabled();
    await firstStep.focus();
    await firstStep.press('ArrowDown');
    await expect(secondStep).toBeFocused();
    await expect(secondStep).toHaveAttribute('aria-current', 'step');
    await secondStep.press('Home');
    await expect(firstStep).toBeFocused();

    const motionSurfaces = page.locator('[data-pico-academy-motion]');
    await expect(motionSurfaces.first()).toHaveAttribute('data-motion', 'reduced');
    expect(
      await motionSurfaces.evaluateAll((elements) =>
        elements.reduce((count, element) => count + element.getAnimations().filter((animation) => animation.playState === 'running' || animation.pending).length, 0),
      ),
    ).toBe(0);

    await page.goto('/pico/academy', { waitUntil: 'domcontentloaded' });
    const settingsDisclosure = page.locator('summary[aria-controls="pico-academy-platform-settings"]');
    await expect(settingsDisclosure).toHaveAttribute(
      'aria-controls',
      'pico-academy-platform-settings',
    );
    await expect(page.getByRole('button', { name: 'Map', exact: true })).toBeEnabled();
    await settingsDisclosure.focus();
    await expect(settingsDisclosure).toBeFocused();
    await settingsDisclosure.press('Enter');
    await expect(
      page.getByRole('region', { name: 'Setup', exact: true }),
    ).toBeVisible();
  });

  test('stays within a 320px RTL viewport and mirrors horizontal keyboard navigation', async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: 'NEXT_LOCALE',
        value: 'ar',
        domain: '127.0.0.1',
        path: '/',
      },
    ]);
    await page.setViewportSize({ width: 320, height: 800 });
    await stubAcademyApis(page);
    await page.goto('/pico/academy/install-hermes-locally', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('.pico-root')).toHaveAttribute('dir', 'rtl');

    const firstStep = page.locator('[data-step-selector="mobile"][data-step-index="0"]');
    const secondStep = page.locator('[data-step-selector="mobile"][data-step-index="1"]');
    await expect(firstStep).toBeEnabled();
    await firstStep.focus();
    await firstStep.press('ArrowLeft');
    await expect(secondStep).toBeFocused();
    await expect(secondStep).toHaveAttribute('aria-current', 'step');

    const layout = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const selectors = [
        '[data-testid="pico-lesson-campaign-hero"]',
        '[data-testid="pico-lesson-workspace"]',
        '[data-testid="pico-lesson-proof"]',
      ];
      const bounds = selectors.map((selector) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect();
        return rect ? { left: rect.left, right: rect.right } : null;
      });

      return {
        bounds,
        clientWidth: viewportWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    for (const bounds of layout.bounds) {
      expect(bounds).not.toBeNull();
      expect(bounds?.left ?? -1).toBeGreaterThanOrEqual(0);
      expect(bounds?.right ?? layout.clientWidth + 1).toBeLessThanOrEqual(layout.clientWidth);
    }
  });
});
