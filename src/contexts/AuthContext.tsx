/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Profile {
  id: string;
  tenant_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  is_saas_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tenantId: string | null;
  isAdmin: boolean;
  isSaasAdmin: boolean;
  loading: boolean;
  email: string | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaasAdmin, setIsSaasAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('locacoes_veicular_profiles')
        .select('id, tenant_id, name, phone, role, is_saas_admin, is_active, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (data) {
        setProfile(data as Profile);
        setTenantId(data.tenant_id);

        // Usar is_saas_admin direto do profile
        setIsSaasAdmin(data.is_saas_admin || false);

        // Verificar role direto do profile (não precisa RPC)
        const role = data.role || 'user';
        setIsAdmin(role === 'admin' || role === 'owner');

        // Buscar permissões granulares do usuário
        if (data.tenant_id) {
          // Fetch permissions from table not yet in generated types
          const { data: permsData } = await supabase
            .from('locacoes_veicular_user_permissions' as any)
            .select('permission')
            .eq('user_id', userId);

          setPermissions((permsData as any)?.map((p: { permission: string }) => p.permission) || []);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao carregar perfil do usuário');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (isSaasAdmin) return true;
    return permissions.includes(permission);
  };

  useEffect(() => {
    // Setup auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setEmail(session?.user?.email ?? null);

        if (session?.user) {
          // Ensure profile exists, then fetch it (defer to avoid deadlock)
          setTimeout(() => {
            (async () => {
              try {
                await supabase.rpc('locacoes_veicular_ensure_profile' as any);
              } catch (err) {
                console.error('ensure_profile error:', err);
              } finally {
                fetchProfile(session.user!.id);
              }
            })();
          }, 0);
        } else {
          setProfile(null);
          setTenantId(null);
          setIsAdmin(false);
          setIsSaasAdmin(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session (only once on mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email ?? null);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setTenantId(null);
      setIsAdmin(false);
      setIsSaasAdmin(false);
      setEmail(null);
      setPermissions([]);
      
      navigate('/');
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        tenantId,
        isAdmin,
        isSaasAdmin,
        loading,
        email,
        permissions,
        hasPermission,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
