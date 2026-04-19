import fs from 'node:fs'
import path from 'node:path'

import { getPicoDefaultMessages } from '../lib/pico/defaultMessages'

type MessageValue = string | number | boolean | null | MessageObject | MessageValue[]
type MessageObject = { [key: string]: MessageValue }

const repoRoot = process.cwd()
const messagesDir = path.join(repoRoot, 'messages')
const baseLocale = 'en'
const picoKey = 'pico'
const arabicPattern = /\p{Script=Arabic}/u
const latinPattern = /[A-Za-z]/
const hanPattern = /\p{Script=Han}/u
const exactEnglishLocales = new Set(['ko', 'zh', 'ar'])
const requiredNamespaces = [
  'meta',
  'nav',
  'hero',
  'problem',
  'platform',
  'who',
  'beforeAfter',
  'earlyAccess',
  'pricing',
  'faq',
  'finalCta',
  'contactForm',
  'footer',
  'localeSwitcher',
  'pricingPage',
  'surfaceCompass',
  'shell',
  'lessonPage',
  'content',
  'supportPage',
  'tutorPage',
  'onboardingPage',
  'academyPage',
  'autopilotPage',
  'sessionBanner',
  'platformSurface',
  'welcomeTour',
  'pages',
]
const allowedArabicTechnicalTokens = [
  'PicoMUTX',
  'MUTX',
  'GitHub',
  'OpenClaw',
  'Hermes',
  'Autopilot',
  'Tutor',
  'Academy',
  'BYOK',
  'API',
  'SSO',
  'SLA',
  'URL',
  'JSON',
  'CLI',
  'SDK',
  'Webhook',
  'webhook',
  'Webhooks',
  'webhooks',
]
const maxMissingReportsPerLocale = 120

function readJson(filePath: string): MessageObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as MessageObject
}

function isObject(value: unknown): value is MessageObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMergeMessages(base: MessageObject, override: MessageObject | undefined): MessageObject {
  if (!override) {
    return structuredClone(base)
  }

  const merged: MessageObject = structuredClone(base)

  for (const [key, value] of Object.entries(override)) {
    if (Array.isArray(value)) {
      merged[key] = structuredClone(value)
      continue
    }

    if (isObject(value) && isObject(merged[key])) {
      merged[key] = deepMergeMessages(merged[key] as MessageObject, value)
      continue
    }

    merged[key] = value
  }

  return merged
}

function flatten(value: unknown, prefix = '', output = new Map<string, string>()) {
  if (typeof value === 'string') {
    output.set(prefix, value)
    return output
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, prefix ? `${prefix}.${index}` : String(index), output))
    return output
  }

  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, output)
    }
  }

  return output
}

function collectMissingPaths(
  base: MessageObject,
  override: MessageObject | undefined,
  pathSegments: string[] = [],
): string[] {
  const missing: string[] = []

  for (const [key, baseValue] of Object.entries(base)) {
    const nextPath = [...pathSegments, key]
    const overrideValue = override?.[key]

    if (overrideValue === undefined) {
      if (Array.isArray(baseValue)) {
        baseValue.forEach((item, index) => {
          if (isObject(item)) {
            missing.push(...collectMissingPaths(item, undefined, [...nextPath, String(index)]))
          } else {
            missing.push([...nextPath, String(index)].join('.'))
          }
        })
      } else if (isObject(baseValue)) {
        missing.push(...collectMissingPaths(baseValue, undefined, nextPath))
      } else {
        missing.push(nextPath.join('.'))
      }
      continue
    }

    if (Array.isArray(baseValue) && Array.isArray(overrideValue)) {
      const max = Math.max(baseValue.length, overrideValue.length)
      for (let index = 0; index < max; index += 1) {
        const baseItem = baseValue[index]
        const overrideItem = overrideValue[index]
        const arrayPath = [...nextPath, String(index)]
        if (overrideItem === undefined) {
          if (isObject(baseItem)) {
            missing.push(...collectMissingPaths(baseItem, undefined, arrayPath))
          } else if (baseItem !== undefined) {
            missing.push(arrayPath.join('.'))
          }
          continue
        }

        if (isObject(baseItem) && isObject(overrideItem)) {
          missing.push(...collectMissingPaths(baseItem, overrideItem, arrayPath))
        }
      }
      continue
    }

    if (isObject(baseValue) && isObject(overrideValue)) {
      missing.push(...collectMissingPaths(baseValue, overrideValue, nextPath))
    }
  }

  return missing
}

