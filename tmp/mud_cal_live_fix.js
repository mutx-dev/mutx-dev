const { chromium } = require('playwright');

const FRIDAY_ID = '5177323';
const FRIDAY_SETUP = `https://app.cal.com/event-types/${FRIDAY_ID}?tabName=setup`;
const FRIDAY_AVAIL_TAB = `https://app.cal.com/event-types/${FRIDAY_ID}?tabName=availability`;
const FRIDAY_ADVANCED = `https://app.cal.com/event-types/${FRIDAY_ID}?tabName=advanced`;
const EVENT_TYPES_URL = 'https://app.cal.com/event-types';
const TEAM_PUBLIC_URL = 'https://cal.com/mud-a7feqm';
const FRIDAY_PUBLIC_URL = 'https://cal.com/mud-a7feqm/sexta-feira?redirect=false&overlayCalendar=true&layout=month_view';

const KIDS_TITLE = 'Sexta-feira Infantil';
const KIDS_SLUG = 'sexta-feira-infantil';
const KIDS_DESC = 'Turma infantil de sexta-feira: 16:00 com Ju. Pagamento via Pix: info@mudescola.com. Aula presencial na MUD Escola de Cerâmica.';
const FRIDAY_DESC = 'Horários da página: 09:00 Dolo · 11:00 Dolo · 14:00 Ju · 18:00 ateliê aberto. Pagamento via Pix: info@mudescola.com. Aulas presenciais na MUD Escola de Cerâmica.';

function log(...args) {
  console.log('[mud-cal-fix]', ...args);
}

async function pause(page, ms = 1500) {
  await page.waitForTimeout(ms);
}

async function goto(page, url, ms = 2500) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await pause(page, ms);
}

async function getCards(page) {
  return await page.locator('a[title]').evaluateAll((nodes) =>
    nodes
      .map((a) => ({
        title: a.getAttribute('title') || '',
        href: a.href,
        text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      }))
      .filter((x) => x.href.includes('/event-types/'))
  );
}

function extractIdFromHref(href) {
  const m = href.match(/\/event-types\/(\d+)/);
  return m ? m[1] : null;
}

async function clickDuplicate(page, title, slug) {
  const trigger = page.getByTestId(`event-type-options-${FRIDAY_ID}`).first();
  await trigger.click();
  await pause(page, 800);
  await page.getByTestId(`event-type-duplicate-${FRIDAY_ID}`).click();
  await pause(page, 1000);
  await page.locator('input[name="title"]').last().fill(title);
  await page.locator('input[name="slug"]').last().fill(slug);
  await page.getByRole('button', { name: 'Continue' }).click();
  await pause(page, 5000);
}

async function ensureKidsEventExists(page) {
  await goto(page, EVENT_TYPES_URL);
  const before = await getCards(page);
  const existing = before.find((c) => c.title.trim().toLowerCase() === KIDS_TITLE.toLowerCase());
  if (existing) {
    log('kids event already exists', existing.href);
    return extractIdFromHref(existing.href);
  }

  const beforeHrefs = new Set(before.map((c) => c.href));
  log('duplicating Friday event type');
  await clickDuplicate(page, KIDS_TITLE, KIDS_SLUG);
  await goto(page, EVENT_TYPES_URL);
  const after = await getCards(page);
  const added = after.filter((c) => !beforeHrefs.has(c.href));
  if (!added.length) {
    throw new Error('Duplicate did not create a new event type card.');
  }
  const duplicate = added[0];
  const duplicateId = extractIdFromHref(duplicate.href);
  if (!duplicateId) throw new Error('Could not extract duplicate event id.');
  log('duplicate created', duplicate.title, duplicate.href);
  return duplicateId;
}

async function replaceEditorText(page, text) {
  const editor = page.locator('[contenteditable="true"]').first();
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.insertText(text);
}

async function clickSave(page) {
  const save = page.getByRole('button', { name: 'Save' }).first();
  await save.click();
  await pause(page, 3000);
}

async function editSetup(page, eventId, title, slug, desc) {
  await goto(page, `https://app.cal.com/event-types/${eventId}?tabName=setup`);
  await page.locator('input[name="title"]').fill(title);
  await page.locator('input[name="slug"]').fill(slug);
  await replaceEditorText(page, desc);
  await clickSave(page);
  const body = await page.locator('body').innerText();
  if (!body.includes(title)) {
    log('warning: body text did not include expected title after save', title);
  }
}

async function getAvailabilityLink(page, eventId) {
  await goto(page, `https://app.cal.com/event-types/${eventId}?tabName=availability`);
  const href = await page.locator('a:has-text("Edit availability")').getAttribute('href');
  if (!href) throw new Error(`No availability link found for event ${eventId}`);
  const m = href.match(/\/availability\/(\d+)/);
  if (!m) throw new Error(`Could not parse availability id from ${href}`);
  return { href: href.startsWith('http') ? href : `https://app.cal.com${href}`, id: m[1] };
}

async function removeRange(page, label) {
  const ok = await page.evaluate((targetLabel) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      const parentText = btn.parentElement?.innerText?.trim() || '';
      if (
        parentText === targetLabel &&
        btn.className.includes('hover:bg-error')
      ) {
        btn.click();
        return true;
      }
    }
    return false;
  }, label);
  if (!ok) throw new Error(`Could not remove availability range ${label}`);
  await pause(page, 900);
}

