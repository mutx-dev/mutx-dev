import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const messagesDir = path.join(repoRoot, 'messages')
const baseLocale = 'en'
const picoKey = 'pico'
const arabicPattern = /\p{Script=Arabic}/u
const latinPattern = /[A-Za-z]/
const hanPattern = /\p{Script=Han}/u
const exactEnglishLocales = new Set(['ko', 'zh', 'ar'])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function flatten(value, prefix = '', output = new Map()) {
  if (typeof value === 'string') {
    output.set(prefix, value)
    return output
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, prefix ? `${prefix}.${index}` : String(index), output))
    return output
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, output)
    }
  }

  return output
}

function shouldIgnoreMixedScript(value) {
  return value.includes('PicoMUTX') || value.includes('MUTX') || value.includes('GitHub') || value.includes('SaaS') || value.includes('@')
}

function shouldIgnoreExactEnglish(_locale, key, value) {
  return key === 'nav.brand' || key === 'nav.brandTag' || key === 'footer.links.github' || key === 'contactForm.companyPlaceholder' || (value.includes('@') && key.endsWith('emailPlaceholder'))
}

const english = flatten(readJson(path.join(messagesDir, `${baseLocale}.json`))[picoKey])
const localeFiles = fs.readdirSync(messagesDir).filter((file) => file.endsWith('.json') && file !== `${baseLocale}.json`)
const issues = []

for (const file of localeFiles) {
  const locale = path.basename(file, '.json')
  const flattened = flatten(readJson(path.join(messagesDir, file))[picoKey])

  for (const [key, value] of flattened.entries()) {
    const source = english.get(key)
    if (typeof value !== 'string') {
      continue
    }

    const normalized = value.trim()
    if (!normalized) {
      continue
    }

    if (exactEnglishLocales.has(locale) && source && normalized === source.trim() && !shouldIgnoreExactEnglish(locale, key, normalized)) {
      issues.push(`${locale}:${key}: exact English fallback`)
    }

    if (locale === 'ar' && !shouldIgnoreMixedScript(normalized) && arabicPattern.test(normalized) && (latinPattern.test(normalized) || hanPattern.test(normalized))) {
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
