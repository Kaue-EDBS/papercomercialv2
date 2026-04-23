import { useEffect, useState } from 'react';

export type LatLongMap = Record<string, { lat: number; lng: number }>;

let cache: LatLongMap | null = null;
let inflight: Promise<LatLongMap> | null = null;

function load(): Promise<LatLongMap> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch('/data/latlong_protheus.json')
    .then(r => r.ok ? r.json() : {})
    .then((d: LatLongMap) => { cache = d; return d; })
    .catch(() => ({} as LatLongMap));
  return inflight;
}

/**
 * Lookup auxiliar de lat/long por Código Protheus.
 * Use APENAS como fallback quando o censo/setorização não tiverem coordenadas.
 */
export function useLatLongProtheus() {
  const [data, setData] = useState<LatLongMap>(cache ?? {});
  useEffect(() => { load().then(setData); }, []);
  const lookup = (protheus: string | number | null | undefined) => {
    if (!protheus) return null;
    const key = String(protheus).trim().toUpperCase();
    return data[key] ?? null;
  };
  return { data, lookup };
}
