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
      audit_data_quality: {
        Row: {
          carga_id: string | null
          check_id: string
          dataset: string
          detalhes: Json
          executado_em: string
          nome_check: string
          passou: boolean
          severidade: string
        }
        Insert: {
          carga_id?: string | null
          check_id?: string
          dataset: string
          detalhes?: Json
          executado_em?: string
          nome_check: string
          passou: boolean
          severidade: string
        }
        Update: {
          carga_id?: string | null
          check_id?: string
          dataset?: string
          detalhes?: Json
          executado_em?: string
          nome_check?: string
          passou?: boolean
          severidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_data_quality_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "etl_cargas"
            referencedColumns: ["carga_id"]
          },
        ]
      }
      audit_replication_runs: {
        Row: {
          atualizadas: number
          carga_id: string | null
          checksum_destino: string | null
          checksum_origem: string | null
          destino: string
          erro: string | null
          finalizada_em: string | null
          iniciada_em: string
          inseridas: number
          linhas_destino: number | null
          linhas_origem: number | null
          origem: string
          rejeitadas: number
          run_id: string
          status: string
          tabela: string
        }
        Insert: {
          atualizadas?: number
          carga_id?: string | null
          checksum_destino?: string | null
          checksum_origem?: string | null
          destino?: string
          erro?: string | null
          finalizada_em?: string | null
          iniciada_em?: string
          inseridas?: number
          linhas_destino?: number | null
          linhas_origem?: number | null
          origem?: string
          rejeitadas?: number
          run_id?: string
          status: string
          tabela: string
        }
        Update: {
          atualizadas?: number
          carga_id?: string | null
          checksum_destino?: string | null
          checksum_origem?: string | null
          destino?: string
          erro?: string | null
          finalizada_em?: string | null
          iniciada_em?: string
          inseridas?: number
          linhas_destino?: number | null
          linhas_origem?: number | null
          origem?: string
          rejeitadas?: number
          run_id?: string
          status?: string
          tabela?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_replication_runs_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "etl_cargas"
            referencedColumns: ["carga_id"]
          },
        ]
      }
      dim_cep5: {
        Row: {
          ativo: boolean
          atualizado_em: string
          carga_id: string
          cep5: string
          cod_municipal: string
          metodo_resolucao: string
          municipio_origem: string
          uf_origem: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          carga_id: string
          cep5: string
          cod_municipal: string
          metodo_resolucao: string
          municipio_origem: string
          uf_origem: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          carga_id?: string
          cep5?: string
          cod_municipal?: string
          metodo_resolucao?: string
          municipio_origem?: string
          uf_origem?: string
        }
        Relationships: [
          {
            foreignKeyName: "dim_cep5_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "etl_cargas"
            referencedColumns: ["carga_id"]
          },
          {
            foreignKeyName: "dim_cep5_cod_municipal_fkey"
            columns: ["cod_municipal"]
            isOneToOne: false
            referencedRelation: "dim_municipio"
            referencedColumns: ["cod_municipal"]
          },
        ]
      }
      dim_distrito: {
        Row: {
          ano_dtb: number
          ativo: boolean
          atualizado_em: string
          carga_id: string
          cod_distrito: string
          cod_municipal: string
          data_base_dtb: string
          distrito: string
          distrito_dtb: string
        }
        Insert: {
          ano_dtb: number
          ativo?: boolean
          atualizado_em?: string
          carga_id: string
          cod_distrito: string
          cod_municipal: string
          data_base_dtb: string
          distrito: string
          distrito_dtb: string
        }
        Update: {
          ano_dtb?: number
          ativo?: boolean
          atualizado_em?: string
          carga_id?: string
          cod_distrito?: string
          cod_municipal?: string
          data_base_dtb?: string
          distrito?: string
          distrito_dtb?: string
        }
        Relationships: [
          {
            foreignKeyName: "dim_distrito_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "etl_cargas"
            referencedColumns: ["carga_id"]
          },
          {
            foreignKeyName: "dim_distrito_cod_municipal_fkey"
            columns: ["cod_municipal"]
            isOneToOne: false
            referencedRelation: "dim_municipio"
            referencedColumns: ["cod_municipal"]
          },
        ]
      }
      dim_municipio: {
        Row: {
          ano_dtb: number
          ativo: boolean
          atualizado_em: string
          carga_id: string
          cod_municipal: string
          cod_municipio_dtb: string
          cod_regiao_imediata: string
          cod_regiao_intermediaria: string
          cod_uf: string
          data_base_dtb: string
          municipio: string
          nome_uf: string
          regiao_imediata: string
          regiao_intermediaria: string
        }
        Insert: {
          ano_dtb: number
          ativo?: boolean
          atualizado_em?: string
          carga_id: string
          cod_municipal: string
          cod_municipio_dtb: string
          cod_regiao_imediata: string
          cod_regiao_intermediaria: string
          cod_uf: string
          data_base_dtb: string
          municipio: string
          nome_uf: string
          regiao_imediata: string
          regiao_intermediaria: string
        }
        Update: {
          ano_dtb?: number
          ativo?: boolean
          atualizado_em?: string
          carga_id?: string
          cod_municipal?: string
          cod_municipio_dtb?: string
          cod_regiao_imediata?: string
          cod_regiao_intermediaria?: string
          cod_uf?: string
          data_base_dtb?: string
          municipio?: string
          nome_uf?: string
          regiao_imediata?: string
          regiao_intermediaria?: string
        }
        Relationships: [
          {
            foreignKeyName: "dim_municipio_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "etl_cargas"
            referencedColumns: ["carga_id"]
          },
        ]
      }
      dim_subdistrito: {
        Row: {
          ano_dtb: number
          ativo: boolean
          atualizado_em: string
          carga_id: string
          cod_distrito: string
          cod_municipal: string
          cod_subdistrito: string
          data_base_dtb: string
          subdistrito: string
          subdistrito_dtb: string
        }
        Insert: {
          ano_dtb: number
          ativo?: boolean
          atualizado_em?: string
          carga_id: string
          cod_distrito: string
          cod_municipal: string
          cod_subdistrito: string
          data_base_dtb: string
          subdistrito: string
          subdistrito_dtb: string
        }
        Update: {
          ano_dtb?: number
          ativo?: boolean
          atualizado_em?: string
          carga_id?: string
          cod_distrito?: string
          cod_municipal?: string
          cod_subdistrito?: string
          data_base_dtb?: string
          subdistrito?: string
          subdistrito_dtb?: string
        }
        Relationships: [
          {
            foreignKeyName: "dim_subdistrito_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "etl_cargas"
            referencedColumns: ["carga_id"]
          },
          {
            foreignKeyName: "dim_subdistrito_cod_distrito_fkey"
            columns: ["cod_distrito"]
            isOneToOne: false
            referencedRelation: "dim_distrito"
            referencedColumns: ["cod_distrito"]
          },
          {
            foreignKeyName: "dim_subdistrito_cod_municipal_fkey"
            columns: ["cod_municipal"]
            isOneToOne: false
            referencedRelation: "dim_municipio"
            referencedColumns: ["cod_municipal"]
          },
        ]
      }
      etl_cargas: {
        Row: {
          ano_referencia: number | null
          arquivo_nome: string | null
          arquivo_sha256: string | null
          carga_id: string
          criado_em: string
          dataset: string
          finalizada_em: string | null
          fonte_referencia: string | null
          fonte_sistema: string
          iniciada_em: string
          linhas_gravadas: number
          linhas_recebidas: number
          linhas_rejeitadas: number
          linhas_validas: number
          observacoes: string | null
          status: string
        }
        Insert: {
          ano_referencia?: number | null
          arquivo_nome?: string | null
          arquivo_sha256?: string | null
          carga_id?: string
          criado_em?: string
          dataset: string
          finalizada_em?: string | null
          fonte_referencia?: string | null
          fonte_sistema: string
          iniciada_em?: string
          linhas_gravadas?: number
          linhas_recebidas?: number
          linhas_rejeitadas?: number
          linhas_validas?: number
          observacoes?: string | null
          status: string
        }
        Update: {
          ano_referencia?: number | null
          arquivo_nome?: string | null
          arquivo_sha256?: string | null
          carga_id?: string
          criado_em?: string
          dataset?: string
          finalizada_em?: string | null
          fonte_referencia?: string | null
          fonte_sistema?: string
          iniciada_em?: string
          linhas_gravadas?: number
          linhas_recebidas?: number
          linhas_rejeitadas?: number
          linhas_validas?: number
          observacoes?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          cargo: string | null
          cod_protheus: string | null
          created_at: string
          email: string
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          cod_protheus?: string | null
          created_at?: string
          email: string
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          cod_protheus?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      cit_ingest: { Args: { action: string; payload?: Json }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "consultor"
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
    Enums: {
      app_role: ["admin", "gestor", "consultor"],
    },
  },
} as const
