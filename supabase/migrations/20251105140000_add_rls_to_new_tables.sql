-- Migration: Add RLS policies to new tables
-- Description: Adds Row Level Security to integrations, permissions, templates, and notification_logs
-- Date: 2025-11-05

-- =====================================================
-- Enable RLS on new tables
-- =====================================================

ALTER TABLE locacoes_veicular_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes_veicular_integration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes_veicular_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes_veicular_notification_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INTEGRATIONS POLICIES
-- =====================================================

-- Select: Users can see integrations from their tenant
CREATE POLICY "integrations_tenant_select" 
ON locacoes_veicular_integrations
FOR SELECT 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- Insert/Update/Delete: Only admins and owners can manage integrations
CREATE POLICY "integrations_admin_all" 
ON locacoes_veicular_integrations
FOR ALL 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
  AND (
    SELECT role 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  ) IN ('admin', 'owner')
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- INTEGRATION TEMPLATES POLICIES
-- =====================================================

-- Select: Users can see templates from their tenant
CREATE POLICY "templates_tenant_select" 
ON locacoes_veicular_integration_templates
FOR SELECT 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- Insert/Update/Delete: Only admins and owners can manage templates
CREATE POLICY "templates_admin_all" 
ON locacoes_veicular_integration_templates
FOR ALL 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
  AND (
    SELECT role 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  ) IN ('admin', 'owner')
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- USER PERMISSIONS POLICIES
-- =====================================================

-- Select: Users can see their own permissions
CREATE POLICY "permissions_self_select" 
ON locacoes_veicular_user_permissions
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    SELECT role 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  ) IN ('admin', 'owner')
);

-- Insert/Update/Delete: Only admins and owners can manage permissions
CREATE POLICY "permissions_admin_all" 
ON locacoes_veicular_user_permissions
FOR ALL 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
  AND (
    SELECT role 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  ) IN ('admin', 'owner')
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- NOTIFICATION LOGS POLICIES
-- =====================================================

-- Select: Users can see notification logs from their tenant
CREATE POLICY "notification_logs_tenant_select" 
ON locacoes_veicular_notification_logs
FOR SELECT 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- Insert: Service role can insert logs (from edge functions)
CREATE POLICY "notification_logs_service_insert" 
ON locacoes_veicular_notification_logs
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Insert: Authenticated users can insert logs for their tenant
CREATE POLICY "notification_logs_tenant_insert" 
ON locacoes_veicular_notification_logs
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = (
    SELECT tenant_id 
    FROM locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT ON locacoes_veicular_integrations TO authenticated;
GRANT ALL ON locacoes_veicular_integrations TO authenticated;

GRANT SELECT ON locacoes_veicular_integration_templates TO authenticated;
GRANT ALL ON locacoes_veicular_integration_templates TO authenticated;

GRANT SELECT ON locacoes_veicular_user_permissions TO authenticated;
GRANT ALL ON locacoes_veicular_user_permissions TO authenticated;

GRANT SELECT ON locacoes_veicular_notification_logs TO authenticated;
GRANT INSERT ON locacoes_veicular_notification_logs TO authenticated;
GRANT INSERT ON locacoes_veicular_notification_logs TO service_role;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Ensure indexes exist for tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id 
ON locacoes_veicular_integrations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_templates_tenant_id 
ON locacoes_veicular_integration_templates(tenant_id);

CREATE INDEX IF NOT EXISTS idx_permissions_user_id 
ON locacoes_veicular_user_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_permissions_tenant_id 
ON locacoes_veicular_user_permissions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant_id 
ON locacoes_veicular_notification_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at 
ON locacoes_veicular_notification_logs(created_at DESC);
