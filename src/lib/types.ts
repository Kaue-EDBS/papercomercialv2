export interface EscolaData {
  Ano: string;
  UF: string;
  Município: string;
  'Código Município': string;
  Escola: string;
  'Código Inep': string;
  Latitude: string;
  Longitude: string;
  'Tipo de Adoção': string;
  Mensalidade: string;
  'Perfil Socioeconômico': string;
  Endereço: string;
  Número: string;
  Complemento: string;
  Bairro: string;
  CEP: string;
  qt_mat_educacao_infantil: string;
  qt_mat_ensino_fundamental_anos_iniciais: string;
  qt_mat_ensino_fundamental_anos_finais: string;
  qt_mat_ensino_medio: string;
  'Alunado Total': string;
  'Adota Brasil': string;
}

export interface DemograficaData {
  'Código IBGE': string;
  'Municípios': string;
  'Estado': string;
  'Microrregião': string;
  'Mesorregião': string;
  'Região Geográfica': string;
  'Área KM²': string;
  'População': string;
  'Densidade Demográfica': string;
  'Domicílios por Faixa de Renda': string;
  'Domicílios': string;
  'PIB Total (R$ mil)': string;
  'PIB per Capita Total': string;
  'IDH - Índice de Desenv. Humano': string;
  'Renda Média': string;
  'IDH - Dimensão Educação Classificação': string;
  'IDH - Dimensão Renda Classificação': string;
  'População por Faixa Etária (2025) - 0 a 4 anos': string;
  'População por Faixa Etária (2025) - 5 a 9 anos': string;
  'População por Faixa Etária (2025) - 10 a 14 anos': string;
  'População por Faixa Etária (2025) - 15 a 19 anos': string;
  'População por Faixa Etária (2024) - 0 a 4 anos': string;
  'População por Faixa Etária (2024) - 5 a 9 anos': string;
  'População por Faixa Etária (2024) - 10 a 14 anos': string;
  'População por Faixa Etária (2024) - 15 a 19 anos': string;
  'Faixa Pop. Trabalha': string;
  [key: string]: string;
}

export interface AnalysisResult {
  escola: EscolaData;
  demografica: DemograficaData | null;
  densidadeEscolar: number;
  raioOperacional: number;
  raioCustom: number | null;
  concorrentes: ConcorrenteInfo[];
  escolasMunicipio: EscolaData[];
  marketShare: MarketShareData;
}

export interface ConcorrenteInfo {
  escola: EscolaData;
  distancia: number | null;
  proximidadeCEP: boolean;
  segmentosComum: string[];
}

export interface MarketShareData {
  geral: number;
  ei: number;
  efi: number;
  efii: number;
  em: number;
}

export type PresentationType = 'prospeccao' | 'renovacao';
export type AppPage = 'capa' | 'tipo' | 'abertura' | 'resumo' | 'panorama' | 'concorrencia' | 'marketshare' | 'mensalidade' | 'socioeconomico' | 'insights' | 'encerramento';
export type ComparativePage = 'c1';
