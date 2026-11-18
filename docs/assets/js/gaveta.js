'use strict';
// Gaveta de detalhe do caso.
/* =================== gaveta do caso =================== */
let voltarFoco = null, casoAberto = '';
function abrirCaso(id, origem) {
  const c = S.porId.get(String(id));
  voltarFoco = origem || document.activeElement; casoAberto = String(id);
  $('drawer').classList.add('open'); $('backdrop').classList.add('open'); document.body.style.overflow = 'hidden'; $('dFechar').focus();
  if (!c) { $('dSup').textContent = 'Caso'; $('dTitulo').textContent = id; $('dBadges').innerHTML = ''; $('dBody').innerHTML = '<p class="t-body-sm c3">Este caso não está nos dados carregados (pode ser de um período fora da leitura ou ainda não analisado).</p>'; return; }
  cabecalho(c, null);
  const det = S.detalhes.get(c.caso_id);
  if (det) { corpo(c, det); return; }
  $('dBody').innerHTML = corpoLeve(c) + '<div class="loading t-body-sm"><span class="spin" aria-hidden="true"></span>Carregando todos os detalhes e os tickets…</div>';
  carregarDetalhe([c.caso_id]).then(() => { if (casoAberto === c.caso_id && $('drawer').classList.contains('open')) { const d = S.detalhes.get(c.caso_id); cabecalho(c, d); d ? corpo(c, d) : falhaDetalhe(c, 'caso não devolvido pelo webhook'); } })
    .catch(err => { if (casoAberto === c.caso_id) falhaDetalhe(c, err.message); });
}
function falhaDetalhe(c, msg) { $('dBody').innerHTML = corpoLeve(c) + '<div class="notice err t-body-sm"><svg class="ico sm"><use href="#i-alert"/></svg><span>Não deu para carregar o detalhe: ' + esc(msg) + '</span></div>'; }
function cabecalho(c, d) {
  const x = d ? d.caso : {};
  $('dSup').textContent = 'Caso ' + c.caso_id + (c.data ? ' · fechado em ' + dataBR(c.data) : '');
  $('dTitulo').textContent = c.topico || 'Sem tópico';
  $('dBadges').innerHTML = c.etapas.map(e => '<span class="badge">' + esc(ETAPA_NOME[e] || e) + '</span>').join('') +
    '<span class="badge">' + esc(TIPO[c.tipo_caso] || c.tipo_caso || '') + '</span>' + confBadge(c.confianca).replace('">', '">confiança ') +
    (c.tem_jira ? '<span class="badge accent">Jira</span>' : '') + (x.reaberto_em ? '<span class="badge warning">reaberto</span>' : '');
}
const sec = (t, h) => h ? '<section class="dsec"><h3 class="t-label-md">' + t + '</h3>' + h + '</section>' : '';
const par = s => s ? '<p class="t-body-sm">' + esc(s) + '</p>' : '';
function corpoLeve(c) {
  return sec('Dor', '<p class="t-body-md">' + esc(c.dor) + '</p>') +
    sec('Observação para Produto', c.observacao_produto ? '<p class="t-body-sm other">' + esc(c.observacao_produto) + '</p>' : '');
}
const ORIGEM_EMP = { cliente_empresa: 'empresa do cliente no ticket', organizacao_ticket: 'organização no ticket', relacionamento_pessoa: 'organização da pessoa no Movidesk', outro_cliente: 'outro cliente do ticket' };
const ALERTA_EMP = { empresa_nao_identificada: 'empresa não identificada', empresa_diferente_no_caso: 'tickets do caso com empresas diferentes' };
const simNao = v => { const b = bool(v); return b === null ? '—' : b ? 'Sim' : 'Não'; };
const kvl = pares => '<dl class="kv t-body-sm">' + pares.filter(p => p[1] !== '' && p[1] != null && p[1] !== '—').map(p => '<dt>' + p[0] + '</dt><dd>' + p[1] + '</dd>').join('') + '</dl>';
const etapasTxt = v => lista(v).map(e => ETAPA_NOME[e] || e).join(', ');
function corpo(c, d) {
  const x = d.caso, tks = d.tickets;
  const outros = lista(x.filhos_outro_problema).map(s => { const i = s.indexOf(':'); return i > 0 ? { id: s.slice(0, i).trim(), nota: s.slice(i + 1).trim() } : { id: s, nota: '' }; });
  const outrosIds = new Set(outros.map(o => o.id)), difIds = new Set(lista(x.filhos_servico_diferente));
  const acoes = lista(x.acoes_realizadas), pontos = lista(x.pontos_contexto);
  $('dBody').innerHTML =
    sec('Dor', '<p class="t-body-md">' + esc(x.dor || c.dor) + '</p>') +
    sec('Resumo', par(x.resumo)) +
    sec('Desenrolar (como o caso andou entre os tickets)', par(x.desenrolar)) +
    sec('Ações realizadas', acoes.length ? '<ol class="bul t-body-sm">' + acoes.map(a => '<li>' + esc(a) + '</li>').join('') + '</ol>' : '') +
    sec('Solução aplicada', par(x.solucao_aplicada)) +
    sec('Observação para Produto', x.observacao_produto ? '<p class="t-body-sm other">' + esc(x.observacao_produto) + '</p>' : '') +
    sec('Filhos que tratam de outro problema', outros.length ? '<ul class="bul t-body-sm">' + outros.map(o => '<li><strong>' + esc(o.id) + '</strong>: ' + esc(o.nota) + '</li>').join('') + '</ul>' : '') +
    sec('Pontos de contexto', pontos.length ? '<div class="chips">' + pontos.map(p => '<span class="tag">' + esc(p) + '</span>').join('') + '</div>' : '') +
    sec('Classificação', kvl([
      ['Tópico', esc(x.topico || c.topico) + (x.topico_original ? ' <span class="c3">(unificado de “' + esc(x.topico_original) + '”)</span>' : '')],
      ['Tópico escrito pela IA', x.topico_ia && x.topico_ia !== x.topico ? esc(x.topico_ia) : ''],
      ['Origem do tópico', x.topico_origem === 'movidesk' ? 'Serviço do Movidesk' : x.topico_origem === 'ia' ? 'Sugerido pela IA' : esc(x.topico_origem || '')],
      ['IA confirma o tópico', x.topico_confere ? simNao(x.topico_confere) : ''],
      ['Etapa principal', esc(ETAPA_NOME[x.etapa_principal] || x.etapa_principal || '')],
      ['Etapas do caso', esc(etapasTxt(x.etapas_todas))],
      ['Etapas no Movidesk', esc(etapasTxt(x.etapas_movidesk))],
      ['Etapas impactadas (IA)', esc(etapasTxt(x.etapas_impactadas))],
      ['Etapa sugerida pela IA', esc(ETAPA_NOME[x.etapa_sugerida] || x.etapa_sugerida || '')],
      ['Serviço', esc(x.servico_completo || '')],
      ['Confiança da IA', esc(x.confianca || '')],
      ['Cliente resolveria sozinho', simNao(x.cliente_resolveria_sozinho)]])) +
    sec('Cliente e caso', kvl([
      ['Empresa', x.empresa_nome ? esc(x.empresa_nome) + (x.empresa_codigo ? ' <span class="c3">(código ' + esc(x.empresa_codigo) + ')</span>' : '') : '<span class="c3">não identificada</span>'],
      ['Empresa achada por', esc(ORIGEM_EMP[x.empresa_origem] || x.empresa_origem || '')],
      ['Alerta de empresa', esc(ALERTA_EMP[x.empresa_alerta] || x.empresa_alerta || '')],
      ['Portal', esc(lista(x.portais).join(', ') || x.portal || '')],
      ['Equipes', esc(lista(x.equipes).join(', '))],
      ['Tipo de caso', esc(TIPO[x.tipo_caso] || x.tipo_caso || '')],
      ['Tickets pai (N2)', Number(x.qtd_pais) > 1 ? esc(x.qtd_pais) : ''],
      ['Agrupador', esc(x.agrupador_id || '')],
      ['Tem Jira', simNao(x.tem_jira)],
      ['Aberto em', esc(dataHoraBR(x.criado_em))],
      ['Fechado em', esc(dataHoraBR(x.data_referencia))],
      ['Reaberto em', esc(dataHoraBR(x.reaberto_em))],
      ['Analisado em', esc(dataHoraBR(x.analisado_em))]])) +
    sec('Tickets (' + fmt(tks.length || x.qtd_tickets || 1) + ')', tks.length ? '<ul class="tks">' + tks.map(t =>
      '<li class="' + (outrosIds.has(t.ticket_id) ? 'other' : '') + '"><span class="l1">' +
      (t.url ? '<a class="t-label-lg num" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + esc(t.ticket_id) + ' <svg class="ico sm" aria-hidden="true"><use href="#i-external"/></svg><span class="sr">(abre o Movidesk)</span></a>' : '<strong class="t-label-lg num">' + esc(t.ticket_id) + '</strong>') +
      '<span class="badge">' + esc(t.papel === 'raiz' ? 'raiz' : t.papel || '') + '</span>' + (t.status_movidesk ? '<span class="badge">' + esc(t.status_movidesk) + '</span>' : '') +
      (bool(t.tem_jira) ? '<span class="badge accent">Jira</span>' : '') + (difIds.has(t.ticket_id) || bool(t.servico_difere_pai) ? '<span class="badge warning">serviço diferente do pai</span>' : '') + '</span>' +
      (t.assunto ? '<span class="t-body-sm">' + esc(t.assunto) + '</span>' : '') +
      kvl([['Equipe', esc(t.equipe || '')], ['Serviço', esc(t.servico_completo || '')], ['Etapa', esc(ETAPA_NOME[t.etapa] || t.etapa || '')], ['Portal', esc(t.portal || '')],
      ['Pai', esc(t.ticket_pai_id || '')], ['Empresa', esc(t.empresa_nome || '')], ['Aberto', esc(dataHoraBR(t.criado_em))], ['Resolvido', esc(dataHoraBR(t.resolvido_em))],
      ['Fechado', esc(dataHoraBR(t.fechado_em))], ['Reaberto', esc(dataHoraBR(t.reaberto_em))]]) + '</li>').join('') + '</ul>'
      : '<p class="t-body-sm c3">' + esc(lista(x.ticket_ids).join(', ')) + '</p>');
}
function fecharCaso() {
  casoAberto = '';
  $('drawer').classList.remove('open'); $('backdrop').classList.remove('open'); document.body.style.overflow = '';
  if (voltarFoco && document.contains(voltarFoco)) voltarFoco.focus();
}
$('dFechar').onclick = fecharCaso; $('backdrop').onclick = fecharCaso;
document.addEventListener('keydown', e => {
  if (!$('drawer').classList.contains('open')) return;
  if (e.key === 'Escape') fecharCaso();
  if (e.key === 'Tab') {
    const f = [...$('drawer').querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')]; if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
