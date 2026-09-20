-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS SUPABASE PARA: LAURUS BAZAR (EXCLUSIVO E ISOLADO)
-- Execute este script no SQL Editor do seu novo projeto Supabase
-- ==============================================================================

-- 1. TABELA DE PRODUTOS (Roupas, Perfumes, Bazar)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  cost_price NUMERIC DEFAULT 0,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  sizes JSONB DEFAULT '[]'::jsonb,
  image TEXT,
  description TEXT,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA DE VENDAS & FIADO (2x DE BOCA)
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  date TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  paid_at_sale NUMERIC DEFAULT 0,
  remaining_balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pago',
  installments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE FINANÇAS PESSOAIS & CASA
CREATE TABLE IF NOT EXISTS public.personal_finance (
  id TEXT PRIMARY KEY,
  date TEXT,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE CONFIGURAÇÕES DA LOJA
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- HABILITAR SEGURANÇA E ACESSO ANÔNIMO (PARA VITRINE E PAINEL)
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre para a chave anon (Pública e Lojista)
CREATE POLICY "Acesso total aos produtos" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total aos clientes" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total as vendas" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total as financas" ON public.personal_finance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total as configuracoes" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);
