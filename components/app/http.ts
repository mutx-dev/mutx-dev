export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export function extractApiErrorMessage(payload: unknown, fallback = "Request failed") {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as Record<string, unknown>;

  const detail = record.detail;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  const message = record.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  const error = record.error;
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    const nestedMessage = (error as Record<string, unknown>).message;
    if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
      return nestedMessage;
    }

    const nestedCode = (error as Record<string, unknown>).code;
    if (typeof nestedCode === "string" && nestedCode.trim().length > 0) {
      return nestedCode;
    }
  }

  return fallback;
}

function extractApiErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;

  const record = payload as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object") {
    const code = (error as Record<string, unknown>).code;
    if (typeof code === "string" && code.trim().length > 0) {
      return code;
    }
  }

  const code = record.code;
  if (typeof code === "string" && code.trim().length > 0) {
    return code;
  }

  return undefined;
}

async function parseJsonResponse(response: Response) {
  return response.json().catch(() => ({ detail: "Request failed" }));
}

function assertOk(response: Response, payload: unknown) {
  if (response.ok) return;

  throw new ApiRequestError(
    extractApiErrorMessage(payload, "Request failed"),
    response.status,
    extractApiErrorCode(payload),
  );
}

export async function readJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const payload = await parseJsonResponse(response);

  assertOk(response, payload);

  return payload as T;
}

export async function writeJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const payload = await parseJsonResponse(response);

  assertOk(response, payload);

  return payload as T;
}
