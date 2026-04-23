import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EscolaData, ConcorrenteInfo } from '@/lib/types';
import { num, formatNumber, getSegmentos } from '@/lib/analysis';

interface Props {
  escola: EscolaData;
  concorrentes: ConcorrenteInfo[];
  highlightedInep?: string | null;
  onMarkerClick?: (inep: string) => void;
  /** Quando incrementa, o mapa recentra na escola em análise (ou no primeiro concorrente). */
  centerSignal?: number;
}

export default function ConcorrenciaMap({ escola, concorrentes, highlightedInep, onMarkerClick, centerSignal }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const escolaLat = parseFloat(String(escola.Latitude));
  const escolaLng = parseFloat(String(escola.Longitude));
  const escolaHasCoords = !isNaN(escolaLat) && !isNaN(escolaLng);

  const plotable = concorrentes
    .filter(c => {
      const cLat = parseFloat(String(c.escola.Latitude));
      const cLng = parseFloat(String(c.escola.Longitude));
      return !isNaN(cLat) && !isNaN(cLng);
    })
    .sort((a, b) => num(b.escola['Alunado Total']) - num(a.escola['Alunado Total']));

  const hasAnything = escolaHasCoords || plotable.length > 0;

  useEffect(() => {
    if (!mapRef.current || !hasAnything) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markersRef.current.clear();

    // Determine center: use school if available, otherwise first concorrente
    let centerLat: number, centerLng: number;
    if (escolaHasCoords) {
      centerLat = escolaLat;
      centerLng = escolaLng;
    } else {
      centerLat = parseFloat(String(plotable[0].escola.Latitude));
      centerLng = parseFloat(String(plotable[0].escola.Longitude));
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView([centerLat, centerLng], 13);
    mapInstanceRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 18,
    }).addTo(map);

    // School marker only if coords available
    if (escolaHasCoords) {
      const schoolIcon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(174,62%,35%);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker([escolaLat, escolaLng], { icon: schoolIcon })
        .bindPopup(`<div style="font-family:Inter,sans-serif;font-size:12px;"><strong>${escola.Escola}</strong><br/>Matrículas: ${formatNumber(num(escola['Alunado Total']))}<br/>Segmentos: ${getSegmentos(escola).join(', ')}</div>`)
        .addTo(map);
    }

    plotable.forEach((c, i) => {
      const cLat = parseFloat(String(c.escola.Latitude));
      const cLng = parseFloat(String(c.escola.Longitude));
      const isTop5 = i < 5;
      const size = isTop5 ? 12 : 8;
      const inep = String(c.escola['Código Inep']);

      const icon = L.divIcon({
        className: '',
        html: `<div id="marker-${inep}" style="width:${size}px;height:${size}px;border-radius:50%;background:hsl(220,70%,18%);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);opacity:${isTop5 ? 1 : 0.6};transition:all 0.2s;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const distLabel = c.distancia !== null ? `${c.distancia.toFixed(1).replace('.', ',')} km` : 'Estimado por CEP';

      const marker = L.marker([cLat, cLng], { icon })
        .bindPopup(`<div style="font-family:Inter,sans-serif;font-size:12px;"><strong>${c.escola.Escola}</strong><br/>Matrículas: ${formatNumber(num(c.escola['Alunado Total']))}<br/>Segmentos: ${getSegmentos(c.escola).join(', ')}<br/>Distância: ${distLabel}</div>`)
        .addTo(map);

      marker.on('click', () => {
        onMarkerClick?.(inep);
      });

      markersRef.current.set(inep, marker);
    });

    // Fit bounds if multiple points
    const allPoints: L.LatLngExpression[] = [];
    if (escolaHasCoords) allPoints.push([escolaLat, escolaLng]);
    plotable.forEach(c => allPoints.push([parseFloat(String(c.escola.Latitude)), parseFloat(String(c.escola.Longitude))]));
    if (allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] });
    }

    return () => {
      try {
        // Para qualquer animação de zoom/pan em andamento antes de destruir
        // (evita erro `_leaflet_pos` no _onZoomTransitionEnd)
        (map as any)._stop?.();
        map.stop();
      } catch {
        /* noop */
      }
      try {
        map.remove();
      } catch {
        /* noop */
      }
      mapInstanceRef.current = null;
      markersRef.current.clear();
    };
    // Reagimos apenas a mudanças reais de dados — não à identidade de `plotable`,
    // que é recriada a cada render. Usamos uma chave estável dos concorrentes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    escolaHasCoords,
    escolaLat,
    escolaLng,
    hasAnything,
    plotable.length,
    plotable.map(c => String(c.escola['Código Inep'])).join(','),
  ]);

  // Highlight effect
  useEffect(() => {
    markersRef.current.forEach((marker, inep) => {
      const el = marker.getElement();
      if (!el) return;
      const dot = el.querySelector('div') as HTMLElement;
      if (!dot) return;
      if (inep === highlightedInep) {
        dot.style.background = 'hsl(174,62%,35%)';
        dot.style.width = '16px';
        dot.style.height = '16px';
        dot.style.border = '3px solid white';
        dot.style.opacity = '1';
        dot.style.boxShadow = '0 0 8px hsl(174,62%,35%)';
        marker.openPopup();
      } else {
        dot.style.background = 'hsl(220,70%,18%)';
        dot.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
      }
    });
  }, [highlightedInep]);

  // Recentraliza no sinal externo ("Centralizar")
  useEffect(() => {
    if (centerSignal === undefined) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    let lat: number | null = null;
    let lng: number | null = null;
    if (escolaHasCoords) {
      lat = escolaLat;
      lng = escolaLng;
    } else if (plotable.length > 0) {
      lat = parseFloat(String(plotable[0].escola.Latitude));
      lng = parseFloat(String(plotable[0].escola.Longitude));
    }
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;
    try {
      map.setView([lat, lng], 15, { animate: true });
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerSignal]);

  if (!hasAnything) {
    return null;
  }

  return (
    <div>
      <div ref={mapRef} style={{ height: 320, width: '100%' }} />
      {!escolaHasCoords && (
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground italic border-t" style={{ background: 'hsl(var(--teal-light))' }}>
          A escola em análise não possui coordenadas disponíveis. O mapa exibe apenas concorrentes com localização válida.
        </div>
      )}
    </div>
  );
}
