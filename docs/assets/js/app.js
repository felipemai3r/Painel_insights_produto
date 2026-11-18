'use strict';
// Entrada, saída, eventos e início da página (carrega por último).
/* =================== entrada, saída e eventos =================== */
function sair(msg) {
  lsSet(sessionStorage, 'tkt_token', null); lsSet(localStorage, 'tkt_token', null); S.token = ''; cacheLimpar();
  $('telaApp').hidden = true; $('telaLogin').hidden = false; $('btnAtualizar').hidden = true; $('btnSair').hidden = true;
  $('erroLogin').hidden = !msg; if (msg) $('erroLogin').textContent = msg;
  $('inToken').value = ''; $('inToken').focus();
}
$('formLogin').onsubmit = async e => {
  e.preventDefault();
  S.token = $('inToken').value.trim();
  const b = $('btnEntrar'); b.disabled = true; b.textContent = 'Entrando…'; $('erroLogin').hidden = true;
  try {
    await api('ping');
    lsSet($('inLembrar').checked ? localStorage : sessionStorage, 'tkt_token', S.token);
    carregar();
  } catch (err) { $('erroLogin').hidden = false; $('erroLogin').textContent = err.message; }
  finally { b.disabled = false; b.textContent = 'Entrar'; }
};
$('btnSair').onclick = () => sair('');
$('btnAtualizar').onclick = () => carregar();
$('selPeriodo').onchange = e => { S.periodo = e.target.value; S.topico = ''; S.limite = 25; renderTudo(); };
$('busca').oninput = e => { S.busca = e.target.value; S.limite = 25; renderCasos(); };
$('btnMais').onclick = () => { S.limite += 25; renderCasos(); };
function filtrosDoHash() {   // links com filtros: #escala=semana&periodo=2026-W45&etapa=disputar
  const H = new URLSearchParams(location.hash.slice(1));
  if (ESCALAS.some(e => e[0] === H.get('escala'))) S.escala = H.get('escala');
  if (H.get('periodo')) S.periodo = H.get('periodo');
  if (H.get('etapa')) S.etapa = H.get('etapa');
}
function abrirDoHash() { const H = new URLSearchParams(location.hash.slice(1)); if (H.get('tema')) aplicarTema(H.get('tema')); if (H.get('caso')) abrirCaso(H.get('caso')); }


/* =================== início =================== */
if (/(^|&)demo(&|$)/.test(location.hash.slice(1))) {
  const ex = gerarExemplo(); S.exemplo = ex; aplicarDados(ex.dados); S.fonte = 'exemplo';
  $('telaLogin').hidden = true; $('telaApp').hidden = false; filtrosDoHash(); renderTudo(); abrirDoHash();
} else {
  S.token = tokenSalvo();
  if (S.token) carregar(); else sair('');
}
