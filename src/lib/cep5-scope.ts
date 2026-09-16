export const BOA_ESPERANCA_DO_NORTE_COD_MUNICIPAL = '5101837';

export type Cep5Scope = {
  mode: 'CEP5' | 'MUNICIPIO_INTEIRO';
  label: string;
};

export function getCep5Scope(codMunicipal: string): Cep5Scope {
  if (codMunicipal === BOA_ESPERANCA_DO_NORTE_COD_MUNICIPAL) {
    return {
      mode: 'MUNICIPIO_INTEIRO',
      label: 'Município inteiro — sem recorte CEP5 na fonte aprovada',
    };
  }

  return {
    mode: 'CEP5',
    label: 'Recorte CEP5',
  };
}
