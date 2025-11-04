-- Adicionar coluna asaas_api_key à tabela integration_settings
ALTER TABLE public.locacoes_veicular_integration_settings
ADD COLUMN IF NOT EXISTS asaas_api_key text;