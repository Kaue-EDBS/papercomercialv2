import { useState, useMemo } from 'react';
import logo from '@/assets/ebsa_logo.png';
import { EscolaData } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  censoData: EscolaData[];
  onSearch: (codigo: string, customRadiusKm?: number | null) => void;
  onCompare: (c1: string, c2: string) => void;
}

export default function PageCapa({ censoData, onSearch, onCompare }: Props) {
  const [codigo, setCodigo] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [comp1, setComp1] = useState('');
  const [comp2, setComp2] = useState('');
  const [comp1Focused, setComp1Focused] = useState(false);
  const [comp2Focused, setComp2Focused] = useState(false);

  const [reguaMode, setReguaMode] = useState<'padrao' | 'personalizado'>('padrao');
  const [reguaKm, setReguaKm] = useState('');

  const [filterUF, setFilterUF] = useState('');
  const [filterCidade, setFilterCidade] = useState('');
  const [filterBairro, setFilterBairro] = useState('');
  const [filterCEP, setFilterCEP] = useState('');
  const [filterEndereco, setFilterEndereco] = useState('');
  const [filterEscola, setFilterEscola] = useState('');
  const [filterLat, setFilterLat] = useState('');
  const [filterLng, setFilterLng] = useState('');

  const suggestions = useMemo(() => {
    if (codigo.length < 3) return [];
    return censoData
      .filter(e => String(e['Código Inep']).includes(codigo) || e.Escola.toLowerCase().includes(codigo.toLowerCase()))
      .slice(0, 8);
  }, [codigo, censoData]);

  const comp1Suggestions = useMemo(() => {
    if (comp1.length < 3 || !comp1Focused) return [];
    return censoData
      .filter(e => String(e['Código Inep']).includes(comp1) || e.Escola.toLowerCase().includes(comp1.toLowerCase()))
      .slice(0, 6);
  }, [comp1, comp1Focused, censoData]);

  const comp2Suggestions = useMemo(() => {
    if (comp2.length < 3 || !comp2Focused) return [];
    return censoData
      .filter(e => String(e['Código Inep']).includes(comp2) || e.Escola.toLowerCase().includes(comp2.toLowerCase()))
      .slice(0, 6);
  }, [comp2, comp2Focused, censoData]);

  const hasAnyFilter = filterUF || filterCidade || filterBairro || filterCEP || filterEndereco || filterEscola || filterLat || filterLng;

  const filterResults = useMemo(() => {
    if (!hasAnyFilter) return [];
    return censoData
      .filter(e => {
        if (filterUF && !e.UF.toLowerCase().includes(filterUF.toLowerCase())) return false;
        if (filterCidade && !e.Município.toLowerCase().includes(filterCidade.toLowerCase())) return false;
        if (filterBairro && !(e.Bairro || '').toLowerCase().includes(filterBairro.toLowerCase())) return false;
        if (filterCEP && !String(e.CEP || '').includes(filterCEP)) return false;
        if (filterEndereco && !(e.Endereço || '').toLowerCase().includes(filterEndereco.toLowerCase())) return false;
        if (filterEscola && !e.Escola.toLowerCase().includes(filterEscola.toLowerCase())) return false;
        if (filterLat && !String(e.Latitude || '').includes(filterLat)) return false;
        if (filterLng && !String(e.Longitude || '').includes(filterLng)) return false;
        return true;
      })
      .slice(0, 15);
  }, [filterUF, filterCidade, filterBairro, filterCEP, filterEndereco, filterEscola, filterLat, filterLng, censoData, hasAnyFilter]);

  const getCustomRadius = () => reguaMode === 'personalizado' && reguaKm ? parseFloat(reguaKm) : null;

  const filterInputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4 py-6">
      {/* Brand + Title Block — compact */}
      <div className="flex flex-col items-center gap-2">
        <img src={logo} alt="Editora do Brasil" className="h-14 sm:h-20 object-contain" />
        <div className="text-center">
          <h1 className="page-title text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--navy))' }}>
            Diagnóstico Territorial
          </h1>
          <p className="page-subtitle mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Análise comercial para prospecção e renovação escolar
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Inicie uma análise territorial executiva com base em concorrência, mercado e perfil socioeconômico.
          </p>
        </div>
      </div>

      {!showFilter && !showCompare && (
        <Card className="w-full max-w-md shadow-md border-border/60">
          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Código Inep */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--navy))' }}>
                Código Inep
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Digite o Código Inep..."
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && codigo && onSearch(codigo, getCustomRadius())}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                    {suggestions.map(s => (
                      <button
                        key={s['Código Inep']}
                        onClick={() => { setCodigo(String(s['Código Inep'])); onSearch(String(s['Código Inep']), getCustomRadius()); }}
                        className="w-full text-left px-3 sm:px-4 py-2 hover:bg-muted text-xs sm:text-sm border-b last:border-0"
                      >
                        <span className="font-semibold">{s['Código Inep']}</span>
                        <span className="text-muted-foreground ml-1 sm:ml-2">{s.Escola}</span>
                        <span className="text-muted-foreground ml-1 hidden sm:inline">— {s.Município}/{s.UF}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Digite o Código Inep da escola para iniciar a análise. <span className="opacity-60">Ex.: 35109733</span>
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Régua de Concorrência */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--navy))' }}>
                Régua de Concorrência
              </label>
              <div className="flex rounded-lg border border-input overflow-hidden">
                <button
                  onClick={() => setReguaMode('padrao')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    reguaMode === 'padrao'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  Padrão
                </button>
                <button
                  onClick={() => setReguaMode('personalizado')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-input ${
                    reguaMode === 'personalizado'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  Personalizado
                </button>
              </div>
              {reguaMode === 'personalizado' && (
                <div className="space-y-1">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Raio em km (ex.: 2.5)"
                    value={reguaKm}
                    onChange={e => setReguaKm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {reguaKm && parseFloat(reguaKm) <= 0 && (
                    <p className="text-xs text-destructive">Informe um valor positivo.</p>
                  )}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                {reguaMode === 'padrao'
                  ? '📐 Padrão: usa densidade escolar para calcular o raio automaticamente.'
                  : reguaKm && parseFloat(reguaKm) > 0
                    ? `📏 Personalizado: raio de ${reguaKm} km definido manualmente.`
                    : '📏 Personalizado: defina o raio desejado em quilômetros.'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* CTA Principal */}
            <button
              onClick={() => codigo && onSearch(codigo, getCustomRadius())}
              className="w-full py-3.5 rounded-xl font-bold text-base text-primary-foreground bg-primary hover:opacity-90 transition shadow-sm"
            >
              Gerar Diagnóstico
            </button>

            {/* Ações secundárias */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilter(true)}
                className="flex-1 py-2 rounded-lg border border-border text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted transition"
              >
                Filtro Avançado
              </button>
              <button
                onClick={() => setShowCompare(true)}
                className="flex-1 py-2 rounded-lg border border-border text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted transition"
              >
                Comparativo Escolar
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {showFilter && (
        <div className="w-full max-w-lg bg-card rounded-xl border p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--navy))' }}>Filtro Avançado</h3>
            <button onClick={() => setShowFilter(false)} className="text-muted-foreground text-sm">✕ Fechar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">UF</label>
              <input type="text" placeholder="Ex: SP" value={filterUF} onChange={e => setFilterUF(e.target.value)} className={filterInputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
              <input type="text" placeholder="Ex: São Paulo" value={filterCidade} onChange={e => setFilterCidade(e.target.value)} className={filterInputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bairro</label>
              <input type="text" placeholder="Ex: Centro" value={filterBairro} onChange={e => setFilterBairro(e.target.value)} className={filterInputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CEP</label>
              <input type="text" placeholder="Ex: 01000" value={filterCEP} onChange={e => setFilterCEP(e.target.value)} className={filterInputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Endereço</label>
              <input type="text" placeholder="Ex: Rua Augusta" value={filterEndereco} onChange={e => setFilterEndereco(e.target.value)} className={filterInputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome da Escola</label>
              <input type="text" placeholder="Ex: Colégio..." value={filterEscola} onChange={e => setFilterEscola(e.target.value)} className={filterInputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Latitude</label>
              <input type="text" placeholder="Ex: -23.5" value={filterLat} onChange={e => setFilterLat(e.target.value)} className={filterInputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Longitude</label>
              <input type="text" placeholder="Ex: -46.6" value={filterLng} onChange={e => setFilterLng(e.target.value)} className={filterInputClass} />
            </div>
          </div>
          {filterResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-1 border-t pt-3">
              <p className="text-xs text-muted-foreground mb-1">{filterResults.length} resultado(s) encontrado(s)</p>
              {filterResults.map(s => (
                <button
                  key={s['Código Inep']}
                  onClick={() => { setShowFilter(false); onSearch(String(s['Código Inep']), getCustomRadius()); }}
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg text-xs sm:text-sm border-b"
                >
                  <span className="font-semibold">{s['Código Inep']}</span>
                  <span className="text-muted-foreground ml-1 sm:ml-2">{s.Escola}</span>
                  <span className="text-muted-foreground ml-1 hidden sm:inline">— {s.Município}/{s.UF}</span>
                </button>
              ))}
            </div>
          )}
          {hasAnyFilter && filterResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhum resultado encontrado para os filtros aplicados.</p>
          )}
        </div>
      )}

      {showCompare && (
        <div className="w-full max-w-lg bg-card rounded-xl border p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--navy))' }}>Comparativo Escolar</h3>
            <button onClick={() => setShowCompare(false)} className="text-muted-foreground text-sm">✕ Fechar</button>
          </div>
          <div className="relative">
            <input type="text" placeholder="Código Inep — Escola 1" value={comp1}
              onChange={e => setComp1(e.target.value)}
              onFocus={() => setComp1Focused(true)}
              onBlur={() => setTimeout(() => setComp1Focused(false), 200)}
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {comp1Suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {comp1Suggestions.map(s => (
                  <button key={s['Código Inep']}
                    onClick={() => { setComp1(String(s['Código Inep'])); setComp1Focused(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-xs sm:text-sm border-b last:border-0">
                    <span className="font-semibold">{s['Código Inep']}</span>
                    <span className="text-muted-foreground ml-2">{s.Escola}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <input type="text" placeholder="Código Inep — Escola 2" value={comp2}
              onChange={e => setComp2(e.target.value)}
              onFocus={() => setComp2Focused(true)}
              onBlur={() => setTimeout(() => setComp2Focused(false), 200)}
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {comp2Suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {comp2Suggestions.map(s => (
                  <button key={s['Código Inep']}
                    onClick={() => { setComp2(String(s['Código Inep'])); setComp2Focused(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-xs sm:text-sm border-b last:border-0">
                    <span className="font-semibold">{s['Código Inep']}</span>
                    <span className="text-muted-foreground ml-2">{s.Escola}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => comp1 && comp2 && onCompare(comp1, comp2)}
            className="w-full py-2.5 rounded-xl font-semibold text-primary-foreground bg-primary hover:opacity-90 transition">
            Gerar Comparativo
          </button>
        </div>
      )}
    </div>
  );
}
