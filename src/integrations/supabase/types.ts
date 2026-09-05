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
      censo_escolas_privadas_ativas: {
        Row: {
          co_entidade: number
          co_municipio: number | null
          co_rede: number
          imported_at: string
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
          tp_situacao_funcionamento: number
        }
        Insert: {
          co_entidade: number
          co_municipio?: number | null
          co_rede: number
          imported_at?: string
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
          tp_situacao_funcionamento: number
        }
        Update: {
          co_entidade?: number
          co_municipio?: number | null
          co_rede?: number
          imported_at?: string
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
          tp_situacao_funcionamento?: number
        }
        Relationships: []
      }
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
          imported_at: string
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
          imported_at?: string
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
          imported_at?: string
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
      app_role: ["admin", "consultor"],
    },
  },
} as const
