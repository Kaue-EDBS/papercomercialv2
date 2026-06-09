import { Component, ReactNode } from 'react';
import { reportError } from '@/lib/telemetry';

interface Props { children: ReactNode; fallbackTitle?: string }
interface State { hasError: boolean; error: Error | null }

/**
 * (#2) Captura erros de render em qualquer árvore filha e mostra um fallback
 * humano em vez de tela branca. Erros são reportados via telemetry para
 * análise posterior (#8).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    reportError(error, { componentStack: info.componentStack, source: 'ErrorBoundary' });
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="min-h-[60vh] flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="text-3xl" aria-hidden>⚠️</div>
          <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--navy))' }}>
            {this.props.fallbackTitle ?? 'Algo deu errado nesta tela'}
          </h2>
          <p className="text-sm text-muted-foreground">
            O erro foi registrado automaticamente. Você pode tentar novamente ou recarregar a página.
          </p>
          {this.state.error?.message && (
            <pre className="text-[10px] text-left bg-muted rounded p-2 overflow-auto max-h-24 text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={this.reset}
              className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
            >
              Tentar novamente
            </button>
            <button
              onClick={this.reload}
              className="px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
            >
              Recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}