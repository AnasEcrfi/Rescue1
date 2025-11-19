import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary für robustere React-Komponenten
 *
 * Fängt JavaScript-Fehler in Child-Komponenten ab und zeigt ein Fallback-UI
 * statt die ganze App zum Absturz zu bringen.
 *
 * @example
 * <ErrorBoundary componentName="VehicleList">
 *   <VehicleList />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { componentName, onError } = this.props;

    // Log error to console
    console.error(
      `❌ Error Boundary caught error in ${componentName || 'Component'}:`,
      error,
      errorInfo
    );

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // In production: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '20px',
            margin: '10px',
            border: '2px solid #ff4444',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            color: '#ff4444',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
            ⚠️ Fehler in {componentName || 'Komponente'}
          </h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            Ein Fehler ist aufgetreten. Die Komponente konnte nicht geladen werden.
          </p>
          <details style={{ fontSize: '12px', marginBottom: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Fehlerdetails anzeigen
            </summary>
            <pre
              style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '11px',
              }}
            >
              {error?.toString()}
              {errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            🔄 Erneut versuchen
          </button>
        </div>
      );
    }

    return children;
  }
}

/**
 * Kompakte Error Boundary für kleinere Komponenten
 * Zeigt nur eine minimale Fehlermeldung
 */
export class CompactErrorBoundary extends ErrorBoundary {
  render(): ReactNode {
    const { hasError } = this.state;
    const { children, componentName } = this.props;

    if (hasError) {
      return (
        <div
          style={{
            padding: '10px',
            margin: '5px',
            border: '1px solid #ff4444',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 68, 68, 0.05)',
            color: '#ff4444',
            fontSize: '12px',
          }}
        >
          ⚠️ {componentName || 'Komponente'} konnte nicht geladen werden
          <button
            onClick={this.handleReset}
            style={{
              marginLeft: '10px',
              padding: '2px 8px',
              backgroundColor: 'transparent',
              color: '#ff4444',
              border: '1px solid #ff4444',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Erneut versuchen
          </button>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC (Higher-Order Component) für Error Boundary
 *
 * @example
 * export default withErrorBoundary(VehicleList, 'VehicleList');
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary componentName={componentName || Component.name} fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
