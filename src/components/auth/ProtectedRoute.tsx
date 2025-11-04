import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSaasAdmin?: boolean;
}

/**
 * Protected Route Component
 * Protects routes from unauthorized access
 * Redirects to /auth if not authenticated
 * Optionally requires admin or saas admin role
 */
export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSaasAdmin = false 
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isSaasAdmin, profile } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if profile exists
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Erro: Perfil não encontrado</p>
          <p className="text-sm text-muted-foreground">Entre em contato com o suporte</p>
        </div>
      </div>
    );
  }

  // Check if tenant_id exists (multi-tenancy requirement)
  if (!profile.tenant_id && !isSaasAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Erro: Tenant não encontrado</p>
          <p className="text-sm text-muted-foreground">Usuário não está associado a uma empresa</p>
        </div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin && !isSaasAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Acesso Negado</p>
          <p className="text-sm text-muted-foreground">Você não tem permissão de administrador</p>
          <a href="/dashboard" className="text-primary hover:underline">Voltar ao Dashboard</a>
        </div>
      </div>
    );
  }

  // Check saas admin requirement
  if (requireSaasAdmin && !isSaasAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Acesso Negado</p>
          <p className="text-sm text-muted-foreground">Apenas administradores SaaS podem acessar</p>
          <a href="/dashboard" className="text-primary hover:underline">Voltar ao Dashboard</a>
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}
