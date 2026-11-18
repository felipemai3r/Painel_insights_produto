'use strict';
// Cache local do detalhe dos casos (IndexedDB do navegador), para não chamar o webhook de novo a cada visita.
// Vale CACHE_DETALHE_DIAS dias (config.js). É apagado ao sair, ao trocar de token e quando CACHE_VERSAO muda.
// Se o navegador não permitir IndexedDB (janela privada, bloqueio), tudo aqui vira "sem cache" e a página funciona igual.
const CACHE_BANCO = 'tkt_detalhes';
let cacheBd = null, cacheDonoOk = '';
function cacheAbrir() {
  if (cacheBd) return cacheBd;
  cacheBd = new Promise(res => {
    try {
      const rq = indexedDB.open(CACHE_BANCO, 1);
      rq.onupgradeneeded = () => { rq.result.createObjectStore('casos'); rq.result.createObjectStore('meta'); };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = rq.onblocked = () => res(null);
    } catch (e) { res(null); }
  });
  return cacheBd;
}
// Marca de quem é o cache: derivada do token (sem guardar o token) mais a versão. Mudou = o cache antigo é descartado.
function cacheDono() { let h = 5381; for (const c of String(S.token || '')) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return h + ':' + CACHE_VERSAO; }
function cacheGarantirDono(bd) {
  const dono = cacheDono();
  if (cacheDonoOk === dono) return Promise.resolve();
  return new Promise(res => {
    try {
      const tx = bd.transaction(['meta', 'casos'], 'readwrite'), rq = tx.objectStore('meta').get('dono');
      rq.onsuccess = () => { if (rq.result !== dono) { tx.objectStore('casos').clear(); tx.objectStore('meta').put(dono, 'dono'); } };
      tx.oncomplete = () => { cacheDonoOk = dono; res(); };
      tx.onerror = tx.onabort = () => res();
    } catch (e) { res(); }
  });
}
// Devolve um Map caso_id -> { caso, tickets } só com o que está no cache e ainda vale.
async function cacheLer(ids) {
  const out = new Map(), bd = await cacheAbrir();
  if (!bd || !ids.length) return out;
  await cacheGarantirDono(bd);
  return new Promise(res => {
    try {
      const tx = bd.transaction('casos', 'readwrite'), st = tx.objectStore('casos'), limite = Date.now() - CACHE_DETALHE_DIAS * 864e5;
      for (const id of ids) {
        const rq = st.get(String(id));
        rq.onsuccess = () => { const r = rq.result; if (!r) return; if (r.t >= limite) out.set(String(id), r.d); else st.delete(String(id)); };
      }
      tx.oncomplete = () => res(out);
      tx.onerror = tx.onabort = () => res(out);
    } catch (e) { res(out); }
  });
}
// Guarda um Map caso_id -> { caso, tickets }.
async function cacheGravar(mapa) {
  const bd = await cacheAbrir();
  if (!bd || !mapa.size) return;
  await cacheGarantirDono(bd);
  return new Promise(res => {
    try {
      const tx = bd.transaction('casos', 'readwrite'), st = tx.objectStore('casos'), t = Date.now();
      for (const [id, d] of mapa) st.put({ t, d }, String(id));
      tx.oncomplete = tx.onerror = tx.onabort = () => res();
    } catch (e) { res(); }
  });
}
async function cacheLimpar() {
  cacheDonoOk = '';
  const bd = await cacheAbrir();
  if (!bd) return;
  return new Promise(res => {
    try {
      const tx = bd.transaction(['casos', 'meta'], 'readwrite');
      tx.objectStore('casos').clear(); tx.objectStore('meta').clear();
      tx.oncomplete = tx.onerror = tx.onabort = () => res();
    } catch (e) { res(); }
  });
}
