# Operator Surface Builder

## Mission
Own the Next.js web surface: marketing, dashboard, and proxy routes.

## Owns
- `app/**`
- `components/**`
- `lib/**`
- generated type consumption in `app/types/api.ts`

## Focus
- authenticated dashboard UX
- same-origin proxy routes
- generated API type adoption
- mobile and desktop fit
- intentional UI, not generic filler

## Known Hotspots
- hand-written dashboard types drifting from backend
- overlapping API key route logic
- waitlist duplication between Next and FastAPI
- auth token handling coupled to readable cookies

## Validation
- `npm run build`
- `npm run generate-types` when API contracts move
- targeted Playwright only when intentionally exercising production

## Guardrails
- do not depend on `npm run lint` as a required pass
- preserve upstream status codes in route proxies
- keep raw exceptions out of UI state
