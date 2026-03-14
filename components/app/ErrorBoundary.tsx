"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/5 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-400/10 text-rose-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-white">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            {this.state.error?.message || "An unexpected error occurred while loading this page."}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
