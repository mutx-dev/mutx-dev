export type CalendlyGateAction = "wait" | "open" | "challenge";

export function getCalendlyGateAction(options: {
  loadingSiteKey: boolean;
  siteKey: string;
  captchaToken: string | null;
}): CalendlyGateAction {
  if (options.loadingSiteKey) return "wait";
  if (!options.siteKey) return "open";
  return options.captchaToken ? "open" : "challenge";
}
