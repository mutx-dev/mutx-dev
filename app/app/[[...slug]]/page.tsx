import { redirect } from "next/navigation";

function toSearchString(searchParams: Record<string, string | string[] | undefined> | undefined) {
  if (!searchParams) {
    return "";
  }

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export default async function LegacyAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const suffix = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  const search = toSearchString(resolvedSearchParams);

  redirect(`/dashboard${suffix}${search}`);
}