function normalizeForScriptCheck(value: string) {
  return value.replace(/\{[^}]+\}/g, '').replace(/`[^`]+`/g, '').trim()
}

function shouldIgnoreMixedScript(value: string) {
  const normalized = normalizeForScriptCheck(value)
  if (!normalized) {
    return true
  }

  if (normalized.includes('@') || normalized.includes('http://') || normalized.includes('https://')) {
    return true
  }

  if (allowedArabicTechnicalTokens.some((token) => normalized.includes(token))) {
    return true
  }

  if (/\b\d+[Kk]\+?\b/.test(normalized) || /\bsk-[A-Za-z0-9]+\b/.test(normalized)) {
    return true
  }

  return false
}

function isPriceLike(value: string) {
  return /^[\s$€£¥0-9,./+-]+$/.test(value.trim())
}

function shouldIgnoreExactEnglish(_locale: string, key: string, value: string) {
  return (
    !normalizeForScriptCheck(value) ||
    key.endsWith('.id') ||
    key.endsWith('.command') ||
    key.endsWith('.apiKeyPlaceholder') ||
    key === 'auth.fields.email.placeholder' ||
    (key.endsWith('.note') && value.includes('[Unit]')) ||
    key === 'nav.brand' ||
    key === 'nav.brandTag' ||
    key === 'footer.brand' ||
    key === 'footer.links.github' ||
    key.endsWith('ctaHref') ||
    key.endsWith('url') ||
    key.endsWith('Url') ||
    key.endsWith('href') ||
    key.endsWith('Href') ||
    key.endsWith('price') ||
    key.endsWith('anchorPrice') ||
    key === 'contactForm.companyPlaceholder' ||
    (value.includes('@') && key.endsWith('emailPlaceholder')) ||
    value === 'PicoMUTX' ||
    value === 'MUTX' ||
    isPriceLike(value)
  )
}

const englishJson = readJson(path.join(messagesDir, `${baseLocale}.json`))
const defaultEnglish = getPicoDefaultMessages() as unknown as MessageObject
const englishPico = deepMergeMessages(
  (defaultEnglish[picoKey] as MessageObject | undefined) ?? {},
  (englishJson[picoKey] as MessageObject | undefined) ?? {},
)
const english = flatten(englishPico)
const localeFiles = fs.readdirSync(messagesDir).filter((file) => file.endsWith('.json') && file !== `${baseLocale}.json`)
const issues: string[] = []

for (const file of localeFiles) {
  const locale = path.basename(file, '.json')
  const localeJson = readJson(path.join(messagesDir, file))
  const localePico = (localeJson[picoKey] as MessageObject | undefined) ?? {}
  const flattened = flatten(localePico)
  const missingPaths = collectMissingPaths(englishPico, localePico)

  for (const namespace of requiredNamespaces) {
    if (!(namespace in localePico)) {
      issues.push(`${locale}: missing pico.${namespace}`)
    }
  }

  for (const missingPath of missingPaths.slice(0, maxMissingReportsPerLocale)) {
    issues.push(`${locale}: missing pico.${missingPath}`)
  }
  if (missingPaths.length > maxMissingReportsPerLocale) {
    issues.push(
      `${locale}: +${missingPaths.length - maxMissingReportsPerLocale} more missing pico keys`,
    )
  }

  for (const [key, value] of flattened.entries()) {
    const source = english.get(key)
    const normalized = value.trim()
    if (!normalized) {
      continue
    }

    if (exactEnglishLocales.has(locale) && source && normalized === source.trim() && !shouldIgnoreExactEnglish(locale, key, normalized)) {
      issues.push(`${locale}:${key}: exact English fallback`)
    }

    if (
      locale === 'ar' &&
      !key.endsWith('.command') &&
      !(key.endsWith('.note') && normalized.includes('[Unit]')) &&
      !shouldIgnoreMixedScript(normalized) &&
      arabicPattern.test(normalizeForScriptCheck(normalized)) &&
      (latinPattern.test(normalizeForScriptCheck(normalized)) || hanPattern.test(normalizeForScriptCheck(normalized)))
    ) {
      issues.push(`${locale}:${key}: mixed-script contamination`)
    }
  }
}

if (issues.length > 0) {
  console.error('Pico i18n QA failed:')
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log('Pico i18n QA passed.')
