import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Captura erros não tratados em qualquer componente filho e exibe UI de fallback elegante.
 * Previne que toda aplicação quebre por erros isolados.
 * 
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualiza state para que próximo render mostre fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para serviço de monitoramento (ex: Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Aqui você poderia enviar para serviço de tracking:
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado passado por prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
          <Card className="max-w-2xl w-full glass-card border-destructive/20 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-destructive animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Oops! Algo deu errado</CardTitle>
              <CardDescription className="text-base">
                Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Detalhes do Erro (DEV MODE)
                  </h3>
                  <details className="text-sm space-y-2">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      {this.state.error.message}
                    </summary>
                    <pre className="mt-2 p-3 rounded bg-black/20 overflow-auto max-h-60 text-xs">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="mt-2 p-3 rounded bg-black/20 overflow-auto max-h-60 text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </details>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleReset} 
                  size="lg"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  Voltar ao Início
                </Button>
              </div>

              {/* Help text */}
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Se o problema persistir, tente:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Limpar cache do navegador (Ctrl+Shift+Del)</li>
                  <li>Fazer logout e login novamente</li>
                  <li>Contatar o suporte técnico</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
