import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  isRoot?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.isRoot) {
        return (
          <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-6" role="alert">
            <div className="max-w-md w-full bg-surface-raised border border-status-danger-line rounded-2xl p-6 shadow-floating space-y-4">
              <div className="flex items-center space-x-3 text-status-danger">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <h1 className="text-xl font-bold text-ink-strong">Application Error</h1>
              </div>
              <p className="text-sm text-ink-secondary">
                {this.state.error?.message || 'An unexpected runtime error occurred. State has been protected.'}
              </p>
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-lg transition shadow-hairline focus-ring"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Application</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2.5 bg-surface-sunken hover:bg-surface text-ink text-sm font-medium rounded-lg transition border border-line focus-ring"
                >
                  Try Recovering
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="p-6 bg-status-danger-bg border border-status-danger-line rounded-xl my-4 text-center space-y-3" role="alert">
          <div className="flex items-center justify-center space-x-2 text-status-danger">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-sm">{this.props.fallbackTitle || 'Component Failed to Render'}</span>
          </div>
          <p className="text-xs text-ink-muted max-w-lg mx-auto">
            {this.props.fallbackMessage || this.state.error?.message || 'An error occurred displaying this component.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-surface-raised hover:bg-surface text-ink text-xs font-medium rounded-md transition border border-line shadow-hairline focus-ring"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
