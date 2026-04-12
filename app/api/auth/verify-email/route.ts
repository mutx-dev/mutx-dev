import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { withErrorHandling } from "@/app/api/_lib/errors";
import { schemas, validateRequest } from "@/app/api/_lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const validation = await validateRequest(schemas.verifyEmail, req);
    if (!validation.success) {
      return validation.response;
    }

    const response = await fetch(`${getApiBaseUrl()}/v1/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validation.data),
      cache: "no-store",
    });

    const payload = await response
      .json()
      .catch(() => ({ detail: "Failed to verify email" }));
    return NextResponse.json(payload, { status: response.status });
  })(request);
}
