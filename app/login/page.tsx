import { AuthPage } from "@/components/auth/AuthPage";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
    email?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  return (
    <AuthPage
      mode="login"
      nextPath={nextPath}
      initialError={error}
      initialEmail={email}
    />
  );
}
