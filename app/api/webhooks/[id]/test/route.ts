import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl, getAuthToken } from "@/app/api/_lib/controlPlane";

const API_BASE_URL = getApiBaseUrl();

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken(request);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const response = await fetch(`${API_BASE_URL}/webhooks/${id}/test`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Failed to test webhook" }, { status: response.status });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Webhooks test POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
