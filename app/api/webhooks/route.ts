import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, getAuthToken } from "@/app/api/_lib/controlPlane";
import { validateRequest, schemas } from "@/app/api/_lib/validation";
import { withErrorHandling, unauthorized } from "@/app/api/_lib/errors";

const API_BASE_URL = getApiBaseUrl();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request);
    
    if (!token) {
      return unauthorized()
    }

    const response = await fetch(`${API_BASE_URL}/v1/webhooks`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Failed to fetch webhooks" }, { status: response.status });
    }
    
    const data = await response.json();
    const webhooks = Array.isArray(data) ? data : data?.webhooks ?? [];
    return NextResponse.json({ webhooks });
  })(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request);
    
    if (!token) {
      return unauthorized()
    }

    const validation = await validateRequest(schemas.webhookCreate, req)
    if (!validation.success) {
      return validation.response
    }

    const response = await fetch(`${API_BASE_URL}/v1/webhooks`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(validation.data)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Failed to create webhook" }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  })(request)
}
