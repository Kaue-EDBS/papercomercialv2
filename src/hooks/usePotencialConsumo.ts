export interface PotencialMunicipio {
  municipio: string;
  domicilios_total: number;
  domicilios_classe: Record<string, number>;
  renda_classe: Record<string, number>;
  potencial: {
    matriculas_total: number;
    cursos_regulares: number;
    cursos_superiores: number;
    outros_cursos: number;
    livros_material_total: number;
    artigos_escolares: number;
    livros_didaticos: number;
    outros_livros: number;
  };
}

/** Fonte de dados zerada — potencial de consumo virá do banco. */
export function prefetchPotencialConsumo(): void {
  /* no-op enquanto não há fonte de dados */
}

export function findPotencialByIBGE(
  _data: Record<string, PotencialMunicipio> | null,
  _codMunicipio: string,
): PotencialMunicipio | null {
  return null;
}

export function usePotencialConsumo() {
  const data: Record<string, PotencialMunicipio> | null = null;
  return { data, loading: false };
}
