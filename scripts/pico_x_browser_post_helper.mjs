#!/usr/bin/env node
import fs from 'node:fs'

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('missing input json path')
  process.exit(2)
}

const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
const { chromium } = await import('playwright')

const HOME_URL = 'https://x.com/home'

function digRestIds(value, acc = []) {
  if (Array.isArray(value)) {
    for (const item of value) digRestIds(item, acc)
    return acc
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'rest_id' && typeof child === 'string' && /^\d+$/.test(child)) {
        acc.push(child)
      }
      digRestIds(child, acc)
    }
  }
  return acc
}

async function bodyText(page, limit = 4000) {
  try {
    const text = await page.locator('body').innerText()
    return (text || '').slice(0, limit)
  } catch {
    return ''
  }
}

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

async function findReplyUrlInTimeline(page, account, replyText) {
  const snippet = normalizeText(replyText).slice(0, 80)
  if (!snippet) return 'none'
  const articles = page.locator('article[data-testid="tweet"]')
  const count = await articles.count().catch(() => 0)
  for (let i = 0; i < count; i += 1) {
    const article = articles.nth(i)
    const text = normalizeText(await article.innerText().catch(() => ''))
    if (!text.includes(snippet)) continue
    const links = article.locator(`a[href^="/${account}/status/"], a[href*="/${account}/status/"]`)
    const linkCount = await links.count().catch(() => 0)
    for (let j = 0; j < linkCount; j += 1) {
      const href = await links.nth(j).getAttribute('href').catch(() => '')
      if (href && href.includes('/status/')) {
        return href.startsWith('http') ? href : `https://x.com${href}`
      }
    }
  }
  return 'none'
}

async function detectLoggedInAccount(page) {
  try {
    const link = page.locator('[data-testid="AppTabBar_Profile_Link"]').first()
    if (await link.count()) {
      const href = (await link.getAttribute('href')) || ''
      const account = href.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).pop() || ''
      if (account) return { account, profileHref: href }
    }
  } catch {
    // noop
  }
  return { account: '', profileHref: '' }
}

function ensureExpectedAccount(account, expectedAccount) {
  if (!expectedAccount) return
  if ((account || '').toLowerCase() !== expectedAccount.toLowerCase()) {
    throw new Error(`account mismatch expected=${expectedAccount} got=${account || 'unknown'}`)
  }
}

async function acceptCookieBanner(page) {
  try {
    const button = page.getByText('Accept all cookies').first()
    if (await button.count()) {
      await button.click({ timeout: 1500 })
      await page.waitForTimeout(1000)
    }
  } catch {
    // noop
  }
}

async function ensureNotLoginWall(page) {
  const text = await bodyText(page, 3000)
  const url = page.url()
  if (url.includes('/i/flow/login') || (text.includes('Log in') && text.includes('Sign up'))) {
    throw new Error(`browser session landed on login wall url=${url}`)
  }
}

async function openHome(page) {
  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(5000)
}

async function authenticateWithCookies(browser, source, expectedAccount) {
  if (!Array.isArray(source.cookies) || source.cookies.length === 0) {
    throw new Error('auth source has no cookies')
  }
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  try {
    await context.addCookies(source.cookies)
    const page = await context.newPage()
    await openHome(page)
    const detected = await detectLoggedInAccount(page)
    if (!detected.account) {
      const text = await bodyText(page, 2000)
      throw new Error(`cookie session did not reach authenticated home state body=${JSON.stringify(text.slice(0, 240))}`)
    }
    ensureExpectedAccount(detected.account, expectedAccount)
    return {
      context,
      page,
      account: detected.account,
      profileHref: detected.profileHref,
      authSource: source.auth_source || 'cookie_bundle',
      cookieSource: source.cookie_source || source.name || 'cookie_bundle',
    }
  } catch (error) {
    await context.close().catch(() => {})
    throw error
  }
}

