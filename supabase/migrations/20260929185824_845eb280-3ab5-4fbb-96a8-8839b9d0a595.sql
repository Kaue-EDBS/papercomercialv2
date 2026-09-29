CREATE TABLE public.adocao_escolas (
  "CD_ESCOLA" text PRIMARY KEY,
  escola text NOT NULL,
  municipio text,
  uf varchar(2),
  regiao text,
  carregado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.adocao_escolas IS 'Escolas presentes nos pacotes de adocao 2026. "CD_ESCOLA" relaciona-se logicamente a public.escola_protheus.cd_escola.';

CREATE TABLE public.adocao_materias (
  materia text PRIMARY KEY,
  familia_materia text NOT NULL,
  familia_materia_label text NOT NULL,
  ordem_familia smallint NOT NULL,
  CONSTRAINT ck_adocao_materias_familia CHECK (familia_materia IN (
    'INTEGRADAS','CIENCIAS_NATUREZA','CIENCIAS_HUMANAS','MATEMATICA',
    'LINGUAGENS','OUTROS','MULTIDISCIPLINAR'
  ))
);

CREATE TABLE public.fato_adocao (
  chave_adocao text PRIMARY KEY,
  "CD_ESCOLA" text NOT NULL REFERENCES public.adocao_escolas("CD_ESCOLA") ON UPDATE CASCADE ON DELETE RESTRICT,
  ano smallint NOT NULL,
  segmento text,
  tipo_material text NOT NULL,
  materia text NOT NULL REFERENCES public.adocao_materias(materia) ON UPDATE CASCADE ON DELETE RESTRICT,
  colecao_anterior text,
  grupo_editorial_anterior text,
  qt_adocoes_ano_anterior integer,
  colecao_atual text,
  grupo_editorial_atual text,
  qt_adocoes_ano_atual integer,
  qt_anos_adocao_colecao integer,
  estrategia text,
  tempo_contrato_sistema_ensino smallint,
  carregado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_fato_adocao_tipo_material CHECK (tipo_material IN ('DIDATICO','APOIO','MATERIAL_PROPRIO','SISTEMA_ENSINO')),
  CONSTRAINT ck_fato_adocao_ano CHECK (ano BETWEEN 2000 AND 2100),
  CONSTRAINT ck_fato_adocao_qt_prev CHECK (qt_adocoes_ano_anterior IS NULL OR qt_adocoes_ano_anterior >= 0),
  CONSTRAINT ck_fato_adocao_qt_curr CHECK (qt_adocoes_ano_atual IS NULL OR qt_adocoes_ano_atual >= 0),
  CONSTRAINT ck_fato_adocao_qt_anos CHECK (qt_anos_adocao_colecao IS NULL OR qt_anos_adocao_colecao >= 0),
  CONSTRAINT ck_fato_adocao_tempo_contrato_se CHECK (tempo_contrato_sistema_ensino IS NULL OR tempo_contrato_sistema_ensino >= 0)
);

COMMENT ON COLUMN public.fato_adocao.tempo_contrato_sistema_ensino IS 'Exclusivo de SISTEMA_ENSINO; nulo nos demais tipos de material.';

CREATE INDEX idx_fato_adocao_cd_escola ON public.fato_adocao("CD_ESCOLA");
CREATE INDEX idx_fato_adocao_ano ON public.fato_adocao(ano);
CREATE INDEX idx_fato_adocao_tipo_material ON public.fato_adocao(tipo_material);
CREATE INDEX idx_fato_adocao_materia ON public.fato_adocao(materia);
CREATE INDEX idx_fato_adocao_segmento ON public.fato_adocao(segmento);
CREATE INDEX idx_fato_adocao_estrategia ON public.fato_adocao(estrategia);
CREATE INDEX idx_fato_adocao_grupo_atual ON public.fato_adocao(grupo_editorial_atual);
CREATE INDEX idx_adocao_materias_familia ON public.adocao_materias(familia_materia);

CREATE TABLE public.dim_obra_literaria (
  obra_id text PRIMARY KEY,
  titulo_obra text,
  grupo_editorial text,
  status_identificacao text NOT NULL,
  CONSTRAINT ck_dim_obra_literaria_status CHECK (status_identificacao IN ('COMPLETA','GRUPO_EDITORIAL_APENAS','TITULO_APENAS')),
  CONSTRAINT ck_dim_obra_literaria_identificacao CHECK (titulo_obra IS NOT NULL OR grupo_editorial IS NOT NULL)
);

CREATE TABLE public.fato_adocao_literatura (
  chave_adocao_literatura text PRIMARY KEY,
  "CD_ESCOLA" text NOT NULL REFERENCES public.adocao_escolas("CD_ESCOLA") ON UPDATE CASCADE ON DELETE RESTRICT,
  ano smallint NOT NULL,
  segmento text,
  materia text,
  obra_anterior_id text REFERENCES public.dim_obra_literaria(obra_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  qt_adocoes_ano_anterior integer,
  obra_atual_id text NOT NULL REFERENCES public.dim_obra_literaria(obra_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  qt_adocoes_ano_atual integer,
  qt_anos_adocao_obra integer,
  estrategia text,
  carregado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_fato_lit_ano CHECK (ano BETWEEN 2000 AND 2100),
  CONSTRAINT ck_fato_lit_qt_prev CHECK (qt_adocoes_ano_anterior IS NULL OR qt_adocoes_ano_anterior >= 0),
  CONSTRAINT ck_fato_lit_qt_curr CHECK (qt_adocoes_ano_atual IS NULL OR qt_adocoes_ano_atual >= 0),
  CONSTRAINT ck_fato_lit_qt_anos CHECK (qt_anos_adocao_obra IS NULL OR qt_anos_adocao_obra >= 0)
);

CREATE INDEX idx_fato_lit_cd_escola ON public.fato_adocao_literatura("CD_ESCOLA");
CREATE INDEX idx_fato_lit_ano ON public.fato_adocao_literatura(ano);
CREATE INDEX idx_fato_lit_segmento ON public.fato_adocao_literatura(segmento);
CREATE INDEX idx_fato_lit_obra_atual ON public.fato_adocao_literatura(obra_atual_id);
CREATE INDEX idx_fato_lit_obra_anterior ON public.fato_adocao_literatura(obra_anterior_id);
CREATE INDEX idx_fato_lit_estrategia ON public.fato_adocao_literatura(estrategia);
CREATE INDEX idx_obra_lit_grupo ON public.dim_obra_literaria(grupo_editorial);
CREATE INDEX idx_obra_lit_titulo ON public.dim_obra_literaria(titulo_obra);

REVOKE ALL ON public.adocao_escolas, public.adocao_materias, public.fato_adocao,
              public.dim_obra_literaria, public.fato_adocao_literatura
  FROM PUBLIC, anon, authenticated;

GRANT ALL ON public.adocao_escolas, public.adocao_materias, public.fato_adocao,
             public.dim_obra_literaria, public.fato_adocao_literatura
  TO service_role;

ALTER TABLE public.adocao_escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adocao_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fato_adocao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_obra_literaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fato_adocao_literatura ENABLE ROW LEVEL SECURITY;

GRANT INSERT, SELECT ON public.adocao_escolas, public.adocao_materias, public.fato_adocao,
                        public.dim_obra_literaria, public.fato_adocao_literatura
  TO sandbox_exec;