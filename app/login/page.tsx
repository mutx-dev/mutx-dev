import { AuthPage } from "@/components/auth/AuthPage";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;

  return <AuthPage mode="login" nextPath={nextPath} />;
}