async function authenticateWithCredentials(browser, credentials, expectedAccount) {
  if (!credentials?.username || !credentials?.password) {
    throw new Error('stored X browser credentials unavailable')
  }

  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  try {
    const page = await context.newPage()
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)

    const userInput = page.locator('input[autocomplete="username"], input[name="text"]').first()
    if (!(await userInput.count())) throw new Error('x login username field not found')
    await userInput.click({ force: true })
    await userInput.fill(credentials.username)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(3000)

    const challengeInput = page.locator('input[data-testid="ocfEnterTextTextInput"], input[name="text"]').first()
    if (await challengeInput.count()) {
      const currentValue = ((await challengeInput.inputValue().catch(() => '')) || '').trim()
      if (!currentValue) {
        await challengeInput.click({ force: true })
        await challengeInput.fill(credentials.username)
        await page.keyboard.press('Enter')
        await page.waitForTimeout(3000)
      }
    }

    const passwordInput = page.locator('input[name="password"]').first()
    if (!(await passwordInput.count())) throw new Error('x login password field not found')
    await passwordInput.click({ force: true })
    await passwordInput.fill(credentials.password)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(6000)

    const detected = await detectLoggedInAccount(page)
    if (!detected.account) {
      const text = await bodyText(page, 3000)
      if (text.includes('Check your email') || text.includes('Enter your phone number') || text.toLowerCase().includes('confirmation code')) {
        throw new Error('x login requires extra verification step')
      }
      throw new Error('x login did not land on an authenticated home/profile state')
    }
    ensureExpectedAccount(detected.account, expectedAccount)
    return {
      context,
      page,
      account: detected.account,
      profileHref: detected.profileHref,
      authSource: 'stored_credentials_login',
      cookieSource: 'none',
    }
  } catch (error) {
    await context.close().catch(() => {})
    throw error
  }
}

async function openAuthenticatedSession(browser, payload) {
  const errors = []
  for (const source of payload.auth_sources || []) {
    try {
      return await authenticateWithCookies(browser, source, payload.expected_account)
    } catch (error) {
      errors.push(`${source.cookie_source || source.name || 'cookie_source'}: ${error.message}`)
    }
  }

  if (payload.login_credentials?.username && payload.login_credentials?.password) {
    try {
      return await authenticateWithCredentials(browser, payload.login_credentials, payload.expected_account)
    } catch (error) {
      errors.push(`stored_credentials_login: ${error.message}`)
    }
  }

  throw new Error(`no usable X auth source: ${errors.join(' | ') || 'none configured'}`)
}

async function openReplyComposer(page, replyText) {
  const replyButton = page.locator('[data-testid="reply"]').first()
  await replyButton.waitFor({ state: 'visible', timeout: 15000 })
  await replyButton.click({ force: true })
  await page.waitForURL('**/compose/post', { timeout: 15000 })
  await page.waitForTimeout(1500)

  const textarea = page.locator('[data-testid="tweetTextarea_0"]').first()
  await textarea.click({ force: true })
  await page.keyboard.type(replyText, { delay: 20 })
  await page.waitForTimeout(800)

  const submit = page.locator('[data-testid="tweetButton"]').first()
  const enabled = await submit.isEnabled()
  if (!enabled) throw new Error('reply submit button disabled after typing text')
  return { submit }
}

