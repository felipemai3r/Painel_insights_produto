'use strict';
// Configuração: URL do webhook e chave da página. É o único arquivo a editar para trocar de ambiente.
/* =================== configuração =================== */
// Webhook do workflow "Produtos tkt - Leitura v1" (URL de produção).
const WEBHOOK = 'https://effecti.app.n8n.cloud/webhook/produtos-tkt-leitura';
// Chave da página, mandada no header X-Api-Key (credencial Header Auth do nó Webhook). Barra chamadas que não vêm desta página.
// Ela fica visível no código publicado: não é segredo, só filtro. O acesso de cada pessoa continua sendo o token individual.
const API_KEY = '36bbcb3a9aac99474d8c6a02e15d63';

// Cache do detalhe dos casos no navegador (cache.js): quantos dias vale e a versão.
// Aumente CACHE_VERSAO sempre que liberar coluna nova em colunas_expostas ou mudar o que o webhook devolve no detalhe;
// quem já tem cache perde o antigo na próxima visita e passa a ver a coluna nova.
const CACHE_DETALHE_DIAS = 5;
const CACHE_VERSAO = 1;
