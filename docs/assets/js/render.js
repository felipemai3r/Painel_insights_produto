'use strict';
// Renderização do painel: cabeçalho, filtros, etapas, Top 5, cadência, texto da IA, casos e execuções.
/* =================== render =================== */
function renderTudo() { renderAviso(); renderFiltros(); S.temAnt = doPeriodo(anterior(S.periodo, S.escala)).length > 0; renderKpis(); renderIaGeral(); renderEtapas(); renderEtapa(); renderCasos(); renderExecucoes(); }

function diasUteisDesde(d) { let n = 0; const x = new Date(d); x.setUTCHours(12); const fim = new Date(); while (x < fim) { x.setUTCDate(x.getUTCDate() + 1); const w = x.getUTCDay(); if (w && w !== 6 && x < fim) n++; } return n; }
function renderAviso() {
  const a = $('aviso'), u = dataDe(S.meta.ultimo_caso);
  const msgs = [];
  if (S.fonte === 'exemplo') msgs.push(['warn', '<strong>Dados fictícios de exemplo</strong> (modo demonstração). Nada aqui é real.']);
  if (S.fonte === 'webhook' && u && diasUteisDesde(u) > 2) msgs.push(['warn', 'O caso mais recente é de <strong>' + esc(dataBR(u)) + '</strong>. Se houve atendimento depois disso, confira se o fluxo 1 está ativo (painel <a href="#hExec">Execuções</a>).']);
  a.hidden = !msgs.length;
  if (msgs.length) { a.className = 'notice t-body-sm'; a.innerHTML = '<svg class="ico sm"><use href="#i-alert"/></svg><span>' + msgs.map(m => m[1]).join(' ') + '</span>'; }
  $('sub').textContent = 'Effecti · visão para Produto' + (S.meta.consumidor ? ' · ' + S.meta.consumidor : '') + (u ? ' · casos até ' + dataBR(u) : '');
}

function seg(el, opcoes, atual, onPick, desab) {
  el.innerHTML = '';
  for (const [k, n] of opcoes) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = n;
    b.setAttribute('aria-pressed', String(k === atual));
    if (desab && desab[k]) { b.disabled = true; b.title = desab[k]; b.dataset.tip = desab[k]; }
    b.onclick = () => onPick(k); el.appendChild(b);
  }
}
function periodosDisponiveis() { return [...new Set(S.casos.map(c => c[S.escala]).filter(Boolean))].sort().reverse(); }
function renderFiltros() {
  seg($('segEscala'), ESCALAS, S.escala, k => { S.escala = k; S.periodo = ''; S.topico = ''; renderTudo(); });
  seg($('segMedida'), MEDIDAS, S.medida, k => { S.medida = k; renderTudo(); });
  const ps = periodosDisponiveis();
  if (!ps.includes(S.periodo)) S.periodo = ps.find(p => !emAndamento(p)) || ps[0] || '';
  $('selPeriodo').innerHTML = ps.map(p => '<option value="' + esc(p) + '"' + (p === S.periodo ? ' selected' : '') + '>' + esc(nomePeriodo(p, S.escala)) + (emAndamento(p) ? ' (em andamento)' : '') + '</option>').join('');
}

