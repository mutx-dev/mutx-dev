"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle, Command, Loader2, Lock, Mail, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading: authLoading, error: authError } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const [emailError, setEmailError] = useState("");

  const passwordStrength = getPasswordStrength(password);
  const isFormValid = email && password && confirmPassword && acceptTerms && password === confirmPassword;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  useEffect(() => {
    if (touched.password && password && password.length < 8) {
      // Password length validation is handled inline
    }
  }, [password, touched.password]);

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setEmailError(validateEmail(email));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true, confirmPassword: true });

    const emailValidation = validateEmail(email);
    setEmailError(emailValidation);

    if (emailValidation) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name || undefined);
      setSuccess(true);
      setTimeout(() => {
        router.push("/app");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading && !success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030307]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#030307] px-4 py-12">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>
        
        <div className="relative flex flex-col items-center text-center animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Account created!</h1>
          <p className="text-slate-400 mb-6">Redirecting you to the dashboard...</p>
          <div className="flex items-center gap-2 text-emerald-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Setting up your workspace</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#030307] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] h-[25%] w-[25%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md space-y-6 animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 transition-transform hover:scale-105">
            <Command className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Get started with MUTX control plane
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || authError) && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error || authError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-slate-300">
              Full name <span className="text-slate-500">(optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${touched.email && !emailError && email ? 'text-emerald-400' : 'text-slate-500'}`} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) setEmailError(validateEmail(e.target.value));
                }}
                onBlur={handleEmailBlur}
                required
                className={`w-full rounded-xl border bg-black/40 py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${
                  touched.email && emailError
                    ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/20'
                    : touched.email && !emailError && email
                    ? 'border-emerald-400/50 focus:border-emerald-400/50 focus:ring-emerald-400/20'
                    : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400/20'
                }`}
                placeholder="you@example.com"
              />
              {touched.email && !emailError && email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
              )}
            </div>
            {touched.email && emailError && (
              <p className="text-xs text-red-400 mt-1 ml-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                required
                minLength={8}
                className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-12 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength.score >= level ? passwordStrength.color : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    passwordStrength.label === "Weak" ? "text-red-400" :
                    passwordStrength.label === "Fair" ? "text-orange-400" :
                    passwordStrength.label === "Good" ? "text-yellow-400" :
                    "text-emerald-400"
                  }`}>
                    Password strength: {passwordStrength.label}
                  </span>
                  {password.length < 8 && (
                    <span className="text-xs text-slate-500">Min. 8 characters</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
              Confirm Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
                touched.confirmPassword && confirmPassword && password === confirmPassword ? 'text-emerald-400' : 'text-slate-500'
              }`} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                required
                className={`w-full rounded-xl border bg-black/40 py-3 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${
                  touched.confirmPassword && confirmPassword && password !== confirmPassword
                    ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/20'
                    : touched.confirmPassword && confirmPassword && password === confirmPassword
                    ? 'border-emerald-400/50 focus:border-emerald-400/50 focus:ring-emerald-400/20'
                    : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400/20'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {touched.confirmPassword && confirmPassword && password === confirmPassword && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
              )}
            </div>
            {touched.confirmPassword && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1 ml-1">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/20 text-cyan-400 focus:ring-cyan-400/20 focus:ring-offset-0"
            />
            <label htmlFor="terms" className="text-sm text-slate-400">
              I agree to the{" "}
              <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3.5 text-sm font-medium text-black transition-all hover:bg-cyan-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
