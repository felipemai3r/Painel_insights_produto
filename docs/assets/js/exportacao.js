'use strict';
// Exportação para .xlsx (casos e tópicos).
/* =================== exportação (.xlsx) =================== */
const ROTULOS = {
  caso_id: 'Caso', ticket_ids: 'Tickets', qtd_tickets: 'Qtd. tickets', equipes: 'Equipes', data_referencia: 'Fechado em', criado_em: 'Aberto em', reaberto_em: 'Reaberto em',
  semana: 'Semana', mes: 'Mês', trimestre: 'Trimestre', semestre: 'Semestre', servico_nivel1: 'Serviço nível 1', servico_nivel2: 'Serviço nível 2', servico_nivel3: 'Serviço nível 3',
  servico_completo: 'Serviço completo', etapas_movidesk: 'Etapas no Movidesk', etapa_principal: 'Etapa principal', etapas_todas: 'Etapas do caso', topico: 'Tópico', topico_original: 'Tópico antes da unificação',
  topico_origem: 'Origem do tópico', empresa_codigo: 'Código da empresa', empresa_nome: 'Empresa', empresa_alerta: 'Alerta de empresa', empresa_origem: 'Empresa achada por', tem_jira: 'Tem Jira',
  etapas_impactadas: 'Etapas impactadas (IA)', etapa_sugerida: 'Etapa sugerida (IA)', topico_confere: 'IA confirma o tópico', topico_ia: 'Tópico escrito pela IA', topico_no_mapa: 'Tópico no mapa',
  dor: 'Dor', acoes_realizadas: 'Ações realizadas', solucao_aplicada: 'Solução aplicada', desenrolar: 'Desenrolar', resumo: 'Resumo', pontos_contexto: 'Pontos de contexto',
  cliente_resolveria_sozinho: 'Cliente resolveria sozinho', confianca: 'Confiança', observacao_produto: 'Observação para Produto', status: 'Status', analisado_em: 'Analisado em', atualizado_em: 'Atualizado em',
  portal: 'Portal', portais: 'Portais', agrupador_id: 'Agrupador', tipo_caso: 'Tipo de caso', qtd_pais: 'Qtd. pais', filhos_servico_diferente: 'Filhos com serviço diferente', filhos_outro_problema: 'Filhos com outro problema',
  ticket_id: 'Ticket', papel: 'Papel', ticket_pai_id: 'Ticket pai', equipe: 'Equipe', status_movidesk: 'Status no Movidesk', assunto: 'Assunto', etapa: 'Etapa', resolvido_em: 'Resolvido em', fechado_em: 'Fechado em',
  servico_difere_pai: 'Serviço difere do pai', url: 'Link no Movidesk'
};
const DATAS = new Set(['data_referencia', 'criado_em', 'reaberto_em', 'analisado_em', 'atualizado_em', 'resolvido_em', 'fechado_em']);
function linhaExport(o) {
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    let x = v;
    if (DATAS.has(k)) x = dataHoraBR(v);
    else if (['etapas_todas', 'etapas_movidesk', 'etapas_impactadas'].includes(k)) x = etapasTxt(v);
    else if (typeof v === 'string' && /^\|.*\|$/.test(v)) x = lista(v).join('; ');
    else if (['etapa_principal', 'etapa_sugerida', 'etapa'].includes(k)) x = ETAPA_NOME[v] || v;
    else if (k === 'empresa_origem') x = ORIGEM_EMP[v] || v;
    else if (k === 'empresa_alerta') x = ALERTA_EMP[v] || v;
    else if (['tem_jira', 'cliente_resolveria_sozinho', 'topico_confere', 'topico_no_mapa', 'servico_difere_pai'].includes(k)) x = bool(v) === null ? '' : bool(v) ? 'Sim' : 'Não';
    r[ROTULOS[k] || k] = x;
  }
  return r;
}
function folha(linhas) { const ws = XLSX.utils.json_to_sheet(linhas); const cols = Object.keys(linhas[0] || {}); ws['!cols'] = cols.map(c => ({ wch: Math.min(60, Math.max(10, c.length + 2, ...linhas.slice(0, 200).map(l => String(l[c] ?? '').length))) })); return ws; }
const nomeArq = p => p + '-' + S.escala + '-' + S.periodo + (S.etapa ? '-' + S.etapa : '') + '.xlsx';
async function exportarCasos() {
  if (!window.XLSX) { alert('Não deu para carregar o gerador de planilhas (sem internet?).'); return; }
  const cs = casosFiltrados(), b = $('btnExpCasos'), txt = b.querySelector('span').textContent;
  b.disabled = true; b.querySelector('span').textContent = 'Preparando…';
  try {
    const faltam = cs.map(c => c.caso_id).filter(id => !S.detalhes.has(id));
    for (let i = 0; i < faltam.length; i += 2000) await carregarDetalhe(faltam.slice(i, i + 2000));
    const casos = [], tickets = [];
    for (const c of cs) { const d = S.detalhes.get(c.caso_id); if (!d) continue; casos.push(linhaExport(d.caso)); for (const t of d.tickets) tickets.push(linhaExport(t)); }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, folha(casos), 'casos');
    XLSX.utils.book_append_sheet(wb, folha(tickets.length ? tickets : [{ Ticket: '' }]), 'tickets');
    XLSX.utils.book_append_sheet(wb, folha([{ Filtro: 'Escala', Valor: S.escala }, { Filtro: 'Período', Valor: nomePeriodo(S.periodo, S.escala) }, { Filtro: 'Etapa', Valor: ETAPA_NOME[S.etapa] || S.etapa },
    { Filtro: 'Tópico', Valor: S.topico || '(todos)' }, { Filtro: 'Busca', Valor: S.busca || '(nenhuma)' }, { Filtro: 'Casos', Valor: casos.length }, { Filtro: 'Gerado em', Valor: dataHoraBR(new Date()) }]), 'filtros');
    XLSX.writeFile(wb, nomeArq('casos'));
  } catch (err) { alert('Não deu para exportar: ' + err.message); }
  finally { b.disabled = false; b.querySelector('span').textContent = txt; }
}
function exportarTopicos() {
  if (!window.XLSX) { alert('Não deu para carregar o gerador de planilhas (sem internet?).'); return; }
  const cs = doPeriodo(S.periodo), antRot = anterior(S.periodo, S.escala), ca = doPeriodo(antRot);
  const temAnt = ca.length > 0, ranking = [], top5 = [], textos = [];
  for (const e of [...ETAPAS.map(x => x[0]), 'todas']) {
    const ce = daEtapa(cs, e), tops = porTopico(noRanking(ce));
    const antM = new Map(porTopico(noRanking(daEtapa(ca, e))).map(t => [t.t, t]));
    const porEmp = [...tops].sort((a, b) => b.emp - a.emp || b.n - a.n || a.t.localeCompare(b.t)).map(t => t.t);
    tops.forEach((t, i) => {
      const a = antM.get(t.t);
      const l = {
        Etapa: ETAPA_NOME[e], 'Posição (casos)': i + 1, 'Posição (empresas)': porEmp.indexOf(t.t) + 1, 'Tópico': t.t, Casos: t.n, Empresas: t.emp,
        'Casos no período anterior': temAnt ? (a ? a.n : 0) : '', 'Variação': temAnt ? t.n - (a ? a.n : 0) : '', 'Novo no período': temAnt ? (a ? 'Não' : 'Sim') : '',
        'Principais portais': portaisTxt(t.portais, 5), 'Com observação para Produto': t.casos.filter(c => c.observacao_produto).length, 'Exemplos (casos)': t.casos.slice(0, 5).map(c => c.caso_id).join(', ')
      };
      ranking.push(l); if (i < 5) top5.push(l);
    });
    const r = consDe(S.escala, S.periodo, e);
    if (r && r.resumo) textos.push({
      Etapa: ETAPA_NOME[e], 'Período': r.periodo_status === 'final' ? 'fechado' : 'em andamento', 'Gerado em': dataHoraBR(r.gerado_em), 'Casos no texto': r.casos,
      Resumo: r.resumo, Destaques: lista(r.destaques).join('\n'), 'Vs período anterior': r.mudou_vs_periodo_anterior, 'Vs rodada anterior': r.mudou_vs_rodada_anterior,
      'Casos para ler': lista(r.casos_destaque).join('\n'), 'Sinais para Produto': lista(r.sinais_produto).join('\n')
    });
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, folha(top5.length ? top5 : [{ 'Tópico': '' }]), 'top5');
  XLSX.utils.book_append_sheet(wb, folha(ranking.length ? ranking : [{ 'Tópico': '' }]), 'ranking');
  XLSX.utils.book_append_sheet(wb, folha(textos.length ? textos : [{ Resumo: 'Período ainda não consolidado pelo fluxo 2' }]), 'texto_ia');
  XLSX.utils.book_append_sheet(wb, folha([{ Item: 'Período', Valor: nomePeriodo(S.periodo, S.escala) }, { Item: 'Período anterior', Valor: temAnt ? nomePeriodo(antRot, S.escala) : 'sem dados' },
  { Item: 'Regra', Valor: 'Caso em várias etapas conta em cada uma e uma vez em "Todas as etapas"; o caso do N2 ligado a vários tickets do N1 fica fora do ranking; tópico já unificado' },
  { Item: 'Gerado em', Valor: dataHoraBR(new Date()) }]), 'sobre');
  XLSX.writeFile(wb, 'topicos-' + S.escala + '-' + S.periodo + '.xlsx');
}
$('btnExpCasos').onclick = exportarCasos;
$('btnExpTopicos').onclick = exportarTopicos;
