// Public types checked against the live catalog and canonical V2 DDL.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type FK<N extends string, C extends string, T extends string> = { foreignKeyName: N; columns: [C]; isOneToOne: false; referencedRelation: T; referencedColumns: [C] };
type Table<R, K extends keyof R, F extends unknown[]> = { Row: R; Insert: Pick<R,K> & Partial<R>; Update: Partial<R>; Relationships: F };
export type DimMunicipio = { cod_municipal: string; municipio: string; cod_uf: string; nome_uf: string; cod_regiao_intermediaria: string; regiao_intermediaria: string; cod_regiao_imediata: string; regiao_imediata: string; cod_municipio_dtb: string; ano_dtb: number; data_base_dtb: string; ativo: boolean; carga_id: string; atualizado_em: string };
export type DimDistrito = { cod_distrito: string; cod_municipal: string; distrito_dtb: string; distrito: string; ano_dtb: number; data_base_dtb: string; ativo: boolean; carga_id: string; atualizado_em: string };
export type DimSubdistrito = { cod_subdistrito: string; cod_distrito: string; cod_municipal: string; subdistrito_dtb: string; subdistrito: string; ano_dtb: number; data_base_dtb: string; ativo: boolean; carga_id: string; atualizado_em: string };
export type DimCep5 = { cod_municipal: string; cep5: string; municipio_origem: string; uf_origem: string; metodo_resolucao: 'EXATO' | 'ALIAS_HOMOLOGADO'; ativo: boolean; carga_id: string; atualizado_em: string };
type Carga = { carga_id: string; dataset: string; fonte_sistema: string; fonte_referencia: string | null; ano_referencia: number | null; arquivo_nome: string | null; arquivo_sha256: string | null; status: string; linhas_recebidas: number; linhas_validas: number; linhas_rejeitadas: number; linhas_gravadas: number; iniciada_em: string; finalizada_em: string | null; observacoes: string | null; criado_em: string };
type Quality = { check_id: string; carga_id: string | null; dataset: string; nome_check: string; severidade: string; passou: boolean; detalhes: Json; executado_em: string };
type Replication = { run_id: string; carga_id: string | null; tabela: string; origem: string; destino: string; status: string; linhas_origem: number | null; linhas_destino: number | null; inseridas: number; atualizadas: number; rejeitadas: number; checksum_origem: string | null; checksum_destino: string | null; iniciada_em: string; finalizada_em: string | null; erro: string | null };
export type Database = {
 __InternalSupabase: { PostgrestVersion: '14.5' };
 public: {
  Tables: {
   dim_municipio: Table<DimMunicipio, Exclude<keyof DimMunicipio,'ativo'|'atualizado_em'>,[FK<'dim_municipio_carga_id_fkey','carga_id','etl_cargas'>]>;
   dim_distrito: Table<DimDistrito, Exclude<keyof DimDistrito,'ativo'|'atualizado_em'>,[FK<'dim_distrito_carga_id_fkey','carga_id','etl_cargas'>,FK<'dim_distrito_cod_municipal_fkey','cod_municipal','dim_municipio'>]>;
   dim_subdistrito: Table<DimSubdistrito, Exclude<keyof DimSubdistrito,'ativo'|'atualizado_em'>,[FK<'dim_subdistrito_carga_id_fkey','carga_id','etl_cargas'>,FK<'dim_subdistrito_cod_distrito_fkey','cod_distrito','dim_distrito'>,FK<'dim_subdistrito_cod_municipal_fkey','cod_municipal','dim_municipio'>]>;
   dim_cep5: Table<DimCep5, Exclude<keyof DimCep5,'ativo'|'atualizado_em'>,[FK<'dim_cep5_carga_id_fkey','carga_id','etl_cargas'>,FK<'dim_cep5_cod_municipal_fkey','cod_municipal','dim_municipio'>]>;
   etl_cargas: Table<Carga,'dataset'|'fonte_sistema'|'status',[]>;
   audit_data_quality: Table<Quality,'dataset'|'nome_check'|'severidade'|'passou',[FK<'audit_data_quality_carga_id_fkey','carga_id','etl_cargas'>]>;
   audit_replication_runs: Table<Replication,'tabela'|'status',[FK<'audit_replication_runs_carga_id_fkey','carga_id','etl_cargas'>]>;
  };
  Views: { [_ in never]: never };
  Functions: { cit_ingest: { Args: { action: string; payload?: Json }; Returns: Json } };
  Enums: { [_ in never]: never };
  CompositeTypes: { [_ in never]: never };
 };
};
