import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

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
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--error-bg)', border: '1px solid var(--error-border)', marginBottom: 24 }}>
              <AlertTriangle size={32} style={{ color: 'var(--error)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Something went wrong</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                An unexpected error occurred. This has been logged automatically.
              </p>
              {this.state.error && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--error)', fontFamily: 'var(--font-mono, monospace)', marginTop: 12, padding: 12, borderRadius: 'var(--radius-lg)', background: 'var(--error-bg)', border: '1px solid var(--error-border)', wordBreak: 'break-all' }}>
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              <button
                onClick={this.handleRetry}
                className="btn btn-primary"
              >
                <RotateCcw size={16} />
                Try Again
              </button>
              <a
                href="/"
                className="btn btn-secondary"
              >
                <Home size={16} />
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
