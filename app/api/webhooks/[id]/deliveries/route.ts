import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl, getAuthToken } from "@/app/api/_lib/controlPlane";

const API_BASE_URL = getApiBaseUrl();

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken(request);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const event = searchParams.get("event");
    const success = searchParams.get("success");
    const limit = searchParams.get("limit") || "50";

    const queryParams = new URLSearchParams();
    if (event) queryParams.set("event", event);
    if (success) queryParams.set("success", success);
    queryParams.set("limit", limit);

    const response = await fetch(
      `${API_BASE_URL}/v1/webhooks/${id}/deliveries?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.detail || "Failed to fetch deliveries" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ deliveries: data });
  } catch (error) {
    console.error("Webhooks deliveries GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
