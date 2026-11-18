'use strict';
// Modo demonstração (#demo): dados fictícios, sem chamar o webhook.
/* =================== modo demonstração (#demo): dados fictícios, nada real =================== */
function gerarExemplo() {
  let seed = 20261112; const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const pick = a => a[Math.floor(r() * a.length)];
  const T = {
    disputar: ['Atualização do Disputar', 'Envio de lance automático', 'Iniciar disputa'], minha_effecti: ['Adicionar acesso', 'Usuários e permissões'], encontrar: ['Adicionar licitação', 'Filtros de busca'],
    cadastrar: ['Cadastro de proposta', 'Documentos da empresa'], monitorar: ['Acompanhamento de processos', 'Mensagens do pregoeiro'], outros: ['Sem relato do problema', 'Dúvida comercial']
  };
  const linhas = [], casos = {}, tickets = {}; let tid = 350000;
  const ini = Date.UTC(2026, 8, 1), fim = Date.UTC(2026, 10, 11);
  for (let t = ini; t < fim; t += 864e5) {
    const dow = new Date(t).getUTCDay(), n = dow === 0 || dow === 6 ? 1 : 6 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const etapa = pick(Object.keys(T)), top = pick(T[etapa]), id = String(++tid), nt = r() < .2 ? 2 : 1, ref = new Date(t + (12 + Math.floor(r() * 8)) * 36e5);
      const obs = r() < .3 ? 'Exemplo fictício de observação para Produto sobre ' + top.toLowerCase() + '.' : '';
      const emp = 'EX' + pad(1 + Math.floor(r() * 90));
      const c = {
        caso_id: id, data_referencia: ref.toISOString(), etapas_todas: '|' + etapa + '|', etapa_principal: etapa, topico: top, topico_original: '', topico_origem: 'movidesk', empresa_codigo: emp,
        empresa_nome: 'Empresa Exemplo ' + emp.slice(2), tipo_caso: nt > 1 ? 'escalacao' : 'simples', confianca: pick(['alta', 'alta', 'media', 'baixa']), cliente_resolveria_sozinho: pick(['true', 'false', '']),
        observacao_produto: obs, qtd_tickets: nt, dor: 'Dor fictícia: o cliente não conseguia concluir "' + top.toLowerCase() + '" pela plataforma.', portal: pick(['Compras.gov.br', 'BLL', 'Licitanet', 'BNC']), tem_jira: String(r() < .05)
      };
      linhas.push(c);
      casos[id] = {
        ...c, ticket_ids: '|' + id + (nt > 1 ? '|' + (id + '1') : '') + '|', resumo: 'Resumo fictício do caso.', solucao_aplicada: 'Solução fictícia.', acoes_realizadas: '|conferiu o acesso|orientou o cliente|',
        pontos_contexto: '|exemplo|ficticio|', servico_completo: '3. Disputar >> Exemplo >> ' + top, equipes: nt > 1 ? '|Customer Service - N1|Customer Service - N2|' : '|Customer Service - N1|', criado_em: new Date(ref - 36e5).toISOString()
      };
      tickets[id] = [{ ticket_id: id, caso_id: id, papel: 'raiz', equipe: 'Customer Service - N1', status_movidesk: 'Resolved', assunto: 'Assunto fictício', servico_completo: casos[id].servico_completo, criado_em: casos[id].criado_em, resolvido_em: c.data_referencia }];
      if (nt > 1) tickets[id].push({ ticket_id: id + '1', caso_id: id, papel: 'filho', ticket_pai_id: id, equipe: 'Customer Service - N2', status_movidesk: 'Closed', assunto: 'Escalação fictícia', criado_em: c.data_referencia });
    }
  }
  const cols = Object.keys(linhas[0]);
  return {
    dados: {
      ok: true, consumidor: 'demonstração', ultimo_caso: linhas[linhas.length - 1].data_referencia, gerado_em: new Date().toISOString(), casos: { colunas: cols, linhas: linhas.map(l => cols.map(k => l[k])) },
      consolidado: [], execucoes: [], topicos: { total: 14, sugeridos: 0, unificados: 0 }
    }, casos, tickets
  };
}
