DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP VIEW IF EXISTS public.vw_carteiras_etapa_2_1 CASCADE;

DROP TABLE IF EXISTS public.carteiras_escolas_v3 CASCADE;
DROP TABLE IF EXISTS public.censo_escolas_privadas_ativas CASCADE;
DROP TABLE IF EXISTS public.enem_medias_municipio CASCADE;
DROP TABLE IF EXISTS public.densidade_demografica_cep5 CASCADE;
DROP TABLE IF EXISTS public.telemetry_events CASCADE;
DROP TABLE IF EXISTS public.cadastros CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.import_cadastros(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.reset_carteiras_escolas_v3() CASCADE;
DROP FUNCTION IF EXISTS public.validar_carteiras_escolas_v3() CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;