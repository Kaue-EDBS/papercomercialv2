import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCarteiraManifest } from '@/hooks/useCarteiraManifest';
import { KeyRound, RefreshCcw, Search, BarChart3, Users, AlertTriangle, Trash2, Pencil, Save, X, Mail, UserPlus, Sparkles } from 'lucide-react';

interface ProfileRow {
  id: string;
  cod_protheus: string;
  nome: string;
  gestor: string | null;
  arquivo_carteira: string | null;
  must_change_password: boolean;
  cargo: string;
  created_at: string;
  updated_at: string;
}

interface WeeklyUsage {
  week_start: string;
  total_events: number;
  unique_users: number;
  errors: number;
}

export default function PageAdmin() {
  const { consultores, loading: manifestLoading } = useCarteiraManifest();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [usage, setUsage] = useState<WeeklyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ cod_protheus: string; nome: string; gestor: string; cargo: string }>({ cod_protheus: '', nome: '', gestor: '', cargo: 'consultor' });
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [emailDraft, setEmailDraft] = useState<Record<string, string>>({});
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState({ cod_protheus: '', nome: '', gestor: '', cargo: 'consultor', email: '' });
  const [creating, setCreating] = useState(false);

  const showToast = (kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 6000);
  };

  const load = async () => {
    setLoading(true);
    const [pRes, evRes] = await Promise.all([
      supabase.from('profiles').select('*').order('cod_protheus'),
      supabase
        .from('telemetry_events')
        .select('user_id,type,created_at')
        .gte('created_at', new Date(Date.now() - 1000 * 60 * 60 * 24 * 56).toISOString()),
    ]);
    if (pRes.data) setProfiles(pRes.data as unknown as ProfileRow[]);

    // Busca e-mails reais do Auth (via edge function admin)
    // target_user_id dummy mantém compatibilidade com versão antiga da função
    try {
      const { data: emailsRes } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'list_emails', target_user_id: '00000000-0000-0000-0000-000000000000' },
      });
      if (emailsRes?.emails) setEmails(emailsRes.emails as Record<string, string>);
    } catch { /* opcional */ }

    // agrega por semana (segunda-feira)
    const buckets = new Map<string, { events: number; users: Set<string>; errors: number }>();
    (evRes.data || []).forEach((row) => {
      const d = new Date(row.created_at as string);
      const day = d.getUTCDay(); // 0=dom
      const diff = (day === 0 ? 6 : day - 1);
      const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
      const key = monday.toISOString().slice(0, 10);
      const b = buckets.get(key) || { events: 0, users: new Set<string>(), errors: 0 };
      b.events += 1;
      if (row.user_id) b.users.add(row.user_id as string);
      if (row.type === 'error') b.errors += 1;
      buckets.set(key, b);
    });
    const weeks: WeeklyUsage[] = Array.from(buckets.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 8)
      .map(([week_start, b]) => ({ week_start, total_events: b.events, unique_users: b.users.size, errors: b.errors }));
    setUsage(weeks);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const adminCallGeneric = async (payload: Record<string, unknown>, okMsg: string, targetId: string) => {
    setBusyId(targetId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      showToast('ok', okMsg);
      await load();
      return true;
    } catch (e) {
      showToast('err', String((e as Error)?.message ?? e));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const saveEmail = async (id: string) => {
    const v = (emailDraft[id] ?? '').trim();
    if (!v) { showToast('err', 'Informe um e-mail.'); return; }
    const ok = await adminCallGeneric({ action: 'update_email', target_user_id: id, new_email: v }, 'E-mail atualizado.', id);
    if (ok) setEmailDraft(d => { const { [id]: _, ...rest } = d; return rest; });
  };

  /** Pré-cria conta para uma linha do manifest (ou novo cadastro avulso). */
  const provision = async (input: { cod_protheus: string; nome: string; gestor?: string | null; cargo?: string; email?: string }) => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'create_user',
          cod_protheus: input.cod_protheus,
          nome: input.nome,
          gestor: input.gestor ?? null,
          cargo: input.cargo ?? 'consultor',
          email: input.email ?? '',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      try { if (data?.temp_password) await navigator.clipboard.writeText(data.temp_password); } catch { /* ignore */ }
      showToast('ok', `Cadastrado. Senha temporária: ${data?.temp_password} (copiada). Conta aguardará 1º acesso.`);
      await load();
      return true;
    } catch (e) {
      showToast('err', String((e as Error)?.message ?? e));
      return false;
    } finally {
      setCreating(false);
    }
  };

  /** Une perfis (com conta criada) + consultores do manifest (sem conta ainda). */
  const rows = useMemo(() => {
    const normalize = (s: string) => s.toUpperCase().replace(/^0+/, '');
    const byCod = new Map<string, ProfileRow>();
    profiles.forEach(p => {
      byCod.set(p.cod_protheus.toUpperCase(), p);
      byCod.set(normalize(p.cod_protheus), p);
    });
    const all: Array<{
      cod_protheus: string;
      nome: string;
      gestor: string | null;
      cargo: string;
      profile: ProfileRow | null;
    }> = [];
    profiles.forEach(p => {
      all.push({ cod_protheus: p.cod_protheus, nome: p.nome, gestor: p.gestor, cargo: p.cargo || 'consultor', profile: p });
    });
    consultores.forEach(c => {
      const cod = String(c.codConsultor).toUpperCase();
      if (!byCod.has(cod) && !byCod.has(normalize(cod))) {
        all.push({ cod_protheus: cod, nome: c.consultor, gestor: c.gerente ?? null, cargo: 'consultor', profile: null });
      }
    });
    const q = query.trim().toLowerCase();
    return all
      .filter(r => !q || r.cod_protheus.toLowerCase().includes(q) || r.nome.toLowerCase().includes(q) || (r.gestor || '').toLowerCase().includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [profiles, consultores, query]);

  const startEdit = (p: ProfileRow) => {
    setEditingId(p.id);
    setEditDraft({
      cod_protheus: p.cod_protheus,
      nome: p.nome,
      gestor: p.gestor ?? '',
      cargo: p.cargo || 'consultor',
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id: string) => {
    setBusyId(id);
    try {
      const payload = {
        cod_protheus: editDraft.cod_protheus.trim().toUpperCase(),
        nome: editDraft.nome.trim(),
        gestor: editDraft.gestor.trim() || null,
        cargo: editDraft.cargo.trim() || 'consultor',
      };
      if (!payload.cod_protheus || !payload.nome) {
        showToast('err', 'Código e nome são obrigatórios.');
        return;
      }
      const { error } = await supabase.from('profiles').update(payload).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      showToast('ok', 'Cadastro atualizado.');
      await load();
    } catch (e) {
      showToast('err', String((e as Error)?.message ?? e));
    } finally {
      setBusyId(null);
    }
  };

  const adminCall = async (action: 'reset_password' | 'delete_user', target_user_id: string) => {
    setBusyId(target_user_id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action, target_user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (action === 'reset_password' && data?.temp_password) {
        try { await navigator.clipboard.writeText(data.temp_password); } catch { /* ignore */ }
        showToast('ok', `Senha temporária: ${data.temp_password} (copiada). Peça para o consultor entrar e trocar.`);
      } else if (action === 'delete_user') {
        showToast('ok', 'Consultor removido.');
      }
      await load();
    } catch (e) {
      showToast('err', String((e as Error)?.message ?? e));
    } finally {
      setBusyId(null);
    }
  };

  const total = rows.length;
  const ativos = profiles.length;
  const semConta = total - ativos;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl">Painel do Administrador</h1>
          <p className="page-subtitle text-sm">Consultores, senhas e uso da plataforma.</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-accent">
          <RefreshCcw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {toast && (
        <div role="status" className="p-3 rounded-lg border text-sm" style={{
          background: toast.kind === 'ok' ? 'hsl(142,71%,95%)' : 'hsl(0,84%,95%)',
          color: toast.kind === 'ok' ? 'hsl(142,71%,25%)' : 'hsl(0,84%,40%)',
          borderColor: toast.kind === 'ok' ? 'hsl(142,71%,80%)' : 'hsl(0,84%,85%)',
        }}>{toast.msg}</div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card icon={<Users className="w-4 h-4" />} label="Total consultores" value={total} />
        <Card icon={<KeyRound className="w-4 h-4" />} label="Com conta criada" value={ativos} />
        <Card icon={<AlertTriangle className="w-4 h-4" />} label="Sem 1º acesso" value={semConta} />
        <Card icon={<BarChart3 className="w-4 h-4" />} label="Eventos 7d" value={usage[0]?.total_events ?? 0} />
      </div>

      {/* Uso semanal */}
      <section>
        <h2 className="font-bold mb-2" style={{ color: 'hsl(var(--navy))' }}>Uso semanal (últimas 8 semanas)</h2>
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 px-3">Semana (início seg.)</th>
                <th className="py-2 px-3 text-right">Eventos</th>
                <th className="py-2 px-3 text-right">Usuários únicos</th>
                <th className="py-2 px-3 text-right">Erros</th>
              </tr>
            </thead>
            <tbody>
              {usage.length === 0 && !loading && (
                <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Sem registros ainda.</td></tr>
              )}
              {usage.map(w => (
                <tr key={w.week_start} className="border-b last:border-0">
                  <td className="py-2 px-3 font-medium">{w.week_start}</td>
                  <td className="py-2 px-3 text-right">{w.total_events.toLocaleString('pt-BR')}</td>
                  <td className="py-2 px-3 text-right">{w.unique_users}</td>
                  <td className="py-2 px-3 text-right" style={{ color: w.errors > 0 ? 'hsl(0,84%,40%)' : undefined }}>{w.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Consultores */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <h2 className="font-bold" style={{ color: 'hsl(var(--navy))' }}>Cadastros</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setNewDraft({ cod_protheus: '', nome: '', gestor: '', cargo: 'consultor', email: '' }); setShowNew(true); }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
              style={{ background: 'hsl(var(--teal))' }}
            >
              <UserPlus className="w-4 h-4" /> Novo cadastro
            </button>
            <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar por código, nome ou gestor"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border bg-card text-sm w-72 max-w-full"
            />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 px-3">Código</th>
                <th className="py-2 px-3">Nome</th>
                <th className="py-2 px-3">Gestor</th>
                <th className="py-2 px-3">E-mail</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Cargo</th>
                <th className="py-2 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(loading || manifestLoading) && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhum cadastro encontrado.</td></tr>
              )}
              {rows.map(r => {
                const emailAtual = r.profile ? (emails[r.profile.id] ?? '') : '';
                const temEmailReal = !!emailAtual && !emailAtual.endsWith('@ebsa.local');
                const status = !r.profile
                  ? { label: 'Sem 1º acesso', color: 'hsl(38,92%,40%)', bg: 'hsl(38,92%,93%)' }
                  : !temEmailReal
                    ? { label: 'Sem e-mail', color: 'hsl(0,84%,40%)', bg: 'hsl(0,84%,93%)' }
                    : { label: 'E-mail ok', color: 'hsl(142,71%,30%)', bg: 'hsl(142,71%,93%)' };
                const busy = r.profile && busyId === r.profile.id;
                const isEditing = r.profile && editingId === r.profile.id;
                return (
                  <tr key={r.cod_protheus} className="border-b last:border-0">
                    <td className="py-2 px-3 font-mono">
                      {isEditing ? (
                        <input value={editDraft.cod_protheus} onChange={e => setEditDraft(d => ({ ...d, cod_protheus: e.target.value }))} className="w-24 px-2 py-1 rounded border bg-background text-xs font-mono" />
                      ) : r.cod_protheus}
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <input value={editDraft.nome} onChange={e => setEditDraft(d => ({ ...d, nome: e.target.value }))} className="w-full px-2 py-1 rounded border bg-background text-xs" />
                      ) : r.nome}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {isEditing ? (
                        <input value={editDraft.gestor} onChange={e => setEditDraft(d => ({ ...d, gestor: e.target.value }))} className="w-full px-2 py-1 rounded border bg-background text-xs" />
                      ) : (r.gestor || '—')}
                    </td>
                    {/* E-mail (real do Auth) */}
                    <td className="py-2 px-3">
                      {r.profile ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="email"
                            value={emailDraft[r.profile.id] ?? emails[r.profile.id] ?? ''}
                            onChange={e => setEmailDraft(d => ({ ...d, [r.profile!.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void saveEmail(r.profile!.id); } }}
                            placeholder="email@dominio.com"
                            className="w-48 px-2 py-1 rounded border bg-background text-xs"
                          />
                          <button
                            disabled={!!busy || (emailDraft[r.profile.id] ?? emails[r.profile.id] ?? '') === (emails[r.profile.id] ?? '')}
                            onClick={() => void saveEmail(r.profile!.id)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded border hover:bg-accent disabled:opacity-30"
                            title="Salvar e-mail"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <select value={editDraft.cargo} onChange={e => setEditDraft(d => ({ ...d, cargo: e.target.value }))} className="px-2 py-1 rounded border bg-background text-xs">
                          <option value="consultor">Consultor</option>
                          <option value="gerente">Gerente</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-xs capitalize">{r.cargo}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {r.profile ? (
                        <div className="inline-flex gap-2">
                          {isEditing ? (
                            <>
                              <button disabled={!!busy} onClick={() => void saveEdit(r.profile!.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs hover:bg-accent disabled:opacity-50" style={{ color: 'hsl(142,71%,30%)', borderColor: 'hsl(142,71%,80%)' }}>
                                <Save className="w-3.5 h-3.5" /> Salvar
                              </button>
                              <button disabled={!!busy} onClick={cancelEdit} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs hover:bg-accent disabled:opacity-50">
                                <X className="w-3.5 h-3.5" /> Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                          <button
                            disabled={!!busy}
                            onClick={() => startEdit(r.profile!)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs hover:bg-accent disabled:opacity-50"
                            title="Editar cadastro"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            disabled={!!busy}
                            onClick={() => void adminCall('reset_password', r.profile!.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs hover:bg-accent disabled:opacity-50"
                            title="Gerar senha temporária"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> Resetar senha
                          </button>
                          <button
                            disabled={!!busy}
                            onClick={() => { if (confirm(`Remover a conta de ${r.nome}?`)) void adminCall('delete_user', r.profile!.id); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs hover:bg-accent disabled:opacity-50"
                            style={{ color: 'hsl(0,84%,40%)', borderColor: 'hsl(0,84%,85%)' }}
                            title="Remover conta"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remover
                          </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          disabled={creating}
                          onClick={() => void provision({ cod_protheus: r.cod_protheus, nome: r.nome, gestor: r.gestor, cargo: r.cargo })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs hover:bg-accent disabled:opacity-50"
                          title="Pré-criar conta (gera senha temporária)"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Cadastrar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !creating && setShowNew(false)}>
          <div className="bg-card rounded-xl border w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>Novo cadastro</h3>
              <button onClick={() => setShowNew(false)} className="p-1 rounded hover:bg-accent" disabled={creating}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground">A conta é criada com senha temporária e aguarda o 1º acesso do usuário para definir a senha definitiva.</p>
            <label className="block text-xs">
              <span className="text-muted-foreground">Código Protheus *</span>
              <input value={newDraft.cod_protheus} onChange={e => setNewDraft(d => ({ ...d, cod_protheus: e.target.value }))} className="mt-1 w-full px-2 py-1.5 rounded border bg-background text-sm font-mono uppercase" />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Nome *</span>
              <input value={newDraft.nome} onChange={e => setNewDraft(d => ({ ...d, nome: e.target.value }))} className="mt-1 w-full px-2 py-1.5 rounded border bg-background text-sm" />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Gestor</span>
              <input value={newDraft.gestor} onChange={e => setNewDraft(d => ({ ...d, gestor: e.target.value }))} className="mt-1 w-full px-2 py-1.5 rounded border bg-background text-sm" />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Cargo</span>
              <select value={newDraft.cargo} onChange={e => setNewDraft(d => ({ ...d, cargo: e.target.value }))} className="mt-1 w-full px-2 py-1.5 rounded border bg-background text-sm">
                <option value="consultor">Consultor</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">E-mail (opcional — se vazio, usa {`{codigo}@ebsa.local`})</span>
              <input type="email" value={newDraft.email} onChange={e => setNewDraft(d => ({ ...d, email: e.target.value }))} className="mt-1 w-full px-2 py-1.5 rounded border bg-background text-sm" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button disabled={creating} onClick={() => setShowNew(false)} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-accent disabled:opacity-50">Cancelar</button>
              <button
                disabled={creating || !newDraft.cod_protheus.trim() || !newDraft.nome.trim()}
                onClick={async () => { const ok = await provision(newDraft); if (ok) setShowNew(false); }}
                className="px-3 py-1.5 rounded-lg text-sm text-white disabled:opacity-50"
                style={{ background: 'hsl(var(--teal))' }}
              >
                {creating ? 'Cadastrando…' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}<span>{label}</span></div>
      <div className="mt-1 text-2xl font-bold" style={{ color: 'hsl(var(--navy))' }}>{value.toLocaleString('pt-BR')}</div>
    </div>
  );
}