export type LatLongMap = Record<string, { lat: number; lng: number }>;

/** Fonte de dados zerada — coordenadas por Código Protheus virão do banco. */
export function useLatLongProtheus() {
  const data: LatLongMap = {};
  const lookup = (_protheus: string | number | null | undefined) => null;
  return { data, lookup };
}