async function runCheck(payload) {
  const launchOptions = { headless: payload.headless !== false }
  if (payload.chrome_executable && fs.existsSync(payload.chrome_executable)) {
    launchOptions.executablePath = payload.chrome_executable
  }
  const browser = await chromium.launch(launchOptions)
  let session
  try {
    session = await openAuthenticatedSession(browser, payload)
    return {
      status: 'ready',
      account: session.account,
      profile_href: session.profileHref,
      auth_source: session.authSource,
      cookie_source: session.cookieSource,
    }
  } finally {
    if (session?.context) await session.context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

async function runProbe(payload) {
  const launchOptions = { headless: payload.headless !== false }
  if (payload.chrome_executable && fs.existsSync(payload.chrome_executable)) {
    launchOptions.executablePath = payload.chrome_executable
  }
  const browser = await chromium.launch(launchOptions)
  let session
  try {
    session = await openAuthenticatedSession(browser, payload)
    await session.page.goto(payload.target_url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await session.page.waitForTimeout(5000)
    await acceptCookieBanner(session.page)
    await ensureNotLoginWall(session.page)
    await openReplyComposer(session.page, payload.reply_text)
    return {
      status: 'probe_ready',
      account: session.account,
      target_url: payload.target_url,
      auth_source: session.authSource,
      cookie_source: session.cookieSource,
      submit_enabled: true,
    }
  } finally {
    if (session?.context) await session.context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

async function runLocate(payload) {
  const launchOptions = { headless: payload.headless !== false }
  if (payload.chrome_executable && fs.existsSync(payload.chrome_executable)) {
    launchOptions.executablePath = payload.chrome_executable
  }
  const browser = await chromium.launch(launchOptions)
  let session
  try {
    session = await openAuthenticatedSession(browser, payload)
    const withReplies = await session.context.newPage()
    await withReplies.goto(`https://x.com/${session.account}/with_replies`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await withReplies.waitForTimeout(6000)
    const visible = (await bodyText(withReplies, 12000)).includes(payload.reply_text.slice(0, 80))
    const replyUrl = await findReplyUrlInTimeline(withReplies, session.account, payload.reply_text)
    await withReplies.close().catch(() => {})
    return {
      status: replyUrl !== 'none' || visible ? 'found' : 'missing',
      account: session.account,
      reply_url: replyUrl,
      visible,
      auth_source: session.authSource,
      cookie_source: session.cookieSource,
    }
  } finally {
    if (session?.context) await session.context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

async function runReply(payload) {
  const launchOptions = { headless: payload.headless !== false }
  if (payload.chrome_executable && fs.existsSync(payload.chrome_executable)) {
    launchOptions.executablePath = payload.chrome_executable
  }
  const browser = await chromium.launch(launchOptions)
  let session
  try {
    session = await openAuthenticatedSession(browser, payload)
    await session.page.goto(payload.target_url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await session.page.waitForTimeout(6000)
    await acceptCookieBanner(session.page)
    await ensureNotLoginWall(session.page)
    const { submit } = await openReplyComposer(session.page, payload.reply_text)

    const responsePromise = session.page.waitForResponse(
      (response) => response.request().method() === 'POST' && (response.url().includes('CreateTweet') || response.url().includes('CreateNoteTweet')),
      { timeout: 30000 },
    )
    await submit.click()
    const response = await responsePromise

    let payloadJson = {}
    try {
      payloadJson = await response.json()
    } catch {
      payloadJson = {}
    }

    await session.page.waitForTimeout(6000)

    let replyUrl = 'none'
    for (const candidate of [...new Set(digRestIds(payloadJson))]) {
      if (!payload.target_url.includes(candidate)) {
        replyUrl = `https://x.com/${session.account}/status/${candidate}`
        break
      }
    }

    const withReplies = await session.context.newPage()
    await withReplies.goto(`https://x.com/${session.account}/with_replies`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await withReplies.waitForTimeout(6000)
    const visible = (await bodyText(withReplies, 12000)).includes(payload.reply_text.slice(0, 80))
    const timelineReplyUrl = await findReplyUrlInTimeline(withReplies, session.account, payload.reply_text)
    if (timelineReplyUrl !== 'none') {
      replyUrl = timelineReplyUrl
    }
    await withReplies.close().catch(() => {})

    if (response.status() !== 200) {
      throw new Error(`create-tweet mutation failed http=${response.status()} url=${response.url()}`)
    }
    if (replyUrl === 'none' && !visible) {
      throw new Error('mutation returned 200 but reply could not be verified in with_replies view')
    }

    return {
      status: 'posted_verified',
      account: session.account,
      reply_url: replyUrl,
      auth_source: session.authSource,
      cookie_source: session.cookieSource,
      mutation_status: response.status(),
      mutation_url: response.url(),
    }
  } finally {
    if (session?.context) await session.context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

async function main() {
  if (!input.action) throw new Error('missing action')

  if (input.action === 'check') {
    console.log(JSON.stringify(await runCheck(input)))
    return
  }

  if (input.action === 'locate') {
    if (!input.reply_text) throw new Error('missing reply_text')
    console.log(JSON.stringify(await runLocate(input)))
    return
  }

  if (!input.target_url) throw new Error('missing target_url')

  if (input.action === 'probe') {
    if (!input.reply_text) throw new Error('missing reply_text')
    console.log(JSON.stringify(await runProbe(input)))
    return
  }

  if (input.action === 'reply') {
    if (!input.reply_text) throw new Error('missing reply_text')
    console.log(JSON.stringify(await runReply(input)))
    return
  }

  throw new Error(`unsupported action=${input.action}`)
}

main().catch((error) => {
  console.error(error?.message || String(error))
  process.exit(1)
})
