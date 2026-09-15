export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      etl_cargas: {
        Row: { carga_id: string; dataset: string; fonte_sistema: string; fonte_referencia: string | null; ano_referencia: number | null; arquivo_nome: string | null; arquivo_sha256: string | null; status: string; linhas_recebidas: number; linhas_validas: number; linhas_rejeitadas: number; linhas_gravadas: number; iniciada_em: string; finalizada_em: string | null; observacoes: string | null; criado_em: string };
        Insert: { carga_id?: string; dataset: string; fonte_sistema: string; fonte_referencia?: string | null; ano_referencia?: number | null; arquivo_nome?: string | null; arquivo_sha256?: string | null; status: string; linhas_recebidas?: number; linhas_validas?: number; linhas_rejeitadas?: number; linhas_gravadas?: number; iniciada_em?: string; finalizada_em?: string | null; observacoes?: string | null; criado_em?: string };
        Update: { carga_id?: string; dataset?: string; fonte_sistema?: string; fonte_referencia?: string | null; ano_referencia?: number | null; arquivo_nome?: string | null; arquivo_sha256?: string | null; status?: string; linhas_recebidas?: number; linhas_validas?: number; linhas_rejeitadas?: number; linhas_gravadas?: number; iniciada_em?: string; finalizada_em?: string | null; observacoes?: string | null; criado_em?: string };
        Relationships: [];
      };
      audit_data_quality: {
        Row: { check_id: string; carga_id: string | null; dataset: string; nome_check: string; severidade: string; passou: boolean; detalhes: Json; executado_em: string };
        Insert: { check_id?: string; carga_id?: string | null; dataset: string; nome_check: string; severidade: string; passou: boolean; detalhes?: Json; executado_em?: string };
        Update: { check_id?: string; carga_id?: string | null; dataset?: string; nome_check?: string; severidade?: string; passou?: boolean; detalhes?: Json; executado_em?: string };
        Relationships: [{ foreignKeyName: "audit_data_quality_carga_id_fkey"; columns: ["carga_id"]; isOneToOne: false; referencedRelation: "etl_cargas"; referencedColumns: ["carga_id"] }];
      };
      audit_replication_runs: {
        Row: { run_id: string; carga_id: string | null; tabela: string; origem: string; destino: string; status: string; linhas_origem: number | null; linhas_destino: number | null; inseridas: number; atualizadas: number; rejeitadas: number; checksum_origem: string | null; checksum_destino: string | null; iniciada_em: string; finalizada_em: string | null; erro: string | null };
        Insert: { run_id?: string; carga_id?: string | null; tabela: string; origem?: string; destino?: string; status: string; linhas_origem?: number | null; linhas_destino?: number | null; inseridas?: number; atualizadas?: number; rejeitadas?: number; checksum_origem?: string | null; checksum_destino?: string | null; iniciada_em?: string; finalizada_em?: string | null; erro?: string | null };
        Update: { run_id?: string; carga_id?: string | null; tabela?: string; origem?: string; destino?: string; status?: string; linhas_origem?: number | null; linhas_destino?: number | null; inseridas?: number; atualizadas?: number; rejeitadas?: number; checksum_origem?: string | null; checksum_destino?: string | null; iniciada_em?: string; finalizada_em?: string | null; erro?: string | null };
        Relationships: [{ foreignKeyName: "audit_replication_runs_carga_id_fkey"; columns: ["carga_id"]; isOneToOne: false; referencedRelation: "etl_cargas"; referencedColumns: ["carga_id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
