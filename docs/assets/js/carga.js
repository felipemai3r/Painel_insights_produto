'use strict';
// Carga e normalização dos dados recebidos.
/* =================== carga e normalização =================== */
function normCaso(r) {
  const d = dataDe(r.data_referencia), rot = d ? rotulos(d) : {};
  const etapas = lista(r.etapas_todas); if (!etapas.length && r.etapa_principal) etapas.push(String(r.etapa_principal));
  return {
    caso_id: String(r.caso_id), data: d, qtd_tickets: Number(r.qtd_tickets) || 1,
    semana: r.semana || rot.semana || '', mes: r.mes || rot.mes || '', trimestre: r.trimestre || rot.trimestre || '', semestre: r.semestre || rot.semestre || '',
    etapas: etapas.length ? etapas : ['outros'], topico: String(r.topico || '').trim() || 'Sem tópico', topico_original: String(r.topico_original || ''), topico_origem: r.topico_origem || '',
    empresa_codigo: String(r.empresa_codigo || '').trim(), empresa_nome: String(r.empresa_nome || '').trim(),
    tipo_caso: r.tipo_caso || 'simples', confianca: String(r.confianca || '').toLowerCase(), cliente_resolveria_sozinho: bool(r.cliente_resolveria_sozinho),
    observacao_produto: String(r.observacao_produto || '').trim(), dor: String(r.dor || ''), portal: String(r.portal || ''), tem_jira: bool(r.tem_jira) === true
  };
}
function aplicarDados(j) {
  const cols = j.casos.colunas;
  S.casos = j.casos.linhas.map(l => normCaso(Object.fromEntries(cols.map((c, i) => [c, l[i]]))));
  S.porId = new Map(S.casos.map(c => [c.caso_id, c]));
  S.consolidado = j.consolidado || []; S.execucoes = j.execucoes || [];
  S.meta = { consumidor: j.consumidor, ultimo_caso: j.ultimo_caso, gerado_em: j.gerado_em, topicos: j.topicos };
}
async function carregar() {
  $('telaLogin').hidden = true; $('telaApp').hidden = false; $('btnAtualizar').hidden = false; $('btnSair').hidden = false;
  const a = $('aviso'); a.hidden = false; a.className = 'notice real t-body-sm'; a.innerHTML = '<span class="spin" aria-hidden="true"></span><span>Lendo os dados da planilha…</span>';
  try {
    const j = await api('dados');
    aplicarDados(j); S.fonte = 'webhook'; S.detalhes = new Map();
    if (!S.carregouUmaVez) { filtrosDoHash(); S.carregouUmaVez = true; }
    renderTudo(); abrirDoHash();
  } catch (err) {
    if (['token_invalido', 'token_inativo', 'token_expirado', 'acao_nao_permitida'].includes(err.codigo)) { sair(err.message); return; }
    a.className = 'notice err t-body-sm'; a.innerHTML = '<svg class="ico sm"><use href="#i-alert"/></svg><span>' + esc(err.message) + ' <button type="button" class="linkbtn" id="tentar">Tentar de novo</button></span>';
    $('tentar').onclick = carregar;
  }
}
async function carregarDetalhe(ids) {
  if (S.fonte === 'exemplo') { for (const id of ids) if (S.exemplo.casos[id]) S.detalhes.set(id, { caso: S.exemplo.casos[id], tickets: S.exemplo.tickets[id] || [] }); return; }
  const doCache = await cacheLer(ids.filter(id => !S.detalhes.has(String(id))));   // o que já foi buscado nos últimos dias não vai ao n8n
  for (const [id, d] of doCache) S.detalhes.set(id, d);
  ids = ids.filter(id => !S.detalhes.has(String(id)));
  if (!ids.length) return;
  const j = await api(ids.length === 1 ? 'caso' : 'exportar', ids.length === 1 ? { caso_id: ids[0] } : { ids });
  const porCaso = new Map(), novos = new Map();
  for (const t of j.tickets || []) { const k = String(t.caso_id); if (!porCaso.has(k)) porCaso.set(k, []); porCaso.get(k).push(t); }
  for (const l of porCaso.values()) l.sort((a, b) => (a.papel === 'raiz' ? -1 : 0) - (b.papel === 'raiz' ? -1 : 0) || String(a.criado_em).localeCompare(String(b.criado_em)));
  for (const c of j.casos || []) { const d = { caso: c, tickets: porCaso.get(String(c.caso_id)) || [] }; S.detalhes.set(String(c.caso_id), d); novos.set(String(c.caso_id), d); }
  cacheGravar(novos);
}
