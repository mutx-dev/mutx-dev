# JavaScript dependency review — 2026-10-01

This source change covers the website, Electron shell, and Capacitor JavaScript dependencies. Python package modernization is a separate U11 slice. It does not qualify an Android build, a signed desktop release, or a production deployment.

## Compatible updates

Capacitor core, Android, and CLI move together to 8.5.2. Motion moves to 13.4.6; its [official migration guide](https://motion.dev/docs/react-upgrade-guide) describes the removed optional Emotion prop-validation integration. MUTX has no Emotion integration to migrate. The remaining compatible updates include icons, locale handling, PostgreSQL and email clients, social-image rendering, image processing, and lint/test tooling.

The Capacitor Xcode writer still depends on a vulnerable UUID release. The scoped `xcode` override selects UUID 11.1.1, which retains the CommonJS `v4` interface. The dependency compatibility script requires an installed Xcode writer, verifies the UUID package actually resolved by that writer is at least the patched 11.1.1 release, and checks that it produces unique 24-character uppercase hexadecimal IDs.

## Compatibility holds

- **Electron 43.7.7:** latest patch of the supported 43 line. Electron 44 [drops macOS 12](https://www.electronjs.org/docs/latest/breaking-changes). The product still declares macOS 12 as its minimum. The installed 43.7.7 macOS binary reports `LSMinimumSystemVersion=12.0`. Revisit the major update when the supported platform floor changes; do not silently raise it in a dependency patch.
- **TypeScript 5.9.3:** `openapi-typescript@7.13.0` declares peer `typescript:^5.x`. A 6.0.3 trial type-checked, but npm rejected the package graph on this peer contract; it also required Jest root-directory adjustments. TypeScript 7.0.2 is beyond `ts-jest@29.4.14` support (`>=4.3 <7`). Revisit when the generator and test transformer support the new compiler together. No forced peer resolution is used.
- **Node type declarations 24.19.0:** aligned to the Node 24 runtime used by Vercel and repository engines. Latest Node 26 declarations would describe APIs outside the supported runtime.

## Verification

The checked lock installed successfully. Full frontend suite: 121 suites, 1,294 tests passed. Production build, lint, typecheck, and JavaScript dependency compatibility checks passed. npm audit reports zero advisories. `npm outdated --json` lists only the three explicit holds above. Electron macOS binary metadata was inspected; its bundled Node runtime also starts. Real Motion 13 browser interactions covered Pico onboarding package recovery, academy controls, contact intake, and lesson progress in Chrome, Firefox, and Safari. Ten of twelve initial parallel cases passed; the two timing failures passed in all three engines when rerun serially, as did the matched Motion 12 baseline. Six additional real Motion 13 mobile cases exercised contact error-to-success transitions, closing, and keyboard focus restoration with ordinary and reduced motion in all three engines. Browser timing remains a test gap; authenticated operator screens still need focused qualification. Native Android packaging, signed/notarized desktop artifacts, and hosted deployment require their own release checks.

## Maintained direct dependency inventory

Versions below are the installed lockfile versions reviewed on 2026-10-01. Dependencies not listed as a hold had no newer release in the npm inventory at this check.

| Dependency | Declared | Locked | Disposition |
| --- | --- | --- | --- |
| `@capacitor/android` | `8.5.2` | `8.5.2` | Current compatible release |
| `@capacitor/cli` | `8.5.2` | `8.5.2` | Current compatible release |
| `@capacitor/core` | `8.5.2` | `8.5.2` | Current compatible release |
| `@electron/notarize` | `^3.1.1` | `3.1.1` | Current compatible release |
| `@eslint/eslintrc` | `^3.3.6` | `3.3.7` | Current compatible release |
| `@eslint/js` | `^10.0.1` | `10.0.1` | Current compatible release |
| `@next/eslint-plugin-next` | `16.3.8` | `16.3.8` | Current compatible release |
| `@playwright/test` | `^1.61.1` | `1.63.0` | Current compatible release |
| `@radix-ui/react-accordion` | `^1.2.16` | `1.2.20` | Current compatible release |
| `@radix-ui/react-dialog` | `^1.1.19` | `1.1.23` | Current compatible release |
| `@radix-ui/react-navigation-menu` | `^1.2.18` | `1.2.22` | Current compatible release |
| `@radix-ui/react-select` | `^2.3.3` | `2.3.7` | Current compatible release |
| `@radix-ui/react-separator` | `^1.1.11` | `1.1.15` | Current compatible release |
| `@radix-ui/react-slot` | `^1.3.0` | `1.3.3` | Current compatible release |
| `@radix-ui/react-tabs` | `^1.1.17` | `1.1.21` | Current compatible release |
| `@radix-ui/react-tooltip` | `^1.2.12` | `1.2.16` | Current compatible release |
| `@resvg/resvg-js` | `^2.6.2` | `2.6.2` | Current compatible release |
| `@tailwindcss/postcss` | `^4.3.3` | `4.3.3` | Current compatible release |
| `@types/jest` | `^30.0.0` | `30.0.0` | Current compatible release |
| `@types/node` | `24.19.0` | `24.19.0` | Hold: Node 24 runtime |
| `@types/pg` | `^8.20.0` | `8.23.1` | Current compatible release |
| `@types/react` | `^19.2.17` | `19.3.0` | Current compatible release |
| `@types/react-dom` | `^19.2.3` | `19.3.0` | Current compatible release |
| `@types/three` | `^0.186.0` | `0.186.0` | Current compatible release |
| `class-variance-authority` | `^0.7.1` | `0.7.1` | Current compatible release |
| `clsx` | `^2.1.1` | `2.1.1` | Current compatible release |
| `cmdk` | `^1.1.1` | `1.1.1` | Current compatible release |
| `electron` | `43.7.7` | `43.7.7` | Hold: macOS 12 support |
| `electron-builder` | `^26.15.3` | `26.15.3` | Current compatible release |
| `embla-carousel-react` | `^8.6.0` | `8.6.0` | Current compatible release |
| `eslint` | `^10.7.0` | `10.11.0` | Current compatible release |
| `framer-motion` | `^13.4.6` | `13.4.6` | Current compatible release |
| `fuse.js` | `^7.5.0` | `7.5.0` | Current compatible release |
| `geist` | `^1.7.2` | `1.7.2` | Current compatible release |
| `globals` | `^17.7.0` | `17.12.0` | Current compatible release |
| `gray-matter` | `^4.0.3` | `4.0.3` | Current compatible release |
| `highlight.js` | `^11.11.1` | `11.12.0` | Current compatible release |
| `jest` | `^30.4.2` | `30.5.2` | Current compatible release |
| `lenis` | `^1.3.25` | `1.3.26` | Current compatible release |
| `lucide-react` | `^1.49.0` | `1.49.0` | Current compatible release |
| `next` | `16.3.8` | `16.3.8` | Current compatible release |
| `next-intl` | `^4.14.8` | `4.14.8` | Current compatible release |
| `openapi-typescript` | `^7.13.0` | `7.13.0` | Current compatible release |
| `pg` | `^8.23.1` | `8.23.1` | Current compatible release |
| `playwright` | `^1.61.1` | `1.63.0` | Current compatible release |
| `postcss` | `^8.5.28` | `8.5.28` | Current compatible release |
| `postgres` | `^3.4.9` | `3.4.9` | Current compatible release |
| `react` | `^19.2.7` | `19.3.0` | Current compatible release |
| `react-dom` | `^19.2.7` | `19.3.0` | Current compatible release |
| `react-intersection-observer` | `^11.0.1` | `11.0.1` | Current compatible release |
| `react-turnstile` | `^1.1.5` | `1.1.5` | Current compatible release |
| `rehype-autolink-headings` | `^7.1.0` | `7.1.0` | Current compatible release |
| `rehype-highlight` | `^7.0.2` | `7.0.2` | Current compatible release |
| `rehype-sanitize` | `^6.0.0` | `6.0.0` | Current compatible release |
| `rehype-slug` | `^6.0.0` | `6.0.0` | Current compatible release |
| `rehype-stringify` | `^10.0.1` | `10.0.1` | Current compatible release |
| `remark` | `^15.0.1` | `15.0.1` | Current compatible release |
| `remark-gfm` | `^4.0.1` | `4.0.1` | Current compatible release |
| `remark-parse` | `^11.0.0` | `11.0.0` | Current compatible release |
| `remark-rehype` | `^11.1.2` | `11.1.2` | Current compatible release |
| `resend` | `^6.31.0` | `6.31.0` | Current compatible release |
| `satori` | `^0.33.5` | `0.33.5` | Current compatible release |
| `sharp` | `^0.35.5` | `0.35.5` | Current compatible release |
| `sonner` | `^2.0.8` | `2.0.8` | Current compatible release |
| `tailwind-merge` | `^3.7.0` | `3.7.0` | Current compatible release |
| `tailwindcss` | `^4.3.3` | `4.3.3` | Current compatible release |
| `ts-jest` | `^29.4.14` | `29.4.14` | Current compatible release |
| `typescript` | `5.9.3` | `5.9.3` | Hold: generator/test peers |
| `typescript-eslint` | `^8.71.0` | `8.71.0` | Current compatible release |
| `unified` | `^11.0.5` | `11.0.5` | Current compatible release |
| `zod` | `^4.4.3` | `4.6.5` | Current compatible release |
| `zustand` | `^5.0.14` | `5.0.15` | Current compatible release |
