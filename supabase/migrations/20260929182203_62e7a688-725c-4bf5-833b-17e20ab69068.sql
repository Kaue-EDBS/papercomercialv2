ALTER TABLE public.censo_escolas_privadas_ativas
  ADD CONSTRAINT censo_co_municipio_fkey FOREIGN KEY (co_municipio)
  REFERENCES public.dim_municipio (cod_municipal);

REVOKE ALL ON public.censo_escolas_privadas_ativas FROM sandbox_exec;
REVOKE ALL ON public.censo_escolas_privadas_ativas FROM anon, authenticated;