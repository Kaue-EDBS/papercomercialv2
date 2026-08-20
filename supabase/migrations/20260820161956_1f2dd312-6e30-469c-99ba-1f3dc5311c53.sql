CREATE TABLE IF NOT EXISTS public.enem_medias_municipio (
  ano smallint NOT NULL,
  codigo_municipio varchar(7) NOT NULL,
  municipio text NOT NULL,
  uf char(2) NOT NULL,
  participantes_total integer NOT NULL,
  media_cn numeric(6,1),
  n_cn integer NOT NULL DEFAULT 0,
  media_ch numeric(6,1),
  n_ch integer NOT NULL DEFAULT 0,
  media_lc numeric(6,1),
  n_lc integer NOT NULL DEFAULT 0,
  media_mt numeric(6,1),
  n_mt integer NOT NULL DEFAULT 0,
  media_redacao_comp1 numeric(6,1),
  n_redacao_comp1 integer NOT NULL DEFAULT 0,
  media_redacao_comp2 numeric(6,1),
  n_redacao_comp2 integer NOT NULL DEFAULT 0,
  media_redacao_comp3 numeric(6,1),
  n_redacao_comp3 integer NOT NULL DEFAULT 0,
  media_redacao_comp4 numeric(6,1),
  n_redacao_comp4 integer NOT NULL DEFAULT 0,
  media_redacao_comp5 numeric(6,1),
  n_redacao_comp5 integer NOT NULL DEFAULT 0,
  media_redacao numeric(6,1),
  n_redacao integer NOT NULL DEFAULT 0,
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (ano, codigo_municipio)
);

GRANT SELECT ON public.enem_medias_municipio TO authenticated;
GRANT ALL ON public.enem_medias_municipio TO service_role;

ALTER TABLE public.enem_medias_municipio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enem_medias_select_autenticado"
ON public.enem_medias_municipio
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_enem_medias_municipio_uf_municipio ON public.enem_medias_municipio (uf, municipio);
CREATE INDEX IF NOT EXISTS idx_enem_medias_municipio_codigo ON public.enem_medias_municipio (codigo_municipio);