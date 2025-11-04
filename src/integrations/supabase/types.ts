export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      locacoes_veicular_activity_logs: {
        Row: {
          action: string | null
          created_at: string | null
          details_json: Json | null
          id: string
          target_id: string | null
          target_table: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details_json?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details_json?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_activity_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_categories: {
        Row: {
          id: number
          kind: string | null
          name: string | null
          tenant_id: string | null
        }
        Insert: {
          id?: number
          kind?: string | null
          name?: string | null
          tenant_id?: string | null
        }
        Update: {
          id?: number
          kind?: string | null
          name?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_clients: {
        Row: {
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_clients_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_contracts: {
        Row: {
          autentique_document_id: string | null
          client_id: string | null
          id: string
          months: number | null
          pdf_path: string | null
          signed_at: string | null
          start_date: string | null
          status: string | null
          tenant_id: string | null
          total: number | null
          vehicle_id: string | null
        }
        Insert: {
          autentique_document_id?: string | null
          client_id?: string | null
          id?: string
          months?: number | null
          pdf_path?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          total?: number | null
          vehicle_id?: string | null
        }
        Update: {
          autentique_document_id?: string | null
          client_id?: string | null
          id?: string
          months?: number | null
          pdf_path?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          total?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contracts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contracts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_aging"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_roi_frota"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_alugados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_disponiveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_doc_instances: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          pdf_path: string | null
          ref_id: string | null
          ref_table: string | null
          sent_via: string | null
          template_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          pdf_path?: string | null
          ref_id?: string | null
          ref_table?: string | null
          sent_via?: string | null
          template_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          pdf_path?: string | null
          ref_id?: string | null
          ref_table?: string | null
          sent_via?: string | null
          template_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_doc_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_doc_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_doc_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_doc_instances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_doc_templates: {
        Row: {
          body_markdown: string | null
          created_at: string | null
          id: string
          name: string | null
          tenant_id: string | null
          type: string | null
          variables_json: Json | null
          version: number | null
        }
        Insert: {
          body_markdown?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          tenant_id?: string | null
          type?: string | null
          variables_json?: Json | null
          version?: number | null
        }
        Update: {
          body_markdown?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          tenant_id?: string | null
          type?: string | null
          variables_json?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_doc_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_email_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          payload_json: Json | null
          provider: string | null
          provider_id: string | null
          status: string | null
          template: string | null
          tenant_id: string | null
          to: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload_json?: Json | null
          provider?: string | null
          provider_id?: string | null
          status?: string | null
          template?: string | null
          tenant_id?: string | null
          to?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload_json?: Json | null
          provider?: string | null
          provider_id?: string | null
          status?: string | null
          template?: string | null
          tenant_id?: string | null
          to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_email_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_integration_settings: {
        Row: {
          asaas_api_key: string | null
          autentique_token_enc: string | null
          email_api_key_enc: string | null
          email_provider: string | null
          evolution_api_key_enc: string | null
          evolution_base_url: string | null
          evolution_instance: string | null
          evolution_qr_base64: string | null
          evolution_status: string | null
          n8n_webhook_url: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          asaas_api_key?: string | null
          autentique_token_enc?: string | null
          email_api_key_enc?: string | null
          email_provider?: string | null
          evolution_api_key_enc?: string | null
          evolution_base_url?: string | null
          evolution_instance?: string | null
          evolution_qr_base64?: string | null
          evolution_status?: string | null
          n8n_webhook_url?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          asaas_api_key?: string | null
          autentique_token_enc?: string | null
          email_api_key_enc?: string | null
          email_provider?: string | null
          evolution_api_key_enc?: string | null
          evolution_base_url?: string | null
          evolution_instance?: string | null
          evolution_qr_base64?: string | null
          evolution_status?: string | null
          n8n_webhook_url?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_integration_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_invoices: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          due_date: string | null
          id: string
          provider: string | null
          provider_id: string | null
          status: string | null
          subscription_id: string | null
          url: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          provider?: string | null
          provider_id?: string | null
          status?: string | null
          subscription_id?: string | null
          url?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          provider?: string | null
          provider_id?: string | null
          status?: string | null
          subscription_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_maintenances: {
        Row: {
          completed_at: string | null
          cost: number | null
          created_at: string | null
          description: string
          id: string
          next_maintenance_date: string | null
          next_maintenance_km: number | null
          notes: string | null
          scheduled_date: string
          status: string
          tenant_id: string
          type: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          description: string
          id?: string
          next_maintenance_date?: string | null
          next_maintenance_km?: number | null
          notes?: string | null
          scheduled_date: string
          status?: string
          tenant_id: string
          type: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string
          id?: string
          next_maintenance_date?: string | null
          next_maintenance_km?: number | null
          notes?: string | null
          scheduled_date?: string
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: []
      }
      locacoes_veicular_plans: {
        Row: {
          billing_cycle: string | null
          code: string | null
          id: number
          monthly_vehicle_limit: number | null
          name: string | null
          price_cents: number | null
        }
        Insert: {
          billing_cycle?: string | null
          code?: string | null
          id?: number
          monthly_vehicle_limit?: number | null
          name?: string | null
          price_cents?: number | null
        }
        Update: {
          billing_cycle?: string | null
          code?: string | null
          id?: number
          monthly_vehicle_limit?: number | null
          name?: string | null
          price_cents?: number | null
        }
        Relationships: []
      }
      locacoes_veicular_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_saas_admin: boolean | null
          name: string | null
          phone: string | null
          role: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          is_saas_admin?: boolean | null
          name?: string | null
          phone?: string | null
          role?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_saas_admin?: boolean | null
          name?: string | null
          phone?: string | null
          role?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_subscriptions: {
        Row: {
          current_period_end: string | null
          id: string
          plan_id: number | null
          status: string | null
          tenant_id: string | null
          trial_end: string | null
        }
        Insert: {
          current_period_end?: string | null
          id?: string
          plan_id?: number | null
          status?: string | null
          tenant_id?: string | null
          trial_end?: string | null
        }
        Update: {
          current_period_end?: string | null
          id?: string
          plan_id?: number | null
          status?: string | null
          tenant_id?: string | null
          trial_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      locacoes_veicular_transactions: {
        Row: {
          amount: number | null
          category_id: number | null
          contract_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          forecast: boolean | null
          id: string
          paid_at: string | null
          status: string | null
          tenant_id: string | null
          type: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount?: number | null
          category_id?: number | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          forecast?: boolean | null
          id?: string
          paid_at?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number | null
          category_id?: number | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          forecast?: boolean | null
          id?: string
          paid_at?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tx_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tx_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_alugados"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_roi_frota"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_alugados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_disponiveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["locacoes_veicular_role"]
          saas_role: Database["public"]["Enums"]["locacoes_saas_role"] | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["locacoes_veicular_role"]
          saas_role?: Database["public"]["Enums"]["locacoes_saas_role"] | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["locacoes_veicular_role"]
          saas_role?: Database["public"]["Enums"]["locacoes_saas_role"] | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_vehicle_methods: {
        Row: {
          amount: number | null
          due_day: number | null
          effective_rate_annual: number | null
          effective_rate_monthly: number | null
          first_due_date: string | null
          grace_period_months: number | null
          id: string
          installment_value: number | null
          installments_count: number | null
          institution: string | null
          tenant_id: string | null
          total_interest: number | null
          total_paid: number | null
          type: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount?: number | null
          due_day?: number | null
          effective_rate_annual?: number | null
          effective_rate_monthly?: number | null
          first_due_date?: string | null
          grace_period_months?: number | null
          id?: string
          installment_value?: number | null
          installments_count?: number | null
          institution?: string | null
          tenant_id?: string | null
          total_interest?: number | null
          total_paid?: number | null
          type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number | null
          due_day?: number | null
          effective_rate_annual?: number | null
          effective_rate_monthly?: number | null
          first_due_date?: string | null
          grace_period_months?: number | null
          id?: string
          installment_value?: number | null
          installments_count?: number | null
          institution?: string | null
          tenant_id?: string | null
          total_interest?: number | null
          total_paid?: number | null
          type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_vehicle_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_vehicle_methods_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_roi_frota"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_vehicle_methods_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_alugados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_vehicle_methods_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_disponiveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_vehicle_methods_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_vehicle_methods_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_vehicles: {
        Row: {
          brand: string | null
          category:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color: string | null
          created_at: string | null
          id: string
          model: string | null
          normalized_plate: string | null
          plate: string | null
          status: string | null
          tenant_id: string | null
          valor_aquisicao_sem_encargos: number | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          category?:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          normalized_plate?: string | null
          plate?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_aquisicao_sem_encargos?: number | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          category?:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          normalized_plate?: string | null
          plate?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_aquisicao_sem_encargos?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_wa_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          payload_json: Json | null
          status: string | null
          tenant_id: string | null
          to: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload_json?: Json | null
          status?: string | null
          tenant_id?: string | null
          to?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload_json?: Json | null
          status?: string | null
          tenant_id?: string | null
          to?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_wa_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_webhook_inbox: {
        Row: {
          event_type: string | null
          id: string
          payload: Json | null
          provider: string | null
          received_at: string | null
          tenant_id: string | null
        }
        Insert: {
          event_type?: string | null
          id?: string
          payload?: Json | null
          provider?: string | null
          received_at?: string | null
          tenant_id?: string | null
        }
        Update: {
          event_type?: string | null
          id?: string
          payload?: Json | null
          provider?: string | null
          received_at?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      locacoes_veicular_v_aging: {
        Row: {
          aging_bucket: string | null
          amount: number | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          criticality: number | null
          days_overdue: number | null
          description: string | null
          due_date: string | null
          status: string | null
          tenant_id: string | null
          transaction_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_v_contas_pagar_mes: {
        Row: {
          amount: number | null
          category_id: number | null
          contract_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          forecast: boolean | null
          id: string | null
          paid_at: string | null
          status: string | null
          tenant_id: string | null
          type: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount?: number | null
          category_id?: number | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          forecast?: boolean | null
          id?: string | null
          paid_at?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number | null
          category_id?: number | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          forecast?: boolean | null
          id?: string | null
          paid_at?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tx_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tx_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_alugados"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_roi_frota"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_alugados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_disponiveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_v_contas_receber_mes: {
        Row: {
          amount: number | null
          category_id: number | null
          contract_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          forecast: boolean | null
          id: string | null
          paid_at: string | null
          status: string | null
          tenant_id: string | null
          type: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount?: number | null
          category_id?: number | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          forecast?: boolean | null
          id?: string | null
          paid_at?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number | null
          category_id?: number | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          forecast?: boolean | null
          id?: string | null
          paid_at?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tx_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tx_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_alugados"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_roi_frota"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_alugados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_disponiveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_v_veiculos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_veicular_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_v_kpis_mensais: {
        Row: {
          despesas_pagas: number | null
          despesas_pendentes: number | null
          lucro_liquido_pagos: number | null
          receitas_pagas: number | null
          receitas_pendentes: number | null
          tenant_id: string | null
          veiculos_alugados: number | null
          veiculos_disponiveis: number | null
        }
        Relationships: []
      }
      locacoes_veicular_v_roi_frota: {
        Row: {
          brand: string | null
          despesas_mes: number | null
          investimento_inicial: number | null
          lucro_mensal: number | null
          model: string | null
          payback_meses: number | null
          plate: string | null
          receitas_mes: number | null
          status: string | null
          tenant_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          brand?: string | null
          despesas_mes?: never
          investimento_inicial?: never
          lucro_mensal?: never
          model?: string | null
          payback_meses?: never
          plate?: string | null
          receitas_mes?: never
          status?: string | null
          tenant_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          brand?: string | null
          despesas_mes?: never
          investimento_inicial?: never
          lucro_mensal?: never
          model?: string | null
          payback_meses?: never
          plate?: string | null
          receitas_mes?: never
          status?: string | null
          tenant_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_v_veiculos_alugados: {
        Row: {
          brand: string | null
          category:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color: string | null
          contract_id: string | null
          created_at: string | null
          id: string | null
          model: string | null
          normalized_plate: string | null
          plate: string | null
          status: string | null
          tenant_id: string | null
          valor_aquisicao_sem_encargos: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_v_veiculos_disponiveis: {
        Row: {
          brand: string | null
          category:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color: string | null
          created_at: string | null
          id: string | null
          model: string | null
          normalized_plate: string | null
          plate: string | null
          status: string | null
          tenant_id: string | null
          valor_aquisicao_sem_encargos: number | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          category?:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color?: string | null
          created_at?: string | null
          id?: string | null
          model?: string | null
          normalized_plate?: string | null
          plate?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_aquisicao_sem_encargos?: number | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          category?:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color?: string | null
          created_at?: string | null
          id?: string | null
          model?: string | null
          normalized_plate?: string | null
          plate?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_aquisicao_sem_encargos?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locacoes_veicular_v_veiculos_manutencao: {
        Row: {
          brand: string | null
          category:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color: string | null
          created_at: string | null
          id: string | null
          model: string | null
          normalized_plate: string | null
          plate: string | null
          status: string | null
          tenant_id: string | null
          valor_aquisicao_sem_encargos: number | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          category?:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color?: string | null
          created_at?: string | null
          id?: string | null
          model?: string | null
          normalized_plate?: string | null
          plate?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_aquisicao_sem_encargos?: number | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          category?:
            | Database["public"]["Enums"]["locacoes_vehicle_category"]
            | null
          color?: string | null
          created_at?: string | null
          id?: string | null
          model?: string | null
          normalized_plate?: string | null
          plate?: string | null
          status?: string | null
          tenant_id?: string | null
          valor_aquisicao_sem_encargos?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_veicular_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "locacoes_veicular_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      algorithm_sign: {
        Args: { algorithm: string; secret: string; signables: string }
        Returns: string
      }
      assert_admin: { Args: never; Returns: undefined }
      assert_tenant: { Args: { p_tenant: string }; Returns: undefined }
      bytea_to_text: { Args: { data: string }; Returns: string }
      contract_create: {
        Args: {
          p_client: string
          p_monthly: number
          p_months: number
          p_start: string
          p_tenant: string
          p_vehicle: string
        }
        Returns: string
      }
      create_vehicle_with_investment: {
        Args: {
          p_acquisition: Json
          p_expenses: Json
          p_tenant_id: string
          p_vehicle: Json
        }
        Returns: Json
      }
      has_locacoes_role: {
        Args: {
          _role: Database["public"]["Enums"]["locacoes_veicular_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_capital_ramos_admin: { Args: never; Returns: boolean }
      is_saas_admin: { Args: never; Returns: boolean }
      last_day: { Args: { d: string }; Returns: string }
      locacoes_veicular_adjust_due_day: {
        Args: { base_date: string; due_day: number }
        Returns: string
      }
      locacoes_veicular_autentique_create_sql: {
        Args: {
          p_file_url: string
          p_signers: Json
          p_tenant: string
          p_title: string
        }
        Returns: Json
      }
      locacoes_veicular_contract_create: {
        Args: {
          p_client_id: string
          p_monthly_value: number
          p_months: number
          p_start_date: string
          p_vehicle_id: string
        }
        Returns: string
      }
      locacoes_veicular_current_tenant: { Args: never; Returns: string }
      locacoes_veicular_email_send_sql: {
        Args: {
          p_html: string
          p_subject: string
          p_tenant: string
          p_to: string
        }
        Returns: Json
      }
      locacoes_veicular_ensure_profile: { Args: never; Returns: undefined }
      locacoes_veicular_last_day: { Args: { d: string }; Returns: string }
      locacoes_veicular_sell_vehicle: {
        Args: {
          p_quit_installments?: boolean
          p_sale_date: string
          p_sale_value: number
          p_vehicle_id: string
        }
        Returns: Json
      }
      locacoes_veicular_transaction_mark_paid: {
        Args: { p_paid_at?: string; p_transaction_id: string }
        Returns: boolean
      }
      locacoes_veicular_vehicle_investment_seed: {
        Args: { p_tenant: string; p_vehicle: string }
        Returns: number
      }
      locacoes_veicular_wa_send_sql: {
        Args: { p_tenant: string; p_text: string; p_to: string }
        Returns: Json
      }
      me_is_saas_admin: { Args: never; Returns: boolean }
      me_role: { Args: never; Returns: string }
      me_tenant: { Args: never; Returns: string }
      sign: {
        Args: { algorithm?: string; payload: Json; secret: string }
        Returns: string
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      transaction_mark_paid: {
        Args: { p_paid_at: string; p_tenant: string; p_tx: string }
        Returns: boolean
      }
      try_cast_double: { Args: { inp: string }; Returns: number }
      url_decode: { Args: { data: string }; Returns: string }
      url_encode: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      vehicle_investment_seed: {
        Args: { p_tenant: string; p_vehicle: string }
        Returns: number
      }
      verify: {
        Args: { algorithm?: string; secret: string; token: string }
        Returns: {
          header: Json
          payload: Json
          valid: boolean
        }[]
      }
      wa_send_text_sql: {
        Args: { p_tenant: string; p_text: string; p_to: string }
        Returns: Json
      }
    }
    Enums: {
      locacoes_saas_role: "saas_admin" | "tenant_admin" | "user"
      locacoes_vehicle_category:
        | "economico"
        | "intermediario"
        | "executivo"
        | "suv"
        | "van"
        | "pickup"
        | "luxo"
      locacoes_veicular_role: "admin" | "user" | "viewer"
      vehicle_category:
        | "economico"
        | "intermediario"
        | "executivo"
        | "suv"
        | "van"
        | "pickup"
        | "luxo"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      locacoes_saas_role: ["saas_admin", "tenant_admin", "user"],
      locacoes_vehicle_category: [
        "economico",
        "intermediario",
        "executivo",
        "suv",
        "van",
        "pickup",
        "luxo",
      ],
      locacoes_veicular_role: ["admin", "user", "viewer"],
      vehicle_category: [
        "economico",
        "intermediario",
        "executivo",
        "suv",
        "van",
        "pickup",
        "luxo",
      ],
    },
  },
} as const
