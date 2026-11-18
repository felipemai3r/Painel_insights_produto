'use strict';
// Constantes: etapas, escalas, medidas, meses.
/* =================== constantes =================== */
const ETAPAS = [['minha_effecti', 'Minha Effecti'], ['encontrar', 'Encontrar'], ['cadastrar', 'Cadastrar'], ['disputar', 'Disputar'], ['monitorar', 'Monitorar'], ['outros', 'Outros']];
const ETAPA_NOME = Object.fromEntries([...ETAPAS, ['todas', 'Todas as etapas'], ['app', 'App'], ['demandas_outras_areas', 'Demandas de outras áreas']]);
const ESCALAS = [['semana', 'Semana'], ['mes', 'Mês'], ['trimestre', 'Trimestre'], ['semestre', 'Semestre']];
const MEDIDAS = [['casos', 'Casos'], ['empresas', 'Empresas']];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const HOJE = new Date();
const N_CADENCIA = 8;
const TIPO = { simples: 'Ticket único', escalacao: 'Escalação', multiplos_pais: 'N2 com vários pais', agrupador: 'Agrupador' };

const S = { casos: [], porId: new Map(), detalhes: new Map(), consolidado: [], execucoes: [], meta: {}, fonte: '', escala: 'mes', periodo: '', medida: 'casos', etapa: 'disputar', topico: '', busca: '', limite: 25 };