function renderKpis() {
  const cs = doPeriodo(S.periodo), ant = doPeriodo(anterior(S.periodo, S.escala));
  const emp = new Set(cs.map(empresaDe).filter(Boolean)).size, empAnt = new Set(ant.map(empresaDe).filter(Boolean)).size;
  const comResp = cs.filter(c => c.cliente_resolveria_sozinho !== null), sozinho = comResp.filter(c => c.cliente_resolveria_sozinho).length;
  // balão da confiança: casos e chamados (tickets) por nível
  const nivel = n => { const l = cs.filter(c => c.confianca === n); return { casos: l.length, chamados: l.reduce((s, c) => s + (c.qtd_tickets || 1), 0) }; };
  const NIVEIS = [['alta', 'Alta'], ['media', 'Média'], ['baixa', 'Baixa']], porNivel = Object.fromEntries(NIVEIS.map(([k]) => [k, nivel(k)]));
  const semNivel = cs.length - NIVEIS.reduce((s, [k]) => s + porNivel[k].casos, 0), totChamados = cs.reduce((s, c) => s + (c.qtd_tickets || 1), 0);
  const tipConf = 'Confiança da IA na análise: ' + pl(cs.length, 'caso', 'casos') + ' · ' + pl(totChamados, 'chamado', 'chamados') + '\n' +
    NIVEIS.map(([k, n]) => n + ': ' + pl(porNivel[k].casos, 'caso', 'casos') + ' · ' + pl(porNivel[k].chamados, 'chamado', 'chamados') + ' (' + pct(porNivel[k].casos, cs.length) + ')').join('\n') +
    (semNivel ? '\nSem classificação: ' + pl(semNivel, 'caso', 'casos') : '') + '\nBaixa = o atendimento não sustenta bem a dor e a solução';
  const baixa = cs.filter(c => c.confianca === 'baixa').length, sinais = cs.filter(c => c.observacao_produto).length, semEmp = cs.filter(c => !empresaDe(c)).length;
  $('subGeral').textContent = nomePeriodo(S.periodo, S.escala) + (emAndamento(S.periodo) ? ' · em andamento' : '');
  const k = (lbl, val, sub, tip) => '<div class="card kpi"' + (tip ? ' data-tip="' + esc(tip) + '"' : '') + '><span class="t-label-md lbl">' + lbl + '</span><span class="t-display-md num">' + val + '</span><span class="t-body-xs delta">' + sub + '</span></div>';
  $('kpis').innerHTML =
    k('Casos analisados', fmt(cs.length), S.temAnt ? (deltaTxt(cs.length, ant.length) || '&nbsp;') : 'sem dados do período anterior', 'Cada caso conta uma vez no total, mesmo se estiver em várias etapas') +
    k('Empresas', fmt(emp), (semEmp ? pl(semEmp, 'caso', 'casos') + ' sem empresa · ' : '') + (deltaTxt(emp, empAnt) || ''), 'Empresas distintas pelo código') +
    k('Cliente resolveria sozinho', pct(sozinho, comResp.length), fmt(sozinho) + ' de ' + fmt(comResp.length) + ' com resposta', 'Segundo a IA, a correção estava ao alcance do cliente') +
    k('Confiança baixa', pct(baixa, cs.length), pl(baixa, 'caso', 'casos'), tipConf) +
    k('Observações para Produto', fmt(sinais), 'casos com observação da IA', 'Campo observacao_produto preenchido');
}

