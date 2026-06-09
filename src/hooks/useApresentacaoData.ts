/**
 * Loader otimizado para a rota /apresentacao/:inep.
 * Em vez de baixar o censo inteiro (26MB), baixa apenas:
 *  1) o índice INEP→UF (~675KB);
 *  2) o chunk da UF correspondente (ex.: SP ≈ 6.6MB, RJ ≈ 2.8MB);
 *  3) a base demográfica (compartilhada, cacheada).
 *
 * Reduz o payload inicial em ~50–95% dependendo do estado.
 */
import { useEffect, useState } from 'react';
import { EscolaData, DemograficaData } from '@/lib/types';

let cachedIndex: Record<string, string> | null = null;
const cachedUf: Record<string, EscolaData[]> = {};
let cachedDemo: DemograficaData[] | null = null;

async function loadIndex(): Promise<Record<string, string>> {
  if (cachedIndex) return cachedIndex;
  const r = await fetch('/data/censo_inep_index.json');
  cachedIndex = await r.json();
  return cachedIndex!;
}

async function loadUf(uf: string): Promise<EscolaData[]> {
  if (cachedUf[uf]) return cachedUf[uf];
  const r = await fetch(`/data/censo_by_uf/${uf}.json`);
  cachedUf[uf] = await r.json();
  return cachedUf[uf];
}

async function loadDemo(): Promise<DemograficaData[]> {
  if (cachedDemo) return cachedDemo;
  const r = await fetch('/data/base_demografica.json');
  cachedDemo = await r.json();
  return cachedDemo!;
}

export type ApresentacaoDataState =
  | { status: 'loading'; censo: EscolaData[]; demo: DemograficaData[] }
  | { status: 'not-found'; censo: EscolaData[]; demo: DemograficaData[] }
  | { status: 'ready'; censo: EscolaData[]; demo: DemograficaData[] };

export function useApresentacaoData(inep: string) {
  const [state, setState] = useState<ApresentacaoDataState>({ status: 'loading', censo: [], demo: [] });

  useEffect(() => {
    if (!inep) return;
    let cancelled = false;
    (async () => {
      try {
        const index = await loadIndex();
        const uf = index[String(inep).trim()];
        if (!uf) {
          // INEP não encontrado no índice — entrega censo vazio para o fluxo já existente exibir "não encontrada".
          const demo = await loadDemo();
          if (!cancelled) setState({ status: 'not-found', censo: [], demo });
          return;
        }
        const [censo, demo] = await Promise.all([loadUf(uf), loadDemo()]);
        if (!cancelled) setState({ status: 'ready', censo, demo });
      } catch (e) {
        console.error('[useApresentacaoData] falha ao carregar dados', e);
        if (!cancelled) setState({ status: 'not-found', censo: [], demo: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [inep]);

  return state;
}