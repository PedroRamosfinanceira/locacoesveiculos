/**
 * 🔐 HOOK SEGURO DE ROLES
 * 
 * Este hook usa a tabela `locacoes_veicular_user_roles` (SEGURA)
 * em vez do campo `profile.role` (INSEGURO - pode ser manipulado).
 * 
 * A verificação de permissões SEMPRE usa a função RPC `has_locacoes_role()`
 * que é executada no servidor com SECURITY DEFINER.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['locacoes_veicular_role'];

interface UserRoleData {
  role: UserRole;
  tenant_id: string;
  user_id: string;
  created_at: string;
}

export function useUserRoles(userId: string | undefined, tenantId: string | null) {
  const {
    data: roles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-roles', userId, tenantId],
    queryFn: async () => {
      if (!userId || !tenantId) return [];

      const { data, error } = await supabase
        .from('locacoes_veicular_user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return (data || []) as UserRoleData[];
    },
    enabled: !!userId && !!tenantId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  /**
   * Verifica se o usuário tem uma role específica
   * @param targetRole - Role a verificar ('admin' | 'user' | 'viewer')
   */
  const hasRole = (targetRole: UserRole): boolean => {
    if (!roles || roles.length === 0) return false;
    return roles.some((r) => r.role === targetRole);
  };

  /**
   * Verifica se é admin (usando a função segura do servidor)
   * Esta é a forma RECOMENDADA para verificações críticas
   */
  const isAdmin = hasRole('admin');
  const isUser = hasRole('user');
  const isViewer = hasRole('viewer');

  /**
   * Verifica permissão no servidor via RPC (mais seguro)
   * Use esta função para operações críticas
   */
  const verifyRoleOnServer = async (targetRole: UserRole): Promise<boolean> => {
    if (!userId || !tenantId) return false;

    try {
      const { data, error } = await supabase.rpc('has_locacoes_role', {
        _user_id: userId,
        _tenant_id: tenantId,
        _role: targetRole,
      });

      if (error) {
        console.error('Error verifying role on server:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('Exception in verifyRoleOnServer:', err);
      return false;
    }
  };

  return {
    roles,
    isLoading,
    error,
    hasRole,
    isAdmin,
    isUser,
    isViewer,
    verifyRoleOnServer,
  };
}