/* ---------- texto da IA (fluxo 2) ---------- */
function iaMeta(r) {
  const av = lista(r.avisos);
  return '<div class="meta">' + (r.periodo_status === 'final' ? '<span class="badge success">período fechado</span>' : '<span class="badge warning">período em andamento</span>') +
    '<span class="badge">gerado em ' + esc(dataHoraBR(r.gerado_em)) + '</span>' +
    (av.includes('dados_incompletos') ? '<span class="badge warning" data-tip="A ingestão do fluxo 1 ainda tinha casos pendentes quando o texto foi gerado">dados incompletos</span>' : '') +
    (av.includes('dias_sem_dados') ? '<span class="badge warning" data-tip="Há dias úteis do período sem nenhum caso carregado">dias sem dados</span>' : '') +
    (Number(r.casos) !== daEtapa(doPeriodo(r.periodo), r.etapa).length ? '<span class="badge warning" data-tip="O texto foi gerado com ' + esc(r.casos) + ' casos; hoje o período tem ' + daEtapa(doPeriodo(r.periodo), r.etapa).length + '. Os números da tela estão atualizados; o texto é de uma rodada anterior.">texto com ' + esc(r.casos) + ' casos</span>' : '') + '</div>';
}
function casosDestaque(r) {
  return lista(r.casos_destaque).map(x => { const i = x.indexOf(':'); return i > 0 ? { id: x.slice(0, i).trim(), motivo: x.slice(i + 1).trim() } : { id: x, motivo: '' }; });
}
function iaCorpo(r, completo) {
  const dest = lista(r.destaques), cd = casosDestaque(r), sin = lista(r.sinais_produto);
  let h = '<p class="t-body-md">' + esc(r.resumo) + '</p>';
  if (dest.length) h += '<div><h4 class="t-label-md">Destaques</h4><ul class="bul t-body-sm">' + dest.map(d => '<li>' + esc(d) + '</li>').join('') + '</ul></div>';
  if (completo) {
    if (r.mudou_vs_periodo_anterior) h += '<div><h4 class="t-label-md">O que mudou em relação ao período anterior</h4><p class="t-body-sm">' + esc(r.mudou_vs_periodo_anterior) + '</p></div>';
    if (r.mudou_vs_rodada_anterior) h += '<div><h4 class="t-label-md">Desde a rodada anterior deste período</h4><p class="t-body-sm">' + esc(r.mudou_vs_rodada_anterior) + '</p></div>';
  }
  if (cd.length) h += '<div><h4 class="t-label-md">Casos para ler</h4><ul class="bul t-body-sm casos">' + cd.map(c => '<li><span><button type="button" class="linkbtn num" data-caso="' + esc(c.id) + '">' + esc(c.id) + '</button> ' + esc(c.motivo) + '</span></li>').join('') + '</ul></div>';
  if (completo && sin.length) h += '<div><h4 class="t-label-md">Sinais para Produto</h4><ul class="bul t-body-sm">' + sin.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul></div>';
  return h;
}
function renderIaGeral() {
  const r = consDe(S.escala, S.periodo, 'todas'), el = $('iaGeral');
  if (!r || r.status === 'sem_casos' || !r.resumo) { el.innerHTML = '<div class="section-head" style="margin:0"><h3 class="t-heading-sm">Leitura da IA</h3></div><p class="t-body-sm c3">Este período ainda não foi consolidado pelo fluxo 2.</p>'; return; }
  const dest = lista(r.destaques), cd = casosDestaque(r);
  el.innerHTML = '<div class="ia"><div class="section-head" style="margin:0"><h3 class="t-heading-sm">Leitura da IA · todas as etapas</h3>' + iaMeta(r) + '</div>' +
    '<div class="ia-geral"><div class="stack"><p class="t-body-md">' + esc(r.resumo) + '</p>' + (r.mudou_vs_periodo_anterior ? '<p class="t-body-sm c2"><strong>Vs período anterior:</strong> ' + esc(r.mudou_vs_periodo_anterior) + '</p>' : '') + '</div>' +
    '<div class="stack">' + (dest.length ? '<ul class="bul t-body-sm">' + dest.map(d => '<li>' + esc(d) + '</li>').join('') + '</ul>' : '') +
    (cd.length ? '<p class="t-body-sm c2">Casos para ler: ' + cd.map(c => '<button type="button" class="linkbtn num" data-caso="' + esc(c.id) + '" data-tip="' + esc(c.motivo) + '">' + esc(c.id) + '</button>').join(', ') + '</p>' : '') + '</div></div></div>';
  ligarCasos(el);
}
function ligarCasos(el) { el.querySelectorAll('[data-caso]').forEach(b => b.onclick = e => { e.stopPropagation(); abrirCaso(b.dataset.caso, b); }); }

function renderEtapas() {
  const cs = doPeriodo(S.periodo), ant = doPeriodo(anterior(S.periodo, S.escala));
  const presentes = new Set(S.casos.flatMap(c => c.etapas));
  const lista_ = [...ETAPAS.map(e => e[0]), ...[...presentes].filter(e => !ETAPAS.some(x => x[0] === e)).sort()];
  if (!lista_.includes(S.etapa)) S.etapa = lista_[0];
  $('etapas').innerHTML = lista_.map(e => {
    const ce = daEtapa(cs, e), v = medir(ce), va = medir(daEtapa(ant, e));
    const top = porTopico(noRanking(ce)).slice(0, 3);
    return '<button type="button" class="card etapa" data-etapa="' + esc(e) + '" aria-pressed="' + (e === S.etapa) + '">' +
      '<span class="row"><span class="t-heading-sm">' + esc(ETAPA_NOME[e] || e) + '</span><span class="t-heading-lg num">' + fmt(v) + '</span></span>' +
      '<span class="row t-body-xs"><span class="c3">' + (v === 1 ? nomeMedida().slice(0, -1) : nomeMedida()) + '</span><span class="delta">' + (deltaTxt(v, va) || '') + '</span></span>' +
      (top.length ? '<ol class="t-body-sm">' + top.map(t => '<li><span>' + esc(t.t) + '</span><span class="num">' + fmt(t.v) + '</span></li>').join('') + '</ol>' : '<span class="t-body-sm c3">Nenhum caso no período</span>') +
      '</button>';
  }).join('');
  $('etapas').querySelectorAll('.etapa').forEach(b => b.onclick = () => { S.etapa = b.dataset.etapa; S.topico = ''; S.limite = 25; renderEtapas(); renderEtapa(); renderCasos(); });
}

