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
      censo_escolas_privadas_ativas: {
        Row: {
          carregado_em: string
          co_municipio: string | null
          co_rede: number | null
          cod_inep: string
          in_biblioteca: number | null
          in_biblioteca_sala_leitura: number | null
          in_comp_portatil_aluno: number | null
          in_comum_creche: number | null
          in_comum_eja_fund: number | null
          in_comum_eja_medio: number | null
          in_comum_eja_prof: number | null
          in_comum_fund_af: number | null
          in_comum_fund_ai: number | null
          in_comum_medio_fic: number | null
          in_comum_medio_integrado: number | null
          in_comum_medio_medio: number | null
          in_comum_medio_normal: number | null
          in_comum_pre: number | null
          in_comum_prof: number | null
          in_desktop_aluno: number | null
          in_educ_amb_conteudo: number | null
          in_educ_amb_curricular: number | null
          in_educ_amb_eixo: number | null
          in_educ_amb_eventos: number | null
          in_educ_amb_nenhuma: number | null
          in_educ_amb_projetos: number | null
          in_educ_ambiental: number | null
          in_eja: number | null
          in_equip_dvd: number | null
          in_equip_lousa_digital: number | null
          in_equip_multimidia: number | null
          in_equip_som: number | null
          in_equip_tv: number | null
          in_esp_exclusiva_creche: number | null
          in_esp_exclusiva_eja_fund: number | null
          in_esp_exclusiva_eja_medio: number | null
          in_esp_exclusiva_eja_prof: number | null
          in_esp_exclusiva_fund_af: number | null
          in_esp_exclusiva_fund_ai: number | null
          in_esp_exclusiva_medio_fic: number | null
          in_esp_exclusiva_medio_integr: number | null
          in_esp_exclusiva_medio_medio: number | null
          in_esp_exclusiva_medio_normal: number | null
          in_esp_exclusiva_pre: number | null
          in_esp_exclusiva_prof: number | null
          in_espaco_atividade: number | null
          in_espaco_equipamento: number | null
          in_especial_exclusiva: number | null
          in_exame_selecao: number | null
          in_internet_aprendizagem: number | null
          in_laboratorio_ciencias: number | null
          in_laboratorio_informatica: number | null
          in_material_esp_indigena: number | null
          in_material_esp_nao_utiliza: number | null
          in_material_esp_quilombola: number | null
          in_material_ped_agricola: number | null
          in_material_ped_artisticas: number | null
          in_material_ped_bil_surdos: number | null
          in_material_ped_campo: number | null
          in_material_ped_cientifico: number | null
          in_material_ped_desportiva: number | null
          in_material_ped_difusao: number | null
          in_material_ped_edu_esp: number | null
          in_material_ped_etnico: number | null
          in_material_ped_indigena: number | null
          in_material_ped_infantil: number | null
          in_material_ped_jogos: number | null
          in_material_ped_multimidia: number | null
          in_material_ped_musical: number | null
          in_material_ped_nenhum: number | null
          in_material_ped_profissional: number | null
          in_material_ped_quilombola: number | null
          in_mediacao_ead: number | null
          in_mediacao_presencial: number | null
          in_mediacao_semipresencial: number | null
          in_orgao_ass_pais: number | null
          in_orgao_ass_pais_mestres: number | null
          in_orgao_conselho_escolar: number | null
          in_orgao_gremio_estudantil: number | null
          in_orgao_nenhum: number | null
          in_orgao_outros: number | null
          in_parque_infantil: number | null
          in_patio_coberto: number | null
          in_patio_descoberto: number | null
          in_piscina: number | null
          in_quadra_esportes: number | null
          in_quadra_esportes_coberta: number | null
          in_quadra_esportes_descoberta: number | null
          in_redes_sociais: number | null
          in_regular: number | null
          in_reserva_nenhuma: number | null
          in_reserva_outros: number | null
          in_reserva_pcd: number | null
          in_reserva_ppi: number | null
          in_reserva_publica: number | null
          in_reserva_renda: number | null
          in_sala_atelie_artes: number | null
          in_sala_atendimento_especial: number | null
          in_sala_estudio_danca: number | null
          in_sala_estudio_gravacao: number | null
          in_sala_leitura: number | null
          in_sala_multiuso: number | null
          in_sala_musica_coral: number | null
          in_tablet_aluno: number | null
          in_terreirao: number | null
          in_viveiro: number | null
          no_entidade: string | null
          no_municipio: string | null
          nu_ano_censo: number
          qt_comp_portatil_aluno: number | null
          qt_desktop_aluno: number | null
          qt_equip_dvd: number | null
          qt_equip_lousa_digital: number | null
          qt_equip_multimidia: number | null
          qt_equip_som: number | null
          qt_equip_tv: number | null
          qt_salas_utiliza_climatizadas: number | null
          qt_salas_utilizadas: number | null
          qt_salas_utilizadas_acessiveis: number | null
          qt_tablet_aluno: number | null
          tp_aee: number | null
          tp_categoria_escola_privada: number | null
          tp_dependencia: number | null
          tp_localizacao: number | null
          tp_localizacao_diferenciada: number | null
          tp_situacao_funcionamento: number | null
        }
        Insert: {
          carregado_em?: string
          co_municipio?: string | null
          co_rede?: number | null
          cod_inep: string
          in_biblioteca?: number | null
          in_biblioteca_sala_leitura?: number | null
          in_comp_portatil_aluno?: number | null
          in_comum_creche?: number | null
          in_comum_eja_fund?: number | null
          in_comum_eja_medio?: number | null
          in_comum_eja_prof?: number | null
          in_comum_fund_af?: number | null
          in_comum_fund_ai?: number | null
          in_comum_medio_fic?: number | null
          in_comum_medio_integrado?: number | null
          in_comum_medio_medio?: number | null
          in_comum_medio_normal?: number | null
          in_comum_pre?: number | null
          in_comum_prof?: number | null
          in_desktop_aluno?: number | null
          in_educ_amb_conteudo?: number | null
          in_educ_amb_curricular?: number | null
          in_educ_amb_eixo?: number | null
          in_educ_amb_eventos?: number | null
          in_educ_amb_nenhuma?: number | null
          in_educ_amb_projetos?: number | null
          in_educ_ambiental?: number | null
          in_eja?: number | null
          in_equip_dvd?: number | null
          in_equip_lousa_digital?: number | null
          in_equip_multimidia?: number | null
          in_equip_som?: number | null
          in_equip_tv?: number | null
          in_esp_exclusiva_creche?: number | null
          in_esp_exclusiva_eja_fund?: number | null
          in_esp_exclusiva_eja_medio?: number | null
          in_esp_exclusiva_eja_prof?: number | null
          in_esp_exclusiva_fund_af?: number | null
          in_esp_exclusiva_fund_ai?: number | null
          in_esp_exclusiva_medio_fic?: number | null
          in_esp_exclusiva_medio_integr?: number | null
          in_esp_exclusiva_medio_medio?: number | null
          in_esp_exclusiva_medio_normal?: number | null
          in_esp_exclusiva_pre?: number | null
          in_esp_exclusiva_prof?: number | null
          in_espaco_atividade?: number | null
          in_espaco_equipamento?: number | null
          in_especial_exclusiva?: number | null
          in_exame_selecao?: number | null
          in_internet_aprendizagem?: number | null
          in_laboratorio_ciencias?: number | null
          in_laboratorio_informatica?: number | null
          in_material_esp_indigena?: number | null
          in_material_esp_nao_utiliza?: number | null
          in_material_esp_quilombola?: number | null
          in_material_ped_agricola?: number | null
          in_material_ped_artisticas?: number | null
          in_material_ped_bil_surdos?: number | null
          in_material_ped_campo?: number | null
          in_material_ped_cientifico?: number | null
          in_material_ped_desportiva?: number | null
          in_material_ped_difusao?: number | null
          in_material_ped_edu_esp?: number | null
          in_material_ped_etnico?: number | null
          in_material_ped_indigena?: number | null
          in_material_ped_infantil?: number | null
          in_material_ped_jogos?: number | null
          in_material_ped_multimidia?: number | null
          in_material_ped_musical?: number | null
          in_material_ped_nenhum?: number | null
          in_material_ped_profissional?: number | null
          in_material_ped_quilombola?: number | null
          in_mediacao_ead?: number | null
          in_mediacao_presencial?: number | null
          in_mediacao_semipresencial?: number | null
          in_orgao_ass_pais?: number | null
          in_orgao_ass_pais_mestres?: number | null
          in_orgao_conselho_escolar?: number | null
          in_orgao_gremio_estudantil?: number | null
          in_orgao_nenhum?: number | null
          in_orgao_outros?: number | null
          in_parque_infantil?: number | null
          in_patio_coberto?: number | null
          in_patio_descoberto?: number | null
          in_piscina?: number | null
          in_quadra_esportes?: number | null
          in_quadra_esportes_coberta?: number | null
          in_quadra_esportes_descoberta?: number | null
          in_redes_sociais?: number | null
          in_regular?: number | null
          in_reserva_nenhuma?: number | null
          in_reserva_outros?: number | null
          in_reserva_pcd?: number | null
          in_reserva_ppi?: number | null
          in_reserva_publica?: number | null
          in_reserva_renda?: number | null
          in_sala_atelie_artes?: number | null
          in_sala_atendimento_especial?: number | null
          in_sala_estudio_danca?: number | null
          in_sala_estudio_gravacao?: number | null
          in_sala_leitura?: number | null
          in_sala_multiuso?: number | null
          in_sala_musica_coral?: number | null
          in_tablet_aluno?: number | null
          in_terreirao?: number | null
          in_viveiro?: number | null
          no_entidade?: string | null
          no_municipio?: string | null
          nu_ano_censo: number
          qt_comp_portatil_aluno?: number | null
          qt_desktop_aluno?: number | null
          qt_equip_dvd?: number | null
          qt_equip_lousa_digital?: number | null
          qt_equip_multimidia?: number | null
          qt_equip_som?: number | null
          qt_equip_tv?: number | null
          qt_salas_utiliza_climatizadas?: number | null
          qt_salas_utilizadas?: number | null
          qt_salas_utilizadas_acessiveis?: number | null
          qt_tablet_aluno?: number | null
          tp_aee?: number | null
          tp_categoria_escola_privada?: number | null
          tp_dependencia?: number | null
          tp_localizacao?: number | null
          tp_localizacao_diferenciada?: number | null
          tp_situacao_funcionamento?: number | null
        }
        Update: {
          carregado_em?: string
          co_municipio?: string | null
          co_rede?: number | null
          cod_inep?: string
          in_biblioteca?: number | null
          in_biblioteca_sala_leitura?: number | null
          in_comp_portatil_aluno?: number | null
          in_comum_creche?: number | null
          in_comum_eja_fund?: number | null
          in_comum_eja_medio?: number | null
          in_comum_eja_prof?: number | null
          in_comum_fund_af?: number | null
          in_comum_fund_ai?: number | null
          in_comum_medio_fic?: number | null
          in_comum_medio_integrado?: number | null
          in_comum_medio_medio?: number | null
          in_comum_medio_normal?: number | null
          in_comum_pre?: number | null
          in_comum_prof?: number | null
          in_desktop_aluno?: number | null
          in_educ_amb_conteudo?: number | null
          in_educ_amb_curricular?: number | null
          in_educ_amb_eixo?: number | null
          in_educ_amb_eventos?: number | null
          in_educ_amb_nenhuma?: number | null
          in_educ_amb_projetos?: number | null
          in_educ_ambiental?: number | null
          in_eja?: number | null
          in_equip_dvd?: number | null
          in_equip_lousa_digital?: number | null
          in_equip_multimidia?: number | null
          in_equip_som?: number | null
          in_equip_tv?: number | null
          in_esp_exclusiva_creche?: number | null
          in_esp_exclusiva_eja_fund?: number | null
          in_esp_exclusiva_eja_medio?: number | null
          in_esp_exclusiva_eja_prof?: number | null
          in_esp_exclusiva_fund_af?: number | null
          in_esp_exclusiva_fund_ai?: number | null
          in_esp_exclusiva_medio_fic?: number | null
          in_esp_exclusiva_medio_integr?: number | null
          in_esp_exclusiva_medio_medio?: number | null
          in_esp_exclusiva_medio_normal?: number | null
          in_esp_exclusiva_pre?: number | null
          in_esp_exclusiva_prof?: number | null
          in_espaco_atividade?: number | null
          in_espaco_equipamento?: number | null
          in_especial_exclusiva?: number | null
          in_exame_selecao?: number | null
          in_internet_aprendizagem?: number | null
          in_laboratorio_ciencias?: number | null
          in_laboratorio_informatica?: number | null
          in_material_esp_indigena?: number | null
          in_material_esp_nao_utiliza?: number | null
          in_material_esp_quilombola?: number | null
          in_material_ped_agricola?: number | null
          in_material_ped_artisticas?: number | null
          in_material_ped_bil_surdos?: number | null
          in_material_ped_campo?: number | null
          in_material_ped_cientifico?: number | null
          in_material_ped_desportiva?: number | null
          in_material_ped_difusao?: number | null
          in_material_ped_edu_esp?: number | null
          in_material_ped_etnico?: number | null
          in_material_ped_indigena?: number | null
          in_material_ped_infantil?: number | null
          in_material_ped_jogos?: number | null
          in_material_ped_multimidia?: number | null
          in_material_ped_musical?: number | null
          in_material_ped_nenhum?: number | null
          in_material_ped_profissional?: number | null
          in_material_ped_quilombola?: number | null
          in_mediacao_ead?: number | null
          in_mediacao_presencial?: number | null
          in_mediacao_semipresencial?: number | null
          in_orgao_ass_pais?: number | null
          in_orgao_ass_pais_mestres?: number | null
          in_orgao_conselho_escolar?: number | null
          in_orgao_gremio_estudantil?: number | null
          in_orgao_nenhum?: number | null
          in_orgao_outros?: number | null
          in_parque_infantil?: number | null
          in_patio_coberto?: number | null
          in_patio_descoberto?: number | null
          in_piscina?: number | null
          in_quadra_esportes?: number | null
          in_quadra_esportes_coberta?: number | null
          in_quadra_esportes_descoberta?: number | null
          in_redes_sociais?: number | null
          in_regular?: number | null
          in_reserva_nenhuma?: number | null
          in_reserva_outros?: number | null
          in_reserva_pcd?: number | null
          in_reserva_ppi?: number | null
          in_reserva_publica?: number | null
          in_reserva_renda?: number | null
          in_sala_atelie_artes?: number | null
          in_sala_atendimento_especial?: number | null
          in_sala_estudio_danca?: number | null
          in_sala_estudio_gravacao?: number | null
          in_sala_leitura?: number | null
          in_sala_multiuso?: number | null
          in_sala_musica_coral?: number | null
          in_tablet_aluno?: number | null
          in_terreirao?: number | null
          in_viveiro?: number | null
          no_entidade?: string | null
          no_municipio?: string | null
          nu_ano_censo?: number
          qt_comp_portatil_aluno?: number | null
          qt_desktop_aluno?: number | null
          qt_equip_dvd?: number | null
          qt_equip_lousa_digital?: number | null
          qt_equip_multimidia?: number | null
          qt_equip_som?: number | null
          qt_equip_tv?: number | null
          qt_salas_utiliza_climatizadas?: number | null
          qt_salas_utilizadas?: number | null
          qt_salas_utilizadas_acessiveis?: number | null
          qt_tablet_aluno?: number | null
          tp_aee?: number | null
          tp_categoria_escola_privada?: number | null
          tp_dependencia?: number | null
          tp_localizacao?: number | null
          tp_localizacao_diferenciada?: number | null
          tp_situacao_funcionamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "censo_co_municipio_fkey"
            columns: ["co_municipio"]
            isOneToOne: false
            referencedRelation: "dim_municipio"
            referencedColumns: ["cod_municipal"]
          },
          {
            foreignKeyName: "censo_co_municipio_fkey"
            columns: ["co_municipio"]
            isOneToOne: false
            referencedRelation: "v_escola_por_protheus"
            referencedColumns: ["cod_municipio"]
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
          {
            foreignKeyName: "dim_cep5_cod_municipal_fkey"
            columns: ["cod_municipal"]
            isOneToOne: false
            referencedRelation: "v_escola_por_protheus"
            referencedColumns: ["cod_municipio"]
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
          {
            foreignKeyName: "dim_distrito_cod_municipal_fkey"
            columns: ["cod_municipal"]
            isOneToOne: false
            referencedRelation: "v_escola_por_protheus"
            referencedColumns: ["cod_municipio"]
          },
        ]
      }
      dim_escola: {
        Row: {
          alunos_ef1: number | null
          alunos_ef2: number | null
          alunos_ei: number | null
          alunos_em: number | null
          alunos_total: number | null
          atualizado_em: string
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
          atualizado_em?: string
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
          atualizado_em?: string
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
            referencedColumns: ["cod_municipal"]
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
          regiao: string | null
          regiao_imediata: string
          regiao_intermediaria: string
          uf: string | null
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
          regiao?: string | null
          regiao_imediata: string
          regiao_intermediaria: string
          uf?: string | null
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
          regiao?: string | null
          regiao_imediata?: string
          regiao_intermediaria?: string
          uf?: string | null
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
          {
            foreignKeyName: "dim_subdistrito_cod_municipal_fkey"
            columns: ["cod_municipal"]
            isOneToOne: false
            referencedRelation: "v_escola_por_protheus"
            referencedColumns: ["cod_municipio"]
          },
        ]
      }
      escola_protheus: {
        Row: {
          adocao_inconsistente: boolean
          adota_brasil: boolean
          adota_did_apoio_brasil: boolean
          adota_literatura_brasil: boolean
          adota_sistema_brasil: boolean
          atualizado_em: string
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
          atualizado_em?: string
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
          atualizado_em?: string
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
      cit_ingest: { Args: { action: string; payload?: Json }; Returns: Json }
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
