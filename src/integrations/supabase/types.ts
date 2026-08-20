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
      cadastros: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          cargo: string
          cod_protheus: string | null
          created_at: string
          email: string
          gestor: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          cargo: string
          cod_protheus?: string | null
          created_at?: string
          email: string
          gestor?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          cargo?: string
          cod_protheus?: string | null
          created_at?: string
          email?: string
          gestor?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      carteiras_escolas_v3: {
        Row: {
          adocao_brasil_did_apoio_ei: number
          adocao_brasil_did_apoio_em: number
          adocao_brasil_did_apoio_f1: number
          adocao_brasil_did_apoio_f2: number
          adocao_brasil_literatura_ei: number
          adocao_brasil_literatura_em: number
          adocao_brasil_literatura_f1: number
          adocao_brasil_literatura_f2: number
          adocao_brasil_sistema_ei: number
          adocao_brasil_sistema_em: number
          adocao_brasil_sistema_f1: number
          adocao_brasil_sistema_f2: number
          adocao_material_proprio_ei: number
          adocao_material_proprio_em: number
          adocao_material_proprio_f1: number
          adocao_material_proprio_f2: number
          adocao_outra_did_apoio_ei: number
          adocao_outra_did_apoio_em: number
          adocao_outra_did_apoio_f1: number
          adocao_outra_did_apoio_f2: number
          adocao_outra_literatura_ei: number
          adocao_outra_literatura_em: number
          adocao_outra_literatura_f1: number
          adocao_outra_literatura_f2: number
          adocao_outra_sistema_ei: number
          adocao_outra_sistema_em: number
          adocao_outra_sistema_f1: number
          adocao_outra_sistema_f2: number
          adota_brasil: boolean
          adota_did_apoio_brasil: boolean
          adota_lit_brasil: boolean
          adota_sistema_brasil: boolean
          alunos_ei: number
          alunos_em: number
          alunos_f1: number
          alunos_f2: number
          alvo_bilingue: boolean
          alvo_brincando: boolean
          alvo_cora: boolean
          alvo_versa: boolean
          bairro: string
          cep: string
          cep5: string
          cnpj_escola_censo: string | null
          cod_consultor: string
          cod_escola: string | null
          cod_inep: string | null
          cod_municipio: string
          cod_protheus: string
          cod_regiao_geografica_imediata: string
          cod_regiao_geografica_intermediaria: string
          consultor: string
          ddd: string | null
          endereco: string
          gerente: string
          id: number
          imported_at: string
          latitude: number | null
          longitude: number | null
          mensalidade_ei: string | null
          mensalidade_em: string | null
          mensalidade_f1: string | null
          mensalidade_f2: string | null
          municipio: string
          nome_escola: string
          numero: string | null
          regiao: string
          regiao_geografica_imediata: string
          regiao_geografica_intermediaria: string
          telefone: string | null
          tipo_adocao: string
          tipo_contrato_brasil: string | null
          tipo_escola: string | null
          uf: string
        }
        Insert: {
          adocao_brasil_did_apoio_ei?: number
          adocao_brasil_did_apoio_em?: number
          adocao_brasil_did_apoio_f1?: number
          adocao_brasil_did_apoio_f2?: number
          adocao_brasil_literatura_ei?: number
          adocao_brasil_literatura_em?: number
          adocao_brasil_literatura_f1?: number
          adocao_brasil_literatura_f2?: number
          adocao_brasil_sistema_ei?: number
          adocao_brasil_sistema_em?: number
          adocao_brasil_sistema_f1?: number
          adocao_brasil_sistema_f2?: number
          adocao_material_proprio_ei?: number
          adocao_material_proprio_em?: number
          adocao_material_proprio_f1?: number
          adocao_material_proprio_f2?: number
          adocao_outra_did_apoio_ei?: number
          adocao_outra_did_apoio_em?: number
          adocao_outra_did_apoio_f1?: number
          adocao_outra_did_apoio_f2?: number
          adocao_outra_literatura_ei?: number
          adocao_outra_literatura_em?: number
          adocao_outra_literatura_f1?: number
          adocao_outra_literatura_f2?: number
          adocao_outra_sistema_ei?: number
          adocao_outra_sistema_em?: number
          adocao_outra_sistema_f1?: number
          adocao_outra_sistema_f2?: number
          adota_brasil?: boolean
          adota_did_apoio_brasil?: boolean
          adota_lit_brasil?: boolean
          adota_sistema_brasil?: boolean
          alunos_ei?: number
          alunos_em?: number
          alunos_f1?: number
          alunos_f2?: number
          alvo_bilingue?: boolean
          alvo_brincando?: boolean
          alvo_cora?: boolean
          alvo_versa?: boolean
          bairro: string
          cep: string
          cep5: string
          cnpj_escola_censo?: string | null
          cod_consultor: string
          cod_escola?: string | null
          cod_inep?: string | null
          cod_municipio: string
          cod_protheus: string
          cod_regiao_geografica_imediata: string
          cod_regiao_geografica_intermediaria: string
          consultor: string
          ddd?: string | null
          endereco: string
          gerente: string
          id?: never
          imported_at?: string
          latitude?: number | null
          longitude?: number | null
          mensalidade_ei?: string | null
          mensalidade_em?: string | null
          mensalidade_f1?: string | null
          mensalidade_f2?: string | null
          municipio: string
          nome_escola: string
          numero?: string | null
          regiao: string
          regiao_geografica_imediata: string
          regiao_geografica_intermediaria: string
          telefone?: string | null
          tipo_adocao: string
          tipo_contrato_brasil?: string | null
          tipo_escola?: string | null
          uf: string
        }
        Update: {
          adocao_brasil_did_apoio_ei?: number
          adocao_brasil_did_apoio_em?: number
          adocao_brasil_did_apoio_f1?: number
          adocao_brasil_did_apoio_f2?: number
          adocao_brasil_literatura_ei?: number
          adocao_brasil_literatura_em?: number
          adocao_brasil_literatura_f1?: number
          adocao_brasil_literatura_f2?: number
          adocao_brasil_sistema_ei?: number
          adocao_brasil_sistema_em?: number
          adocao_brasil_sistema_f1?: number
          adocao_brasil_sistema_f2?: number
          adocao_material_proprio_ei?: number
          adocao_material_proprio_em?: number
          adocao_material_proprio_f1?: number
          adocao_material_proprio_f2?: number
          adocao_outra_did_apoio_ei?: number
          adocao_outra_did_apoio_em?: number
          adocao_outra_did_apoio_f1?: number
          adocao_outra_did_apoio_f2?: number
          adocao_outra_literatura_ei?: number
          adocao_outra_literatura_em?: number
          adocao_outra_literatura_f1?: number
          adocao_outra_literatura_f2?: number
          adocao_outra_sistema_ei?: number
          adocao_outra_sistema_em?: number
          adocao_outra_sistema_f1?: number
          adocao_outra_sistema_f2?: number
          adota_brasil?: boolean
          adota_did_apoio_brasil?: boolean
          adota_lit_brasil?: boolean
          adota_sistema_brasil?: boolean
          alunos_ei?: number
          alunos_em?: number
          alunos_f1?: number
          alunos_f2?: number
          alvo_bilingue?: boolean
          alvo_brincando?: boolean
          alvo_cora?: boolean
          alvo_versa?: boolean
          bairro?: string
          cep?: string
          cep5?: string
          cnpj_escola_censo?: string | null
          cod_consultor?: string
          cod_escola?: string | null
          cod_inep?: string | null
          cod_municipio?: string
          cod_protheus?: string
          cod_regiao_geografica_imediata?: string
          cod_regiao_geografica_intermediaria?: string
          consultor?: string
          ddd?: string | null
          endereco?: string
          gerente?: string
          id?: never
          imported_at?: string
          latitude?: number | null
          longitude?: number | null
          mensalidade_ei?: string | null
          mensalidade_em?: string | null
          mensalidade_f1?: string | null
          mensalidade_f2?: string | null
          municipio?: string
          nome_escola?: string
          numero?: string | null
          regiao?: string
          regiao_geografica_imediata?: string
          regiao_geografica_intermediaria?: string
          telefone?: string | null
          tipo_adocao?: string
          tipo_contrato_brasil?: string | null
          tipo_escola?: string | null
          uf?: string
        }
        Relationships: []
      }
      enem_medias_municipio: {
        Row: {
          ano: number
          codigo_municipio: string
          imported_at: string
          media_ch: number | null
          media_cn: number | null
          media_lc: number | null
          media_mt: number | null
          media_redacao: number | null
          media_redacao_comp1: number | null
          media_redacao_comp2: number | null
          media_redacao_comp3: number | null
          media_redacao_comp4: number | null
          media_redacao_comp5: number | null
          municipio: string
          n_ch: number
          n_cn: number
          n_lc: number
          n_mt: number
          n_redacao: number
          n_redacao_comp1: number
          n_redacao_comp2: number
          n_redacao_comp3: number
          n_redacao_comp4: number
          n_redacao_comp5: number
          participantes_total: number
          uf: string
        }
        Insert: {
          ano: number
          codigo_municipio: string
          imported_at?: string
          media_ch?: number | null
          media_cn?: number | null
          media_lc?: number | null
          media_mt?: number | null
          media_redacao?: number | null
          media_redacao_comp1?: number | null
          media_redacao_comp2?: number | null
          media_redacao_comp3?: number | null
          media_redacao_comp4?: number | null
          media_redacao_comp5?: number | null
          municipio: string
          n_ch?: number
          n_cn?: number
          n_lc?: number
          n_mt?: number
          n_redacao?: number
          n_redacao_comp1?: number
          n_redacao_comp2?: number
          n_redacao_comp3?: number
          n_redacao_comp4?: number
          n_redacao_comp5?: number
          participantes_total: number
          uf: string
        }
        Update: {
          ano?: number
          codigo_municipio?: string
          imported_at?: string
          media_ch?: number | null
          media_cn?: number | null
          media_lc?: number | null
          media_mt?: number | null
          media_redacao?: number | null
          media_redacao_comp1?: number | null
          media_redacao_comp2?: number | null
          media_redacao_comp3?: number | null
          media_redacao_comp4?: number | null
          media_redacao_comp5?: number | null
          municipio?: string
          n_ch?: number
          n_cn?: number
          n_lc?: number
          n_mt?: number
          n_redacao?: number
          n_redacao_comp1?: number
          n_redacao_comp2?: number
          n_redacao_comp3?: number
          n_redacao_comp4?: number
          n_redacao_comp5?: number
          participantes_total?: number
          uf?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          arquivo_carteira: string | null
          cargo: string
          cod_protheus: string
          created_at: string
          gestor: string | null
          id: string
          must_change_password: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          arquivo_carteira?: string | null
          cargo?: string
          cod_protheus: string
          created_at?: string
          gestor?: string | null
          id: string
          must_change_password?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          arquivo_carteira?: string | null
          cargo?: string
          cod_protheus?: string
          created_at?: string
          gestor?: string | null
          id?: string
          must_change_password?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          created_at: string
          id: string
          name: string | null
          payload: Json | null
          session_id: string | null
          type: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          payload?: Json | null
          session_id?: string | null
          type: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          payload?: Json | null
          session_id?: string | null
          type?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      telemetry_weekly_usage: {
        Row: {
          erros: number | null
          page_views: number | null
          semana: string | null
          sessoes: number | null
          usuarios_ativos: number | null
        }
        Relationships: []
      }
      vw_carteiras_etapa_2_1: {
        Row: {
          adocao_brasil_did_apoio_ei: number | null
          adocao_brasil_did_apoio_em: number | null
          adocao_brasil_did_apoio_f1: number | null
          adocao_brasil_did_apoio_f2: number | null
          adocao_brasil_literatura_ei: number | null
          adocao_brasil_literatura_em: number | null
          adocao_brasil_literatura_f1: number | null
          adocao_brasil_literatura_f2: number | null
          adocao_brasil_sistema_ei: number | null
          adocao_brasil_sistema_em: number | null
          adocao_brasil_sistema_f1: number | null
          adocao_brasil_sistema_f2: number | null
          adocao_material_proprio_ei: number | null
          adocao_material_proprio_em: number | null
          adocao_material_proprio_f1: number | null
          adocao_material_proprio_f2: number | null
          adocao_outra_did_apoio_ei: number | null
          adocao_outra_did_apoio_em: number | null
          adocao_outra_did_apoio_f1: number | null
          adocao_outra_did_apoio_f2: number | null
          adocao_outra_literatura_ei: number | null
          adocao_outra_literatura_em: number | null
          adocao_outra_literatura_f1: number | null
          adocao_outra_literatura_f2: number | null
          adocao_outra_sistema_ei: number | null
          adocao_outra_sistema_em: number | null
          adocao_outra_sistema_f1: number | null
          adocao_outra_sistema_f2: number | null
          adota_brasil: boolean | null
          adota_did_apoio_brasil: boolean | null
          adota_lit_brasil: boolean | null
          adota_sistema_brasil: boolean | null
          alunos_ei: number | null
          alunos_em: number | null
          alunos_f1: number | null
          alunos_f2: number | null
          alvo_bilingue: boolean | null
          alvo_brincando: boolean | null
          alvo_cora: boolean | null
          alvo_versa: boolean | null
          bairro: string | null
          cep: string | null
          cep5: string | null
          cnpj_escola_censo: string | null
          cod_consultor: string | null
          cod_escola: string | null
          cod_inep: string | null
          cod_municipio: string | null
          cod_protheus: string | null
          cod_regiao_geografica_imediata: string | null
          cod_regiao_geografica_intermediaria: string | null
          consultor: string | null
          ddd: string | null
          endereco: string | null
          gerente: string | null
          id: number | null
          imported_at: string | null
          latitude: number | null
          longitude: number | null
          mensalidade_ei: string | null
          mensalidade_em: string | null
          mensalidade_f1: string | null
          mensalidade_f2: string | null
          municipio: string | null
          nome_escola: string | null
          numero: string | null
          ocorrencias_cod_protheus: number | null
          regiao: string | null
          regiao_geografica_imediata: string | null
          regiao_geografica_intermediaria: string | null
          telefone: string | null
          telefone_formatado: string | null
          tipo_adocao: string | null
          tipo_contrato_brasil: string | null
          tipo_escola: string | null
          total_alunos: number | null
          uf: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_cadastros: { Args: { payload: Json }; Returns: Json }
      reset_carteiras_escolas_v3: { Args: never; Returns: undefined }
      validar_carteiras_escolas_v3: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "consultor"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "consultor"],
    },
  },
} as const
