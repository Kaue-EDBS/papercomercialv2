export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      densidade_demografica_cep5: {
        Row: {
          cep5: string
          consumo_artigos_escolares: number | null
          consumo_cursos_regulares: number | null
          consumo_livros_didaticos_revistas_tecnicas: number | null
          consumo_livros_material_escolar: number | null
          consumo_outros_livros_material_escolar: number | null
          consumo_total: number | null
          id: number
          municipio: string
          pop_idade_10_14: number | null
          pop_idade_15_19: number | null
          pop_idade_20_24: number | null
          pop_idade_25_29: number | null
          pop_idade_25_34: number | null
          pop_idade_30_34: number | null
          pop_idade_35_39: number | null
          pop_idade_35_49: number | null
          pop_idade_40_44: number | null
          pop_idade_45_49: number | null
          pop_idade_5_9: number | null
          pop_idade_50_54: number | null
          pop_idade_50_59: number | null
          pop_idade_55_59: number | null
          pop_idade_60_64: number | null
          pop_idade_60_mais: number | null
          pop_idade_65_69: number | null
          pop_idade_70_74: number | null
          pop_idade_75_79: number | null
          pop_idade_80_mais: number | null
          pop_idade_ate_4: number | null
          pop_idade_ate_9: number | null
          pop_idade_total: number | null
          pop_renda_a_p_15_19: number | null
          pop_renda_a_p_20_24: number | null
          pop_renda_a_p_25_34: number | null
          pop_renda_a_p_35_44: number | null
          pop_renda_a_p_45_49: number | null
          pop_renda_a_p_5_14: number | null
          pop_renda_a_p_50_59: number | null
          pop_renda_a_p_60_mais: number | null
          pop_renda_a_p_ate_4: number | null
          pop_renda_a_p_total: number | null
          pop_renda_a_pp_15_19: number | null
          pop_renda_a_pp_20_24: number | null
          pop_renda_a_pp_25_34: number | null
          pop_renda_a_pp_35_44: number | null
          pop_renda_a_pp_45_49: number | null
          pop_renda_a_pp_5_14: number | null
          pop_renda_a_pp_50_59: number | null
          pop_renda_a_pp_60_mais: number | null
          pop_renda_a_pp_ate_4: number | null
          pop_renda_a_pp_total: number | null
          pop_renda_b1_15_19: number | null
          pop_renda_b1_20_24: number | null
          pop_renda_b1_25_34: number | null
          pop_renda_b1_35_44: number | null
          pop_renda_b1_45_49: number | null
          pop_renda_b1_5_14: number | null
          pop_renda_b1_50_59: number | null
          pop_renda_b1_60_mais: number | null
          pop_renda_b1_ate_4: number | null
          pop_renda_b1_total: number | null
          pop_renda_b2_15_19: number | null
          pop_renda_b2_20_24: number | null
          pop_renda_b2_25_34: number | null
          pop_renda_b2_35_44: number | null
          pop_renda_b2_45_49: number | null
          pop_renda_b2_5_14: number | null
          pop_renda_b2_50_59: number | null
          pop_renda_b2_60_mais: number | null
          pop_renda_b2_ate_4: number | null
          pop_renda_b2_total: number | null
          pop_renda_c1_15_19: number | null
          pop_renda_c1_20_24: number | null
          pop_renda_c1_25_34: number | null
          pop_renda_c1_35_44: number | null
          pop_renda_c1_45_49: number | null
          pop_renda_c1_5_14: number | null
          pop_renda_c1_50_59: number | null
          pop_renda_c1_60_mais: number | null
          pop_renda_c1_ate_4: number | null
          pop_renda_c1_total: number | null
          pop_renda_c2_15_19: number | null
          pop_renda_c2_20_24: number | null
          pop_renda_c2_25_34: number | null
          pop_renda_c2_35_44: number | null
          pop_renda_c2_45_49: number | null
          pop_renda_c2_5_14: number | null
          pop_renda_c2_50_59: number | null
          pop_renda_c2_60_mais: number | null
          pop_renda_c2_ate_4: number | null
          pop_renda_c2_total: number | null
          pop_renda_d_15_19: number | null
          pop_renda_d_20_24: number | null
          pop_renda_d_25_34: number | null
          pop_renda_d_35_44: number | null
          pop_renda_d_45_49: number | null
          pop_renda_d_5_14: number | null
          pop_renda_d_50_59: number | null
          pop_renda_d_60_mais: number | null
          pop_renda_d_ate_4: number | null
          pop_renda_d_total: number | null
          pop_renda_e_15_19: number | null
          pop_renda_e_20_24: number | null
          pop_renda_e_25_34: number | null
          pop_renda_e_35_44: number | null
          pop_renda_e_45_49: number | null
          pop_renda_e_5_14: number | null
          pop_renda_e_50_59: number | null
          pop_renda_e_60_mais: number | null
          pop_renda_e_ate_4: number | null
          pop_renda_e_total: number | null
          pop_renda_idade_total: number | null
          populacao: number | null
          renda_faixa_a_p: number | null
          renda_faixa_a_pp: number | null
          renda_faixa_b1: number | null
          renda_faixa_b2: number | null
          renda_faixa_c1: number | null
          renda_faixa_c2: number | null
          renda_faixa_d: number | null
          renda_faixa_e: number | null
          renda_faixa_total: number | null
          renda_nominal: number | null
        }
        Insert: {
          cep5: string
          consumo_artigos_escolares?: number | null
          consumo_cursos_regulares?: number | null
          consumo_livros_didaticos_revistas_tecnicas?: number | null
          consumo_livros_material_escolar?: number | null
          consumo_outros_livros_material_escolar?: number | null
          consumo_total?: number | null
          id?: never
          municipio: string
          pop_idade_10_14?: number | null
          pop_idade_15_19?: number | null
          pop_idade_20_24?: number | null
          pop_idade_25_29?: number | null
          pop_idade_25_34?: number | null
          pop_idade_30_34?: number | null
          pop_idade_35_39?: number | null
          pop_idade_35_49?: number | null
          pop_idade_40_44?: number | null
          pop_idade_45_49?: number | null
          pop_idade_5_9?: number | null
          pop_idade_50_54?: number | null
          pop_idade_50_59?: number | null
          pop_idade_55_59?: number | null
          pop_idade_60_64?: number | null
          pop_idade_60_mais?: number | null
          pop_idade_65_69?: number | null
          pop_idade_70_74?: number | null
          pop_idade_75_79?: number | null
          pop_idade_80_mais?: number | null
          pop_idade_ate_4?: number | null
          pop_idade_ate_9?: number | null
          pop_idade_total?: number | null
          pop_renda_a_p_15_19?: number | null
          pop_renda_a_p_20_24?: number | null
          pop_renda_a_p_25_34?: number | null
          pop_renda_a_p_35_44?: number | null
          pop_renda_a_p_45_49?: number | null
          pop_renda_a_p_5_14?: number | null
          pop_renda_a_p_50_59?: number | null
          pop_renda_a_p_60_mais?: number | null
          pop_renda_a_p_ate_4?: number | null
          pop_renda_a_p_total?: number | null
          pop_renda_a_pp_15_19?: number | null
          pop_renda_a_pp_20_24?: number | null
          pop_renda_a_pp_25_34?: number | null
          pop_renda_a_pp_35_44?: number | null
          pop_renda_a_pp_45_49?: number | null
          pop_renda_a_pp_5_14?: number | null
          pop_renda_a_pp_50_59?: number | null
          pop_renda_a_pp_60_mais?: number | null
          pop_renda_a_pp_ate_4?: number | null
          pop_renda_a_pp_total?: number | null
          pop_renda_b1_15_19?: number | null
          pop_renda_b1_20_24?: number | null
          pop_renda_b1_25_34?: number | null
          pop_renda_b1_35_44?: number | null
          pop_renda_b1_45_49?: number | null
          pop_renda_b1_5_14?: number | null
          pop_renda_b1_50_59?: number | null
          pop_renda_b1_60_mais?: number | null
          pop_renda_b1_ate_4?: number | null
          pop_renda_b1_total?: number | null
          pop_renda_b2_15_19?: number | null
          pop_renda_b2_20_24?: number | null
          pop_renda_b2_25_34?: number | null
          pop_renda_b2_35_44?: number | null
          pop_renda_b2_45_49?: number | null
          pop_renda_b2_5_14?: number | null
          pop_renda_b2_50_59?: number | null
          pop_renda_b2_60_mais?: number | null
          pop_renda_b2_ate_4?: number | null
          pop_renda_b2_total?: number | null
          pop_renda_c1_15_19?: number | null
          pop_renda_c1_20_24?: number | null
          pop_renda_c1_25_34?: number | null
          pop_renda_c1_35_44?: number | null
          pop_renda_c1_45_49?: number | null
          pop_renda_c1_5_14?: number | null
          pop_renda_c1_50_59?: number | null
          pop_renda_c1_60_mais?: number | null
          pop_renda_c1_ate_4?: number | null
          pop_renda_c1_total?: number | null
          pop_renda_c2_15_19?: number | null
          pop_renda_c2_20_24?: number | null
          pop_renda_c2_25_34?: number | null
          pop_renda_c2_35_44?: number | null
          pop_renda_c2_45_49?: number | null
          pop_renda_c2_5_14?: number | null
          pop_renda_c2_50_59?: number | null
          pop_renda_c2_60_mais?: number | null
          pop_renda_c2_ate_4?: number | null
          pop_renda_c2_total?: number | null
          pop_renda_d_15_19?: number | null
          pop_renda_d_20_24?: number | null
          pop_renda_d_25_34?: number | null
          pop_renda_d_35_44?: number | null
          pop_renda_d_45_49?: number | null
          pop_renda_d_5_14?: number | null
          pop_renda_d_50_59?: number | null
          pop_renda_d_60_mais?: number | null
          pop_renda_d_ate_4?: number | null
          pop_renda_d_total?: number | null
          pop_renda_e_15_19?: number | null
          pop_renda_e_20_24?: number | null
          pop_renda_e_25_34?: number | null
          pop_renda_e_35_44?: number | null
          pop_renda_e_45_49?: number | null
          pop_renda_e_5_14?: number | null
          pop_renda_e_50_59?: number | null
          pop_renda_e_60_mais?: number | null
          pop_renda_e_ate_4?: number | null
          pop_renda_e_total?: number | null
          pop_renda_idade_total?: number | null
          populacao?: number | null
          renda_faixa_a_p?: number | null
          renda_faixa_a_pp?: number | null
          renda_faixa_b1?: number | null
          renda_faixa_b2?: number | null
          renda_faixa_c1?: number | null
          renda_faixa_c2?: number | null
          renda_faixa_d?: number | null
          renda_faixa_e?: number | null
          renda_faixa_total?: number | null
          renda_nominal?: number | null
        }
        Update: {
          cep5?: string
          consumo_artigos_escolares?: number | null
          consumo_cursos_regulares?: number | null
          consumo_livros_didaticos_revistas_tecnicas?: number | null
          consumo_livros_material_escolar?: number | null
          consumo_outros_livros_material_escolar?: number | null
          consumo_total?: number | null
          id?: never
          municipio?: string
          pop_idade_10_14?: number | null
          pop_idade_15_19?: number | null
          pop_idade_20_24?: number | null
          pop_idade_25_29?: number | null
          pop_idade_25_34?: number | null
          pop_idade_30_34?: number | null
          pop_idade_35_39?: number | null
          pop_idade_35_49?: number | null
          pop_idade_40_44?: number | null
          pop_idade_45_49?: number | null
          pop_idade_5_9?: number | null
          pop_idade_50_54?: number | null
          pop_idade_50_59?: number | null
          pop_idade_55_59?: number | null
          pop_idade_60_64?: number | null
          pop_idade_60_mais?: number | null
          pop_idade_65_69?: number | null
          pop_idade_70_74?: number | null
          pop_idade_75_79?: number | null
          pop_idade_80_mais?: number | null
          pop_idade_ate_4?: number | null
          pop_idade_ate_9?: number | null
          pop_idade_total?: number | null
          pop_renda_a_p_15_19?: number | null
          pop_renda_a_p_20_24?: number | null
          pop_renda_a_p_25_34?: number | null
          pop_renda_a_p_35_44?: number | null
          pop_renda_a_p_45_49?: number | null
          pop_renda_a_p_5_14?: number | null
          pop_renda_a_p_50_59?: number | null
          pop_renda_a_p_60_mais?: number | null
          pop_renda_a_p_ate_4?: number | null
          pop_renda_a_p_total?: number | null
          pop_renda_a_pp_15_19?: number | null
          pop_renda_a_pp_20_24?: number | null
          pop_renda_a_pp_25_34?: number | null
          pop_renda_a_pp_35_44?: number | null
          pop_renda_a_pp_45_49?: number | null
          pop_renda_a_pp_5_14?: number | null
          pop_renda_a_pp_50_59?: number | null
          pop_renda_a_pp_60_mais?: number | null
          pop_renda_a_pp_ate_4?: number | null
          pop_renda_a_pp_total?: number | null
          pop_renda_b1_15_19?: number | null
          pop_renda_b1_20_24?: number | null
          pop_renda_b1_25_34?: number | null
          pop_renda_b1_35_44?: number | null
          pop_renda_b1_45_49?: number | null
          pop_renda_b1_5_14?: number | null
          pop_renda_b1_50_59?: number | null
          pop_renda_b1_60_mais?: number | null
          pop_renda_b1_ate_4?: number | null
          pop_renda_b1_total?: number | null
          pop_renda_b2_15_19?: number | null
          pop_renda_b2_20_24?: number | null
          pop_renda_b2_25_34?: number | null
          pop_renda_b2_35_44?: number | null
          pop_renda_b2_45_49?: number | null
          pop_renda_b2_5_14?: number | null
          pop_renda_b2_50_59?: number | null
          pop_renda_b2_60_mais?: number | null
          pop_renda_b2_ate_4?: number | null
          pop_renda_b2_total?: number | null
          pop_renda_c1_15_19?: number | null
          pop_renda_c1_20_24?: number | null
          pop_renda_c1_25_34?: number | null
          pop_renda_c1_35_44?: number | null
          pop_renda_c1_45_49?: number | null
          pop_renda_c1_5_14?: number | null
          pop_renda_c1_50_59?: number | null
          pop_renda_c1_60_mais?: number | null
          pop_renda_c1_ate_4?: number | null
          pop_renda_c1_total?: number | null
          pop_renda_c2_15_19?: number | null
          pop_renda_c2_20_24?: number | null
          pop_renda_c2_25_34?: number | null
          pop_renda_c2_35_44?: number | null
          pop_renda_c2_45_49?: number | null
          pop_renda_c2_5_14?: number | null
          pop_renda_c2_50_59?: number | null
          pop_renda_c2_60_mais?: number | null
          pop_renda_c2_ate_4?: number | null
          pop_renda_c2_total?: number | null
          pop_renda_d_15_19?: number | null
          pop_renda_d_20_24?: number | null
          pop_renda_d_25_34?: number | null
          pop_renda_d_35_44?: number | null
          pop_renda_d_45_49?: number | null
          pop_renda_d_5_14?: number | null
          pop_renda_d_50_59?: number | null
          pop_renda_d_60_mais?: number | null
          pop_renda_d_ate_4?: number | null
          pop_renda_d_total?: number | null
          pop_renda_e_15_19?: number | null
          pop_renda_e_20_24?: number | null
          pop_renda_e_25_34?: number | null
          pop_renda_e_35_44?: number | null
          pop_renda_e_45_49?: number | null
          pop_renda_e_5_14?: number | null
          pop_renda_e_50_59?: number | null
          pop_renda_e_60_mais?: number | null
          pop_renda_e_ate_4?: number | null
          pop_renda_e_total?: number | null
          pop_renda_idade_total?: number | null
          populacao?: number | null
          renda_faixa_a_p?: number | null
          renda_faixa_a_pp?: number | null
          renda_faixa_b1?: number | null
          renda_faixa_b2?: number | null
          renda_faixa_c1?: number | null
          renda_faixa_c2?: number | null
          renda_faixa_d?: number | null
          renda_faixa_e?: number | null
          renda_faixa_total?: number | null
          renda_nominal?: number | null
        }
        Relationships: []
      }
      dim_escola: {
        Row: {
          alunos_ef1: number | null
          alunos_ef2: number | null
          alunos_ei: number | null
          alunos_em: number | null
          alunos_total: number | null
          bairro: string | null
          cep: string | null
          cep5: string | null
          cnpj_escola_censo: string | null
          cod_inep: string | null
          cod_municipio: string
          complemento: string | null
          dados_alunos_disponiveis: boolean
          endereco: string | null
          escola_id: string
          latitude: number | null
          longitude: number | null
          nome_escola: string
          numero: string | null
          qtd_cadastros_protheus: number
          tem_conflito_cadastro: boolean
          tipo_escola: string | null
        }
        Insert: {
          alunos_ef1?: number | null
          alunos_ef2?: number | null
          alunos_ei?: number | null
          alunos_em?: number | null
          alunos_total?: number | null
          bairro?: string | null
          cep?: string | null
          cep5?: string | null
          cnpj_escola_censo?: string | null
          cod_inep?: string | null
          cod_municipio: string
          complemento?: string | null
          dados_alunos_disponiveis?: boolean
          endereco?: string | null
          escola_id: string
          latitude?: number | null
          longitude?: number | null
          nome_escola: string
          numero?: string | null
          qtd_cadastros_protheus?: number
          tem_conflito_cadastro?: boolean
          tipo_escola?: string | null
        }
        Update: {
          alunos_ef1?: number | null
          alunos_ef2?: number | null
          alunos_ei?: number | null
          alunos_em?: number | null
          alunos_total?: number | null
          bairro?: string | null
          cep?: string | null
          cep5?: string | null
          cnpj_escola_censo?: string | null
          cod_inep?: string | null
          cod_municipio?: string
          complemento?: string | null
          dados_alunos_disponiveis?: boolean
          endereco?: string | null
          escola_id?: string
          latitude?: number | null
          longitude?: number | null
          nome_escola?: string
          numero?: string | null
          qtd_cadastros_protheus?: number
          tem_conflito_cadastro?: boolean
          tipo_escola?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_escola_cod_municipio_fkey"
            columns: ["cod_municipio"]
            isOneToOne: false
            referencedRelation: "dim_municipio"
            referencedColumns: ["cod_municipio"]
          },
          {
            foreignKeyName: "dim_escola_cod_municipio_fkey"
            columns: ["cod_municipio"]
            isOneToOne: false
            referencedRelation: "v_escola_por_protheus"
            referencedColumns: ["cod_municipio"]
          },
        ]
      }
      dim_municipio: {
        Row: {
          cod_municipio: string
          municipio: string
          regiao: string
          uf: string
        }
        Insert: {
          cod_municipio: string
          municipio: string
          regiao: string
          uf: string
        }
        Update: {
          cod_municipio?: string
          municipio?: string
          regiao?: string
          uf?: string
        }
        Relationships: []
      }
      escola_protheus: {
        Row: {
          adocao_inconsistente: boolean
          adota_brasil: boolean
          adota_did_apoio_brasil: boolean
          adota_literatura_brasil: boolean
          adota_sistema_brasil: boolean
          cd_escola: string | null
          cnpj_protheus: string | null
          cnpj_protheus_status: string
          cod_protheus: string
          escola_id: string
          mensalidade_ef1: string | null
          mensalidade_ef2: string | null
          mensalidade_ei: string | null
          mensalidade_em: string | null
          tipo_contrato_brasil: string | null
          tipos_adocao: string[]
        }
        Insert: {
          adocao_inconsistente?: boolean
          adota_brasil?: boolean
          adota_did_apoio_brasil?: boolean
          adota_literatura_brasil?: boolean
          adota_sistema_brasil?: boolean
          cd_escola?: string | null
          cnpj_protheus?: string | null
          cnpj_protheus_status: string
          cod_protheus: string
          escola_id: string
          mensalidade_ef1?: string | null
          mensalidade_ef2?: string | null
          mensalidade_ei?: string | null
          mensalidade_em?: string | null
          tipo_contrato_brasil?: string | null
          tipos_adocao: string[]
        }
        Update: {
          adocao_inconsistente?: boolean
          adota_brasil?: boolean
          adota_did_apoio_brasil?: boolean
          adota_literatura_brasil?: boolean
          adota_sistema_brasil?: boolean
          cd_escola?: string | null
          cnpj_protheus?: string | null
          cnpj_protheus_status?: string
          cod_protheus?: string
          escola_id?: string
          mensalidade_ef1?: string | null
          mensalidade_ef2?: string | null
          mensalidade_ei?: string | null
          mensalidade_em?: string | null
          tipo_contrato_brasil?: string | null
          tipos_adocao?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "escola_protheus_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "dim_escola"
            referencedColumns: ["escola_id"]
          },
          {
            foreignKeyName: "escola_protheus_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "v_escola_por_protheus"
            referencedColumns: ["escola_id"]
          },
        ]
      }
    }
    Views: {
      v_escola_por_protheus: {
        Row: {
          adocao_inconsistente: boolean | null
          adota_brasil: boolean | null
          adota_did_apoio_brasil: boolean | null
          adota_literatura_brasil: boolean | null
          adota_sistema_brasil: boolean | null
          alunos_ef1: number | null
          alunos_ef2: number | null
          alunos_ei: number | null
          alunos_em: number | null
          alunos_total: number | null
          bairro: string | null
          cd_escola: string | null
          cep: string | null
          cep5: string | null
          cnpj_escola_censo: string | null
          cnpj_protheus: string | null
          cnpj_protheus_status: string | null
          cod_inep: string | null
          cod_municipio: string | null
          cod_protheus: string | null
          complemento: string | null
          dados_alunos_disponiveis: boolean | null
          endereco: string | null
          escola_id: string | null
          latitude: number | null
          longitude: number | null
          mensalidade_ef1: string | null
          mensalidade_ef2: string | null
          mensalidade_ei: string | null
          mensalidade_em: string | null
          municipio: string | null
          nome_escola: string | null
          numero: string | null
          qtd_cadastros_protheus: number | null
          regiao: string | null
          tem_conflito_cadastro: boolean | null
          tipo_contrato_brasil: string | null
          tipo_escola: string | null
          tipos_adocao: string[] | null
          uf: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