function renderEtapa() {
  const nome = ETAPA_NOME[S.etapa] || S.etapa;
  const cs = daEtapa(doPeriodo(S.periodo), S.etapa);
  const antRot = anterior(S.periodo, S.escala);
  const antT = new Map(porTopico(noRanking(daEtapa(doPeriodo(antRot), S.etapa))).map(t => [t.t, t.v]));
  $('hEtapa').textContent = nome + ' · ' + nomePeriodo(S.periodo, S.escala);
  $('subEtapa').textContent = pl(cs.length, 'caso', 'casos') + ' · ' + pl(new Set(cs.map(empresaDe).filter(Boolean)).size, 'empresa', 'empresas');

  const tops = porTopico(noRanking(cs)), top5 = tops.slice(0, 5), max = Math.max(1, ...top5.map(t => t.v));
  const foraRanking = cs.length - noRanking(cs).length;
  $('subTop').textContent = tops.length ? 'por ' + nomeMedida() + ' · ' + fmt(tops.length) + ' tópicos no período' + (foraRanking ? ' · ' + pl(foraRanking, 'caso de N2 com vários pais fora', 'casos de N2 com vários pais fora') : '') : '';
  $('top5').innerHTML = top5.length ? top5.map((t, i) => {
    const a = antT.get(t.t) ?? 0, d = t.v - a;
    const dtxt = !S.temAnt ? 'sem comparação' : d === 0 ? 'igual ao anterior' : (d > 0 ? '+' : '') + fmt(d) + ' vs anterior';
    return '<li><button type="button" class="bar" data-topico="' + esc(t.t) + '" aria-pressed="' + (S.topico === t.t) + '" ' +
      'aria-label="' + esc((i + 1) + 'º ' + t.t + ': ' + t.n + ' casos, ' + t.emp + ' empresas, ' + dtxt + '. Ver casos') + '" ' +
      'data-tip="' + esc(t.t + ' — ' + pl(t.n, 'caso', 'casos') + ' · ' + pl(t.emp, 'empresa', 'empresas') + ' · ' + dtxt) + '">' +
      '<span class="name t-body-sm">' + (i + 1) + '. ' + esc(t.t) + '</span><span class="val t-label-lg num">' + fmt(t.v) + '</span>' +
      '<span class="track"><span class="fill" style="width:' + (100 * t.v / max).toFixed(1) + '%"></span></span>' +
      '<span class="meta t-body-xs">' + pl(t.n, 'caso', 'casos') + ' · ' + pl(t.emp, 'empresa', 'empresas') + ' · ' + dtxt + '</span>' +
      '<span class="portais t-body-xs">' + (t.portais.length ? 'Portais: ' + esc(portaisTxt(t.portais, 3)) + (t.portais.length > 3 ? ' e mais ' + (t.portais.length - 3) : '') : 'Portal não informado') + '</span></button></li>';
  }).join('') : '<li class="empty t-body-sm">Nenhum caso desta etapa no período.</li>';
  $('top5').querySelectorAll('.bar').forEach(b => b.onclick = () => { S.topico = S.topico === b.dataset.topico ? '' : b.dataset.topico; S.limite = 25; renderEtapa(); renderCasos(); $('hCasos').scrollIntoView({ behavior: reduz() ? 'auto' : 'smooth', block: 'start' }); });

  const rots = [S.periodo]; while (rots.length < N_CADENCIA) rots.unshift(anterior(rots[0], S.escala));
  const vals = rots.map(r => medir(daEtapa(doPeriodo(r), S.etapa)));
  const vmax = Math.max(1, ...vals), passo = niceStep(vmax), topo = Math.ceil(vmax / passo) * passo;
  $('subCad').textContent = nomeMedida() + ' por ' + (ESCALAS.find(e => e[0] === S.escala)[1]).toLowerCase() + ', últimos ' + N_CADENCIA;
  let gl = ''; for (let g = passo; g <= topo; g += passo) gl += '<div class="gl" style="bottom:' + (100 * g / topo) + '%"><span class="t-label-sm num">' + fmt(g) + '</span></div>';
  $('cadencia').innerHTML = '<div class="cols" role="list">' + gl + rots.map((r, i) => {
    const cur = r === S.periodo;
    return '<button type="button" role="listitem" class="col' + (cur ? ' cur' : '') + '" data-rot="' + esc(r) + '" aria-label="' + esc(nomePeriodo(r, S.escala) + ': ' + vals[i] + ' ' + nomeMedida()) + '" data-tip="' + esc(nomePeriodo(r, S.escala) + ' — ' + fmt(vals[i]) + ' ' + nomeMedida()) + '">' +
      (cur ? '<span class="dl t-label-md num" style="bottom:calc(' + (100 * vals[i] / topo) + '% + var(--space-4))">' + fmt(vals[i]) + '</span>' : '') +
      '<span class="f" style="height:' + (100 * vals[i] / topo).toFixed(1) + '%"></span></button>';
  }).join('') + '</div><div class="xlabels t-label-sm" aria-hidden="true">' + rots.map(r => '<span class="' + (r === S.periodo ? 'cur' : '') + '">' + esc(curtoPeriodo(r, S.escala)) + '</span>').join('') + '</div>';
  $('cadencia').querySelectorAll('.col').forEach(b => b.onclick = () => { if (periodosDisponiveis().includes(b.dataset.rot)) { S.periodo = b.dataset.rot; S.topico = ''; renderTudo(); } });

  const altas = tops.map(t => ({ t: t.t, d: t.v - (antT.get(t.t) ?? 0) })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
  $('emAlta').innerHTML = !S.temAnt ? 'Sem dados do período anterior para comparar.' : altas.length ? 'Maior alta vs período anterior: <strong>' + esc(altas[0].t) + '</strong> (+' + fmt(altas[0].d) + ').' : 'Nenhum tópico cresceu em relação ao período anterior.';

  // texto da IA da etapa (fluxo 2) ou, se não houver, destaques calculados
  const r = consDe(S.escala, S.periodo, S.etapa);
  if (r && r.resumo) {
    $('iaEtapa').innerHTML = '<div class="ia"><div class="section-head" style="margin:0"><h3 class="t-heading-sm">Leitura da IA</h3>' + iaMeta(r) + '</div>' + iaCorpo(r, true) + '</div>';
  } else {
    const comResp = cs.filter(c => c.cliente_resolveria_sozinho !== null), soz = comResp.filter(c => c.cliente_resolveria_sozinho).length;
    const novos = tops.filter(t => !antT.has(t.t)).length, multi = cs.filter(c => c.etapas.length > 1).length;
    $('iaEtapa').innerHTML = '<div class="section-head" style="margin:0"><h3 class="t-heading-sm">Leitura da IA</h3><span class="badge">ainda não consolidado</span></div>' +
      '<p class="t-body-sm c3">O fluxo 2 ainda não gerou o texto desta etapa neste período. Enquanto isso, o que dá para calcular:</p>' +
      (cs.length ? '<ul class="bul t-body-sm">' + [
        pl(cs.length, 'caso', 'casos'),
        'Mais frequente: <strong>' + esc(tops[0] ? tops[0].t : '—') + '</strong>' + (tops[0] ? ' (' + pl(tops[0].n, 'caso', 'casos') + ')' : ''),
        S.temAnt ? (novos === 1 ? '1 tópico que não apareceu' : fmt(novos) + ' tópicos que não apareceram') + ' no período anterior' : 'Sem período anterior para comparar',
        'Cliente resolveria sozinho em ' + pct(soz, comResp.length) + ' dos casos com resposta',
        multi ? (multi === 1 ? '1 caso também conta' : fmt(multi) + ' casos também contam') + ' em outra etapa' : 'Nenhum caso em mais de uma etapa'
      ].map(x => '<li>' + x + '</li>').join('') + '</ul>' : '<p class="t-body-sm">Nenhum caso no período.</p>');
  }
  ligarCasos($('iaEtapa'));

  const chaveSin = S.escala + '|' + S.periodo + '|' + S.etapa;
  if (S.sinChave !== chaveSin) { S.sinChave = chaveSin; S.sinPag = 0; }   // outra etapa ou período: volta para a 1ª página
  S.sinLista = cs.filter(c => c.observacao_produto).sort((a, b) => (b.data || 0) - (a.data || 0));
  renderSinais();
}

// Observações dos casos: todas, paginadas
const SIN_POR_PAG = 6;
function renderSinais() {
  const sin = S.sinLista || [], pags = Math.max(1, Math.ceil(sin.length / SIN_POR_PAG));
  S.sinPag = Math.min(Math.max(0, S.sinPag || 0), pags - 1);
  const ini = S.sinPag * SIN_POR_PAG, vis = sin.slice(ini, ini + SIN_POR_PAG);
  $('subSinais').textContent = sin.length ? fmt(sin.length) + ' no período' : '';
  $('sinais').innerHTML = vis.length ? vis.map(c => '<li><span class="t-body-sm">' + esc(c.observacao_produto) + '</span><span class="t-body-xs c3">' + esc(dataBR(c.data)) + ' · ' + esc(c.topico) + ' · <button type="button" class="linkbtn" data-caso="' + esc(c.caso_id) + '">caso ' + esc(c.caso_id) + '</button></span></li>').join('')
    : '<li class="t-body-sm c3">Nenhuma observação para Produto nesta etapa e período.</li>';
  ligarCasos($('sinais'));
  $('pagSinais').hidden = sin.length <= SIN_POR_PAG;
  $('sinPos').textContent = fmt(ini + 1) + '–' + fmt(ini + vis.length) + ' de ' + fmt(sin.length) + ' · página ' + (S.sinPag + 1) + ' de ' + pags;
  $('sinAnt').disabled = S.sinPag === 0;
  $('sinProx').disabled = S.sinPag >= pags - 1;
}
$('sinAnt').onclick = () => { S.sinPag--; renderSinais(); };
$('sinProx').onclick = () => { S.sinPag++; renderSinais(); };
function niceStep(v) { const raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }

function confBadge(c) { return c === 'alta' ? '<span class="badge success">alta</span>' : c === 'media' ? '<span class="badge warning">média</span>' : c === 'baixa' ? '<span class="badge error">baixa</span>' : '<span class="badge">—</span>'; }
function casosFiltrados() {
  let cs = daEtapa(doPeriodo(S.periodo), S.etapa);
  if (S.topico) cs = cs.filter(c => (c.topico || 'Sem tópico') === S.topico);
  const q = S.busca.trim().toLowerCase();
  if (q) cs = cs.filter(c => [c.caso_id, c.dor, c.empresa_nome, c.topico, c.topico_original, c.empresa_codigo, c.portal, c.observacao_produto].join(' ').toLowerCase().includes(q));
  return cs.sort((a, b) => (b.data || 0) - (a.data || 0));
}
function renderCasos() {
  const cs = casosFiltrados();
  $('subCasos').textContent = (ETAPA_NOME[S.etapa] || S.etapa) + ' · ' + nomePeriodo(S.periodo, S.escala) + ' · ' + pl(cs.length, 'caso', 'casos');
  $('chipTopico').innerHTML = S.topico ? '<button type="button" class="btn btn-secondary" id="limpaTopico" aria-label="Remover filtro de tópico ' + esc(S.topico) + '">' + esc(S.topico) + ' <svg class="ico sm"><use href="#i-x"/></svg></button>' : '';
  if (S.topico) $('limpaTopico').onclick = () => { S.topico = ''; renderEtapa(); renderCasos(); };
  const vis = cs.slice(0, S.limite);
  $('tbCasos').innerHTML = vis.length ? vis.map(c => '<tr data-caso="' + esc(c.caso_id) + '">' +
    '<td><button type="button" class="linkbtn num" data-caso="' + esc(c.caso_id) + '">' + esc(c.caso_id) + '</button></td>' +
    '<td class="t-body-sm num">' + esc(dataBR(c.data) || '—') + '</td>' +
    '<td class="t-body-sm">' + esc(c.topico || '—') + '</td>' +
    '<td class="t-body-sm">' + (c.empresa_nome ? esc(c.empresa_nome) : '<span class="c3">não identificada</span>') + '</td>' +
    '<td class="t-body-sm">' + esc(c.portal || '—') + '</td>' +
    '<td class="t-body-sm dor">' + esc(c.dor) + '</td>' +
    '<td>' + confBadge(c.confianca) + '</td>' +
    '<td class="t-body-sm num">' + fmt(c.qtd_tickets || 1) + '</td></tr>').join('') : '<tr><td colspan="8" class="empty t-body-sm">Nenhum caso com esses filtros.</td></tr>';
  $('tbCasos').querySelectorAll('tr[data-caso]').forEach(tr => tr.onclick = () => abrirCaso(tr.dataset.caso, tr.querySelector('button')));
  $('btnMais').hidden = cs.length <= S.limite;
  $('btnMais').textContent = 'Mostrar mais (' + fmt(cs.length - S.limite) + ')';
  $('btnExpCasos').disabled = !cs.length;
  $('btnExpCasos').querySelector('span').textContent = 'Exportar ' + pl(cs.length, 'caso', 'casos');
}

/* ---------- execuções (D46) ---------- */
function renderExecucoes() {
  const ex = S.execucoes || [];
  const nomeFluxo = r => String(r.execucao_id).startsWith('cons_') || r.workflow === 'consolidacao' ? 'Consolidação' : 'Ingestão';
  const st = s => s === 'concluida' ? '<span class="badge success">concluída</span>' : s === 'concluida_com_erros' ? '<span class="badge warning">com erros</span>' : s === 'em_andamento' ? '<span class="badge accent">em andamento</span>' : '<span class="badge error">' + esc(s || '—') + '</span>';
  const dur = r => { const a = dataDe(r.iniciado_em), b = dataDe(r.finalizado_em); if (!a || !b) return '—'; const m = Math.round((b - a) / 6e4); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + pad(m % 60); };
  const ultIng = ex.find(r => nomeFluxo(r) === 'Ingestão'), ultCons = ex.find(r => nomeFluxo(r) === 'Consolidação');
  $('subExec').textContent = [ultIng ? 'última ingestão ' + dataHoraBR(ultIng.iniciado_em) : '', ultCons ? 'última consolidação ' + dataHoraBR(ultCons.iniciado_em) : ''].filter(Boolean).join(' · ');
  $('tbExec').innerHTML = ex.length ? ex.map(r => '<tr><td class="t-body-sm">' + nomeFluxo(r) + (r.gatilho ? ' <span class="c3">· ' + esc(r.gatilho) + '</span>' : '') + '</td>' +
    '<td class="t-body-sm num">' + esc(dataHoraBR(r.iniciado_em)) + '</td><td class="t-body-sm num">' + dur(r) + '</td><td>' + st(r.status) + '</td>' +
    '<td class="t-body-sm num">' + esc(r.periodo_inicio === r.periodo_fim ? dataBR(r.periodo_inicio + 'T12:00:00Z') : dataBR(r.periodo_inicio + 'T12:00:00Z') + ' a ' + dataBR(r.periodo_fim + 'T12:00:00Z')) + '</td>' +
    '<td class="t-body-sm num">' + esc(r.gravados_ok || '—') + '</td><td class="t-body-sm num">' + (r.erros ? '<strong>' + fmt(r.erros) + '</strong>' : '0') + '</td>' +
    '<td class="t-body-sm num">' + esc(r.restantes || '0') + '</td><td class="t-body-xs obs">' + esc(r.observacao) + '</td></tr>').join('') : '<tr><td colspan="9" class="empty t-body-sm">Sem execuções registradas.</td></tr>';
  const t = S.meta.topicos;
  $('rodape').innerHTML = 'Contagens feitas no navegador a partir dos casos com status <code>ok</code> e <code>ok_com_aviso</code>, com o tópico unificado (coluna <code>unificar_em</code>). O caso do N2 ligado a vários tickets do N1 fica fora do Top 5. Os textos da IA vêm da consolidação (fluxo 2).' +
    (t ? ' Aba de tópicos: ' + fmt(t.total) + ' tópicos, ' + fmt(t.sugeridos) + ' sugeridos aguardando curadoria, ' + fmt(t.unificados) + ' unificados.' : '') +
    (S.meta.gerado_em ? ' Dados lidos em ' + esc(dataHoraBR(S.meta.gerado_em)) + '.' : '');
}
