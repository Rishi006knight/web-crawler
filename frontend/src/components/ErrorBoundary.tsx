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
          <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6" role="alert">
            <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-red-400">
                <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                <h1 className="text-xl font-bold text-slate-100">Application Error</h1>
              </div>
              <p className="text-sm text-slate-300">
                {this.state.error?.message || 'An unexpected runtime error occurred. State has been protected.'}
              </p>
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Application</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition border border-slate-700"
                >
                  Try Recovering
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-xl my-4 text-center space-y-3" role="alert">
          <div className="flex items-center justify-center space-x-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-sm">{this.props.fallbackTitle || 'Component Failed to Render'}</span>
          </div>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            {this.props.fallbackMessage || this.state.error?.message || 'An error occurred displaying this component.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition border border-slate-700"
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
