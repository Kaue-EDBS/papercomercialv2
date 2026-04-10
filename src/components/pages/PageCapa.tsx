import { useState, useMemo } from 'react';
import logo from '@/assets/ebsa_logo.png';
import { EscolaData } from '@/lib/types';

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

  // Régua de Concorrência
  const [reguaMode, setReguaMode] = useState<'padrao' | 'personalizado'>('padrao');
  const [reguaKm, setReguaKm] = useState('');

  // Advanced filter individual fields
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

  const filterInputClass = "w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 sm:gap-8 px-4">
      <img src={logo} alt="Editora do Brasil" className="h-16 sm:h-24 object-contain" />
      <div className="text-center">
        <h1 className="page-title text-2xl sm:text-3xl">Diagnóstico Territorial</h1>
        <p className="page-subtitle mt-1 sm:mt-2 text-xs sm:text-sm">Análise comercial para prospecção e renovação escolar</p>
      </div>

      {!showFilter && !showCompare && (
        <div className="w-full max-w-md space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Digite o Código Inep..."
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && codigo && onSearch(codigo)}
              className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-center text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                {suggestions.map(s => (
                  <button
                    key={s['Código Inep']}
                    onClick={() => { setCodigo(String(s['Código Inep'])); onSearch(String(s['Código Inep'])); }}
                    className="w-full text-left px-3 sm:px-4 py-2 hover:bg-teal-light text-xs sm:text-sm border-b last:border-0"
                  >
                    <span className="font-semibold">{s['Código Inep']}</span>
                    <span className="text-muted-foreground ml-1 sm:ml-2">{s.Escola}</span>
                    <span className="text-muted-foreground ml-1 hidden sm:inline">— {s.Município}/{s.UF}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => codigo && onSearch(codigo)}
            className="w-full py-3 rounded-xl font-semibold text-primary-foreground bg-primary hover:opacity-90 transition"
          >
            Gerar Análise
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowFilter(true)} className="flex-1 py-2.5 rounded-xl border font-medium text-xs sm:text-sm hover:bg-teal-light transition" style={{ color: 'hsl(var(--teal-dark))' }}>
              Filtro Avançado
            </button>
            <button onClick={() => setShowCompare(true)} className="flex-1 py-2.5 rounded-xl border font-medium text-xs sm:text-sm hover:bg-teal-light transition" style={{ color: 'hsl(var(--navy))' }}>
              Comparativo Escolar
            </button>
          </div>
        </div>
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
                  onClick={() => { setShowFilter(false); onSearch(String(s['Código Inep'])); }}
                  className="w-full text-left px-3 py-2 hover:bg-teal-light rounded-lg text-xs sm:text-sm border-b"
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
              className="w-full px-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            {comp1Suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {comp1Suggestions.map(s => (
                  <button key={s['Código Inep']}
                    onClick={() => { setComp1(String(s['Código Inep'])); setComp1Focused(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-teal-light text-xs sm:text-sm border-b last:border-0">
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
              className="w-full px-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            {comp2Suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {comp2Suggestions.map(s => (
                  <button key={s['Código Inep']}
                    onClick={() => { setComp2(String(s['Código Inep'])); setComp2Focused(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-teal-light text-xs sm:text-sm border-b last:border-0">
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
