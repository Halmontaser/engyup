"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Activity Component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-4 mx-auto max-w-2xl w-full">
          <AlertTriangle className="text-red-500 mt-1 shrink-0" size={24} />
          <div className="w-full">
            <h4 className="text-lg font-bold text-red-800 dark:text-red-400">Activity Error</h4>
            <p className="text-red-700 dark:text-red-300 mt-1 text-sm">
              We encountered an issue while loading this activity. You can try skipping it or refreshing the page.
            </p>
            {this.state.error && (
              <details className="mt-4 w-full">
                <summary className="text-sm cursor-pointer font-medium mb-2 text-red-800 dark:text-red-400">
                  Technical Details
                </summary>
                <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded-xl overflow-x-auto text-xs text-red-900 dark:text-red-200 font-mono">
                  {this.state.error.toString()}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
