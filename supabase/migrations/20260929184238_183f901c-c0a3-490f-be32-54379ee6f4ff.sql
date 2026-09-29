CREATE TABLE public.enem_medias_municipio (
  "ano" smallint NOT NULL,
  "COD MUNICIPIO" text NOT NULL,
  "municipio" text NOT NULL,
  "uf" char(2) NOT NULL,
  "participantes_total" integer NOT NULL,
  "media_ciencias_natureza" numeric(7,2),
  "media_ciencias_humanas" numeric(7,2),
  "media_linguagens" numeric(7,2),
  "media_matematica" numeric(7,2),
  "media_redacao_comp1" numeric(7,2),
  "media_redacao_comp2" numeric(7,2),
  "media_redacao_comp3" numeric(7,2),
  "media_redacao_comp4" numeric(7,2),
  "media_redacao_comp5" numeric(7,2),
  "media_redacao_final" numeric(7,2),
  "n_ciencias_natureza" integer NOT NULL,
  "n_ciencias_humanas" integer NOT NULL,
  "n_linguagens" integer NOT NULL,
  "n_matematica" integer NOT NULL,
  "n_redacao_comp1" integer NOT NULL,
  "n_redacao_comp2" integer NOT NULL,
  "n_redacao_comp3" integer NOT NULL,
  "n_redacao_comp4" integer NOT NULL,
  "n_redacao_comp5" integer NOT NULL,
  "n_redacao_final" integer NOT NULL,
  carregado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enem_medias_municipio_pkey PRIMARY KEY ("ano", "COD MUNICIPIO"),
  CONSTRAINT enem_cod_municipio_ck CHECK ("COD MUNICIPIO" ~ '^[0-9]{7}$'),
  CONSTRAINT enem_ano_ck CHECK ("ano" BETWEEN 1998 AND 2100),
  CONSTRAINT enem_participantes_ck CHECK ("participantes_total" >= 0),
  CONSTRAINT enem_municipio_fk FOREIGN KEY ("COD MUNICIPIO") REFERENCES public.dim_municipio(cod_municipal)
);

COMMENT ON TABLE public.enem_medias_municipio IS 'Medias do ENEM por municipio de aplicacao da prova. Chave (ano, COD MUNICIPIO). Fonte: microdados INEP por edicao.';
COMMENT ON COLUMN public.enem_medias_municipio."COD MUNICIPIO" IS 'Codigo IBGE de 7 digitos do municipio de aplicacao (CO_MUNICIPIO_PROVA). Relaciona-se a dim_municipio.cod_municipal.';

CREATE INDEX idx_enem_medias_uf_municipio ON public.enem_medias_municipio (uf, municipio);
CREATE INDEX idx_enem_medias_cod ON public.enem_medias_municipio ("COD MUNICIPIO");
CREATE INDEX idx_enem_medias_ano ON public.enem_medias_municipio (ano);

REVOKE ALL ON public.enem_medias_municipio FROM PUBLIC;
REVOKE ALL ON public.enem_medias_municipio FROM anon;
REVOKE ALL ON public.enem_medias_municipio FROM authenticated;
GRANT ALL ON public.enem_medias_municipio TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enem_medias_municipio TO sandbox_exec;
GRANT SELECT ON public.dim_municipio TO sandbox_exec;

ALTER TABLE public.enem_medias_municipio ENABLE ROW LEVEL SECURITY;