'use strict';
// Tooltip e tema claro/escuro.
/* =================== tooltip =================== */
const tip = $('tip');
document.addEventListener('pointerover', e => { const el = e.target.closest('[data-tip]'); if (!el) return; tip.textContent = el.dataset.tip; tip.classList.add('on'); });
document.addEventListener('pointermove', e => { if (!tip.classList.contains('on')) return; const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 12, y = e.clientY - h - 12; if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y < 8) y = e.clientY + 16; tip.style.left = x + 'px'; tip.style.top = y + 'px'; });
document.addEventListener('pointerout', e => { const el = e.target.closest('[data-tip]'); if (el && !el.contains(e.relatedTarget)) tip.classList.remove('on'); });

/* =================== tema =================== */
function aplicarTema(t) {
  document.documentElement.setAttribute('data-theme', t);
  $('btnTema').innerHTML = '<svg class="ico"><use href="#i-' + (t === 'dark' ? 'sun' : 'moon') + '"/></svg>';
  lsSet(localStorage, 'tema', t);
}
aplicarTema(lsGet(localStorage, 'tema') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
$('btnTema').onclick = () => aplicarTema(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
