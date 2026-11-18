'use strict';
// Períodos: rótulos, período anterior e lista de períodos disponíveis.
/* =================== períodos =================== */
function isoSemana(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dia = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - dia + 3);
  const ano = t.getUTCFullYear(); const j4 = new Date(Date.UTC(ano, 0, 4));
  return ano + '-W' + pad(1 + Math.round(((t - j4) / 864e5 - 3 + ((j4.getUTCDay() + 6) % 7)) / 7));
}
function segundaDa(rot) { const [a, w] = rot.split('-W').map(Number); const j4 = new Date(Date.UTC(a, 0, 4)); const m = new Date(j4); m.setUTCDate(j4.getUTCDate() - ((j4.getUTCDay() + 6) % 7) + (w - 1) * 7); return m; }
function rotulos(d) {
  const sp = new Date(d.getTime() - 3 * 36e5);
  const a = sp.getUTCFullYear(), m = sp.getUTCMonth() + 1;
  return { semana: isoSemana(sp), mes: a + '-' + pad(m), trimestre: a + '-T' + Math.ceil(m / 3), semestre: a + '-S' + (m <= 6 ? 1 : 2) };
}
function anterior(rot, e) {
  if (!rot) return '';
  if (e === 'semana') { const m = segundaDa(rot); m.setUTCDate(m.getUTCDate() - 7); return isoSemana(m); }
  const [a, r] = rot.split('-'); const ano = Number(a);
  if (e === 'mes') { const m = Number(r); return m === 1 ? (ano - 1) + '-12' : ano + '-' + pad(m - 1); }
  const n = Number(r.slice(1)), L = r[0], max = e === 'trimestre' ? 4 : 2;
  return n === 1 ? (ano - 1) + '-' + L + max : ano + '-' + L + (n - 1);
}
function nomePeriodo(rot, e) {
  if (!rot) return '';
  if (e === 'semana') { const m = segundaDa(rot), f = new Date(m); f.setUTCDate(m.getUTCDate() + 6); return 'Semana ' + Number(rot.split('-W')[1]) + ' · ' + ddmm(m) + ' a ' + ddmm(f) + '/' + f.getUTCFullYear(); }
  const [a, r] = rot.split('-');
  if (e === 'mes') return MESES[Number(r) - 1] + ' de ' + a;
  if (e === 'trimestre') return r.slice(1) + 'º trimestre de ' + a;
  return r.slice(1) + 'º semestre de ' + a;
}
function curtoPeriodo(rot, e) {
  const [a, r] = rot.split('-');
  if (e === 'semana') return 'S' + Number(rot.split('-W')[1]);
  if (e === 'mes') return MESES[Number(r) - 1].slice(0, 3) + (r === '01' ? '/' + a.slice(2) : '');
  return r + '/' + a.slice(2);
}
const emAndamento = rot => rotulos(HOJE)[S.escala] === rot;
