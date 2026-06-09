
-- Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor');

-- Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cod_protheus TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  gestor TEXT,
  arquivo_carteira TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de roles (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função has_role (security definer evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Policies profiles: usuário vê/edita o próprio; admin vê/edita todos
CREATE POLICY "Profiles: self select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: admin select all" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: admin update all" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies user_roles: usuário vê só os próprios; admin gerencia todos
CREATE POLICY "Roles: self select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Roles: admin select all" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger handle_new_user: cria profile + role consultor automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cod TEXT := COALESCE(NEW.raw_user_meta_data->>'cod_protheus', split_part(NEW.email, '@', 1));
  v_nome TEXT := COALESCE(NEW.raw_user_meta_data->>'nome', v_cod);
  v_gestor TEXT := NEW.raw_user_meta_data->>'gestor';
  v_arquivo TEXT := NEW.raw_user_meta_data->>'arquivo_carteira';
  v_role public.app_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'consultor');
  v_must_change BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'must_change_password')::BOOLEAN, true);
BEGIN
  INSERT INTO public.profiles (id, cod_protheus, nome, gestor, arquivo_carteira, must_change_password)
  VALUES (NEW.id, upper(v_cod), v_nome, v_gestor, v_arquivo, v_must_change)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger updated_at em profiles
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Telemetria (eventos de uso + erros)
CREATE TABLE public.telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  type TEXT NOT NULL,
  name TEXT,
  url TEXT,
  payload JSONB,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX telemetry_events_user_created_idx ON public.telemetry_events (user_id, created_at DESC);
CREATE INDEX telemetry_events_created_idx ON public.telemetry_events (created_at DESC);
GRANT SELECT, INSERT ON public.telemetry_events TO authenticated;
GRANT ALL ON public.telemetry_events TO service_role;
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir os próprios eventos; só admin lê tudo
CREATE POLICY "Telemetry: self insert" ON public.telemetry_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Telemetry: self select" ON public.telemetry_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Telemetry: admin select all" ON public.telemetry_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- View agregada para relatório semanal (acessível por admin)
CREATE OR REPLACE VIEW public.telemetry_weekly_usage
WITH (security_invoker=on) AS
SELECT
  date_trunc('week', created_at) AS semana,
  COUNT(*) FILTER (WHERE type='event' AND name='page_view') AS page_views,
  COUNT(DISTINCT session_id) AS sessoes,
  COUNT(DISTINCT user_id) AS usuarios_ativos,
  COUNT(*) FILTER (WHERE type='error') AS erros
FROM public.telemetry_events
GROUP BY 1 ORDER BY 1 DESC;
GRANT SELECT ON public.telemetry_weekly_usage TO authenticated;
