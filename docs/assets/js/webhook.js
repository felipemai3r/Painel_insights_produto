'use strict';
// Chamada ao webhook de leitura do n8n.
/* =================== webhook =================== */
const tokenSalvo = () => lsGet(sessionStorage, 'tkt_token') || lsGet(localStorage, 'tkt_token') || '';
const MSG = { token_invalido: 'Token não reconhecido.', token_inativo: 'Este token foi desativado.', token_expirado: 'Este token expirou.', acao_nao_permitida: 'Este token não tem permissão para esta ação.', sem_token: 'Informe o token.', caso_nao_encontrado: 'Caso não encontrado.' };
async function api(acao, extra) {
  let r;
  try { r = await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY }, body: JSON.stringify({ acao, token: S.token, ...(extra || {}) }) }); }
  catch (e) { throw new Error('Não deu para falar com o servidor (sem internet, workflow desativado ou chave da página recusada).'); }
  if (r.status === 401 || r.status === 403) throw new Error('O servidor recusou a chave desta página. Avise o Felipe.');
  if (!r.ok) throw new Error('O servidor respondeu ' + r.status + '.');
  const j = await r.json().catch(() => { throw new Error('Resposta do webhook não é JSON.'); });
  if (!j.ok) { const e = new Error(MSG[j.erro] || j.erro || 'erro desconhecido'); e.codigo = j.erro; throw e; }
  return j;
}
