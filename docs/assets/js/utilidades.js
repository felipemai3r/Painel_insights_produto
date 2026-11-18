'use strict';
// Utilidades de formatação e de DOM.
/* =================== utilidades =================== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n || 0).toLocaleString('pt-BR');
const pl = (n, um, varios) => fmt(n) + ' ' + (n === 1 ? um : varios);
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
const pad = n => String(n).padStart(2, '0');
const ddmm = d => pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1);
const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function lista(v) {
  if (Array.isArray(v)) return v;
  const s = String(v ?? '').trim();
  if (!s) return [];
  if (s.startsWith('[')) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map(String); } catch (e) { } }
  return s.split('|').map(x => x.trim()).filter(Boolean);
}
function bool(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (['true', 'verdadeiro', 'sim', '1'].includes(s)) return true;
  if (['false', 'falso', 'nao', 'não', '0'].includes(s)) return false;
  return null;
}
function dataDe(v) {
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(Math.round((v - 25569) * 864e5));
  if (v === '' || v == null) return null;
  const d = new Date(String(v)); return isNaN(d) ? null : d;
}
const BRT = { timeZone: 'America/Sao_Paulo' };
const dataBR = v => { const d = dataDe(v); return d ? d.toLocaleDateString('pt-BR', BRT) : ''; };
const dataHoraBR = v => { const d = dataDe(v); return d ? d.toLocaleDateString('pt-BR', BRT) + ' ' + d.toLocaleTimeString('pt-BR', { ...BRT, hour: '2-digit', minute: '2-digit' }) : ''; };
const lsGet = (st, k) => { try { return st.getItem(k); } catch (e) { return null; } };
const lsSet = (st, k, v) => { try { v === null ? st.removeItem(k) : st.setItem(k, v); } catch (e) { } };