async function editAvailabilityByRemoval(page, availabilityHref, rangesToRemove) {
  await goto(page, availabilityHref, 3000);
  for (const label of rangesToRemove) {
    await removeRange(page, label);
  }
  await clickSave(page);
}

async function getAdvancedFlags(page, eventId) {
  await goto(page, `https://app.cal.com/event-types/${eventId}?tabName=advanced`, 3000);
  return await page.evaluate(() => {
    function findSwitchForText(text) {
      const exact = Array.from(document.querySelectorAll('*')).find((n) => (n.textContent || '').trim() === text);
      if (!exact) return null;
      let cur = exact;
      for (let i = 0; i < 6 && cur; i++, cur = cur.parentElement) {
        const sw = cur.querySelector('button[role="switch"]');
        if (sw) return sw.getAttribute('aria-checked');
      }
      return null;
    }
    return {
      lockTimezone: findSwitchForText('Lock timezone on booking page'),
      hideOrganizerEmail: findSwitchForText("Hide organizer's email"),
    };
  });
}

async function getPublicBody(page, url) {
  await goto(page, url, 3000);
  return await page.locator('body').innerText();
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const context = browser.contexts()[0];
  const page = await context.newPage();

  try {
    // Baseline checks on original Friday event.
    const fridayAdvanced = await getAdvancedFlags(page, FRIDAY_ID);
    log('original Friday advanced', fridayAdvanced);

    const originalAvail = await getAvailabilityLink(page, FRIDAY_ID);
    log('original Friday availability', originalAvail);

    const kidsEventId = await ensureKidsEventExists(page);
    log('kids event id', kidsEventId);

    // Configure the kids event.
    await editSetup(page, kidsEventId, KIDS_TITLE, KIDS_SLUG, KIDS_DESC);
    const kidsAvail = await getAvailabilityLink(page, kidsEventId);
    log('kids availability', kidsAvail);

    if (kidsAvail.id === originalAvail.id) {
      throw new Error(`Kids event availability (${kidsAvail.id}) unexpectedly matches original Friday availability.`);
    }

    const kidsRangesToRemove = [
      '9:00am\n-\n11:00am',
      '11:00am\n-\n1:00pm',
      '2:00pm\n-\n4:00pm',
      '6:00pm\n-\n8:00pm',
    ];
    await editAvailabilityByRemoval(page, kidsAvail.href, kidsRangesToRemove);

    // Configure the original Friday event.
    await editSetup(page, FRIDAY_ID, 'Sexta-feira', 'sexta-feira', FRIDAY_DESC);
    await editAvailabilityByRemoval(page, originalAvail.href, ['4:00pm\n-\n6:00pm']);

    // Verification.
    const kidsAdvanced = await getAdvancedFlags(page, kidsEventId);
    log('kids advanced', kidsAdvanced);

    const fridayPublicText = await getPublicBody(page, FRIDAY_PUBLIC_URL);
    const kidsPublicUrl = `https://cal.com/mud-a7feqm/${KIDS_SLUG}?redirect=false&overlayCalendar=true&layout=month_view`;
    const kidsPublicText = await getPublicBody(page, kidsPublicUrl);
    const teamPublicText = await getPublicBody(page, TEAM_PUBLIC_URL);

    const result = {
      kidsEventId,
      originalAvail,
      kidsAvail,
      fridayAdvanced,
      kidsAdvanced,
      fridayPublicChecks: {
        has0900: fridayPublicText.includes('09:00'),
        has1100: fridayPublicText.includes('11:00'),
        has1400: fridayPublicText.includes('14:00'),
        has1600: fridayPublicText.includes('16:00'),
        has1800: fridayPublicText.includes('18:00'),
        hasSeats: fridayPublicText.includes('7 Seats available'),
        hasPix: fridayPublicText.includes('info@mudescola.com'),
        hasTimezone: fridayPublicText.includes('America/Sao Paulo'),
      },
      kidsPublicChecks: {
        has1600: kidsPublicText.includes('16:00'),
        has0900: kidsPublicText.includes('09:00'),
        has1100: kidsPublicText.includes('11:00'),
        has1400: kidsPublicText.includes('14:00'),
        has1800: kidsPublicText.includes('18:00'),
        hasSeats: kidsPublicText.includes('7 Seats available'),
        hasPix: kidsPublicText.includes('info@mudescola.com'),
        hasTimezone: kidsPublicText.includes('America/Sao Paulo'),
      },
      teamPublicChecks: {
        hasFridayCard: teamPublicText.includes('Sexta-feira'),
        hasKidsCard: teamPublicText.includes(KIDS_TITLE),
        hasSaturdayWorkshopsCard: teamPublicText.includes('Sábado Workshops'),
      },
      fridayPublicSnippet: fridayPublicText.slice(0, 1400),
      kidsPublicSnippet: kidsPublicText.slice(0, 1400),
      teamPublicSnippet: teamPublicText.slice(0, 2200),
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await page.close();
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
