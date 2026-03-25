"use client";

import { useState, useEffect } from "react";
import { Bot, Shield, Zap, CheckCircle, Circle, ArrowRight, Terminal, Loader2 } from "lucide-react";

type StepStatus = "pending" | "running" | "complete" | "error";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  error?: string;
}

const STEPS: Omit<OnboardingStep, "status" | "error">[] = [
  {
    id: "cli",
    title: "Install MUTX CLI",
    description: "Setting up the MUTX command-line interface",
  },
  {
    id: "auth",
    title: "Authenticate",
    description: "Sign in to your MUTX account",
  },
  {
    id: "provider",
    title: "Select Runtime",
    description: "Choose OpenClaw as your AI runtime",
  },
  {
    id: "runtime",
    title: "Install Runtime",
    description: "Installing OpenClaw runtime with Faramesh governance",
  },
  {
    id: "governance",
    title: "Configure Governance",
    description: "Setting up agent decision-making engine",
  },
  {
    id: "deploy",
    title: "Deploy Assistant",
    description: "Creating your first AI assistant",
  },
  {
    id: "verify",
    title: "Launch Dashboard",
    description: "Starting the MUTX dashboard",
  },
];

export default function OnboardingPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(
    STEPS.map((s) => ({ ...s, status: "pending" }))
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const updateStep = (id: string, status: StepStatus, error?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, error } : s))
    );
  };

  const runSetup = async () => {
    updateStep("cli", "running");
    addLog("Checking for MUTX CLI...");

    await new Promise((r) => setTimeout(r, 1000));
    updateStep("cli", "complete");
    addLog("CLI found: mutx 1.2.0");

    setCurrentStepIndex(1);
    updateStep("auth", "running");
    addLog("Checking authentication status...");

    await new Promise((r) => setTimeout(r, 800));
    updateStep("auth", "complete");
    addLog("Authentication ready");

    setCurrentStepIndex(2);
    updateStep("provider", "running");
    addLog("Setting up OpenClaw as the AI runtime provider...");

    await new Promise((r) => setTimeout(r, 600));
    updateStep("provider", "complete");
    addLog("OpenClaw selected as provider");

    setCurrentStepIndex(3);
    updateStep("runtime", "running");
    addLog("Installing OpenClaw runtime...");
    addLog("Installing npm packages...");
    await new Promise((r) => setTimeout(r, 1500));
    addLog("Installing Faramesh governance engine...");
    await new Promise((r) => setTimeout(r, 1000));
    updateStep("runtime", "complete");
    addLog("Runtime installation complete");

    setCurrentStepIndex(4);
    updateStep("governance", "running");
    addLog("Configuring Faramesh governance policies...");
    await new Promise((r) => setTimeout(r, 800));
    updateStep("governance", "complete");
    addLog("Governance configured");

    setCurrentStepIndex(5);
    updateStep("deploy", "running");
    addLog("Deploying starter assistant template...");
    await new Promise((r) => setTimeout(r, 1200));
    updateStep("deploy", "complete");
    addLog("Assistant deployed successfully");

    setCurrentStepIndex(6);
    updateStep("verify", "running");
    addLog("Launching MUTX dashboard...");
    await new Promise((r) => setTimeout(r, 500));
    updateStep("verify", "complete");
    addLog("Setup complete!");

    await new Promise((r) => setTimeout(r, 500));
    setIsComplete(true);
  };

  const launchDashboard = () => {
    if (typeof window !== "undefined" && (window as any).mutxDesktop) {
      (window as any).mutxDesktop.closeOnboarding();
      (window as any).mutxDesktop.showMainWindow();
      (window as any).mutxDesktop.navigate("/dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "error":
        return <Circle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">MUTX</span>
          </div>
          <span className="text-sm text-gray-500">v1.2.0</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Panel - Steps */}
        <div className="w-1/2 p-8 border-r border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to MUTX</h1>
          <p className="text-gray-400 mb-8">
            Let&apos;s set up your AI operator environment in just a few steps.
          </p>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                  index === currentStepIndex && step.status === "running"
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : index < currentStepIndex || step.status === "complete"
                    ? "bg-green-500/5 border border-green-500/20"
                    : "bg-gray-900/50 border border-gray-800"
                }`}
              >
                {getStatusIcon(step.status)}
                <div className="flex-1">
                  <h3
                    className={`font-medium ${
                      index <= currentStepIndex ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                  {step.error && <p className="text-sm text-red-400 mt-1">{step.error}</p>}
                </div>
              </div>
            ))}
          </div>

          {!isComplete && steps.every((s) => s.status === "pending") && (
            <button
              onClick={runSetup}
              className="mt-8 w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Start Setup
              <ArrowRight className="h-5 w-5" />
            </button>
          )}

          {isComplete && (
            <button
              onClick={launchDashboard}
              className="mt-8 w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Launch Dashboard
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Right Panel - Terminal Logs */}
        <div className="w-1/2 p-8 bg-black/30">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-400">Setup Log</h2>
          </div>

          <div className="bg-black/50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-600">Waiting for setup to start...</p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className="text-gray-300 leading-relaxed">
                  {log}
                </p>
              ))
            )}
          </div>

          {/* Feature Highlights */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <Shield className="h-6 w-6 text-blue-500 mb-2" />
              <h3 className="text-sm font-medium text-white mb-1">Governance</h3>
              <p className="text-xs text-gray-500">
                Faramesh-powered agent decision-making
              </p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <Zap className="h-6 w-6 text-yellow-500 mb-2" />
              <h3 className="text-sm font-medium text-white mb-1">Local Runtime</h3>
              <p className="text-xs text-gray-500">
                OpenClaw running on your machine
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-600">
          Need help?{" "}
          <a href="https://mutx.dev/docs" className="text-blue-500 hover:underline">
            Documentation
          </a>{" "}
          or{" "}
          <a href="https://github.com/mutx-dev/mutx-dev/issues" className="text-blue-500 hover:underline">
            Report an Issue
          </a>
        </p>
      </footer>
    </div>
  );
}
