'use strict';
// Contagem: casos, empresas, ranking de tópicos e portais.
/* =================== contagem =================== */
const empresaDe = c => c.empresa_codigo || c.empresa_nome;
function medir(cs) { return S.medida === 'empresas' ? new Set(cs.map(empresaDe).filter(Boolean)).size : cs.length; }
const doPeriodo = rot => S.casos.filter(c => c[S.escala] === rot);
const daEtapa = (cs, e) => e === 'todas' ? cs : cs.filter(c => c.etapas.includes(e));
const noRanking = cs => cs.filter(c => c.tipo_caso !== 'multiplos_pais');   // D42: o N2 com vários pais não conta no Top 5
// portais do conjunto de casos, do mais frequente para o menos (casos sem portal ficam de fora)
function porPortal(cs) {
  const m = new Map();
  for (const c of cs) { const p = (c.portal || '').trim(); if (p) m.set(p, (m.get(p) || 0) + 1); }
  return [...m.entries()].map(([p, n]) => ({ p, n })).sort((a, b) => b.n - a.n || a.p.localeCompare(b.p));
}
const portaisTxt = (pp, k) => pp.slice(0, k).map(x => x.p + ' (' + x.n + ')').join(', ');
function porTopico(cs) {
  const m = new Map();
  for (const c of cs) { const k = c.topico || 'Sem tópico'; if (!m.has(k)) m.set(k, []); m.get(k).push(c); }
  return [...m.entries()].map(([t, l]) => ({ t, casos: l, v: medir(l), n: l.length, emp: new Set(l.map(empresaDe).filter(Boolean)).size, portais: porPortal(l) }))
    .sort((a, b) => b.v - a.v || b.n - a.n || a.t.localeCompare(b.t));
}
function deltaTxt(atual, ant) {
  if (ant === null || ant === undefined || !S.temAnt) return '';
  const d = atual - ant;
  if (d === 0) return '= período anterior';
  return (d > 0 ? '▲ +' : '▼ ') + fmt(d) + ' vs anterior';
}
const nomeMedida = () => S.medida === 'empresas' ? 'empresas' : 'casos';
const consDe = (escala, periodo, etapa) => S.consolidado.find(r => r.escala === escala && r.periodo === periodo && r.etapa === etapa) || null;
