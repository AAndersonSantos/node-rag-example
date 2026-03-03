// src/seed.ts

import { generateEmbedding } from "../embedding";
import { qdrant, COLLECTION_NAME } from "../qdrant";
import { chunkBySections } from "../chunker";
import { v4 as uuidv4 } from "uuid";

const DOCUMENT_ID = "tela_sentimentos_v1";

const fullText = `
    Produto: InnovTalk
    Tela: Sentimentos de contatos

    # ====================================================================
    VISÃO GERAL DA TELA

    ## Objetivo

    A tela Sentimentos de contatos permite analisar o sentimento das
    interações entre clientes e atendimentos utilizando classificação
    automática realizada pela IA do InnovTalk.

    ## O que o usuário pode fazer

    - Visualizar distribuição de sentimentos
    - Identificar contatos com interações positivas, neutras ou negativas
    - Investigar conversas específicas
    - Aplicar filtros globais e filtros por contato

    ## Origem dos dados

    Os dados são derivados das conversas analisadas automaticamente
    pela IA do InnovTalk.

    ## Unidade de análise

    A contagem é baseada em interações associadas às conversas dos contatos.

    ## Escopo da tela

    Esta tela possui caráter analítico e investigativo.
    Ela não altera diretamente o sentimento das conversas.

    # ====================================================================
    DEFINIÇÃO DE SENTIMENTOS

    ## Sentimento Positivo

    Classificado quando a conversa demonstra satisfação,
    sucesso no atendimento ou feedback favorável do cliente.

    Exemplos:

    - agradecimentos
    - elogios
    - confirmação de resolução
    - feedback positivo

    ---

    ## Sentimento Neutro

    Classificado quando a conversa possui caráter informativo,
    operacional ou transacional sem emoção clara.

    Exemplos:

    - envio de informações
    - confirmação de dados
    - dúvidas simples
    - atualizações de status

    Observação:
    Conversas neutras não indicam problema.

    ---

    ## Sentimento Negativo

    Classificado quando existem sinais de frustração,
    insatisfação ou problema não resolvido.

    Exemplos:

    - reclamações
    - insatisfação explícita
    - erros no atendimento
    - solicitações repetidas por falha anterior

    # ====================================================================
    VISÃO GERAL (CARDS SUPERIORES)

    ## Descrição

    A seção Visão Geral apresenta o total de interações classificadas
    por sentimento.

    ## Cards exibidos

    - Positivas
    - Neutras
    - Negativas

    ## Como os valores são calculados

    Os valores representam o total de interações dentro
    do período definido nos filtros globais.

    ## Impacto dos filtros

    Todos os números da Visão Geral respeitam os filtros globais aplicados.

    ## Atualização

    Os dados são atualizados após processamento das conversas pela IA.

    # ====================================================================
    FILTROS GLOBAIS

    Filtros globais afetam TODOS os dados exibidos na página.

    Impactam:

    - visão geral
    - lista de contatos
    - contadores de sentimentos
    - conversas exibidas

    ---

    ## Assistente

    Filtra conversas atendidas por um assistente específico.

    ---

    ## Agente

    Filtra interações realizadas por um agente humano específico.

    ---

    ## Período

    Define o intervalo de datas das interações analisadas.

    ---

    ## Integração Zappy

    Permite filtrar por:

    - conta integrada
    - usuário da integração
    - canal (ex: WhatsApp)

    ---

    ## Aplicar filtros

    Os filtros só entram em vigor após clicar em "Aplicar filtros".

    # ====================================================================
    LISTA E CARDS DE CONTATOS

    Cada card representa um contato analisado.

    ## Elementos exibidos

    - Nome ou identificador do contato
    - Contador de sentimentos:
        - positivo
        - neutro
        - negativo

    ## Origem dos valores

    Os números refletem interações dentro dos filtros globais ativos.

    ## Interação

    Ao clicar em um contato, o painel de detalhes das conversas é aberto.

    # ====================================================================
    FILTROS POR CONTATO

    Filtros por contato afetam apenas o painel de detalhes das conversas.

    Eles NÃO alteram:

    - totais da Visão Geral
    - contagem geral de contatos

    ---

    ## Filtro de Sentimento

    Mostra apenas conversas do contato com o sentimento selecionado.

    ---

    ## Filtro de Assistente

    Exibe apenas conversas conduzidas por determinado assistente.

    # ====================================================================
    PAINEL DETALHES DAS CONVERSAS

    Exibe informações detalhadas das conversas do contato selecionado.

    ## Informações exibidas

    - data da conversa
    - identificação do ticket
    - sentimento atribuído
    - resumo automático gerado pela IA

    ## Resumo da conversa

    O resumo é criado automaticamente com base na conversa completa.

    ## Ações disponíveis

    - Abrir conversa
    - Marcar como resolvido

    # ====================================================================
    CÁLCULO DO SENTIMENTO

    O sentimento é determinado pela IA do InnovTalk após análise
    do contexto completo da conversa.

    ## Quando ocorre

    Após processamento das mensagens da conversa.

    ## Atualização

    O sentimento pode ser recalculado caso novas mensagens sejam adicionadas.

    ## Importante

    O sentimento representa o contexto geral da conversa,
    não mensagens individuais isoladas.

    # ====================================================================
    LIMITAÇÕES CONHECIDAS

    - A análise de sentimento é automática e pode não captar sarcasmo.
    - Conversas muito curtas tendem a ser classificadas como neutras.
    - O sentimento não representa avaliação emocional absoluta do cliente.
    - Mudanças nos filtros podem alterar significativamente os totais.

    # ====================================================================
    PERGUNTAS FREQUENTES

    ## Por que tenho muitas conversas neutras?

    Conversas informativas ou operacionais normalmente são classificadas como neutras.

    ## Por que os números mudaram?

    Alterações nos filtros globais ou novas análises podem atualizar os totais.

    ## Por que um contato mostra zero positivas?

    Pode não haver interações positivas dentro do período filtrado.

    ## Filtros por contato alteram os totais?

    Não. Apenas filtram as conversas exibidas no painel lateral.

    ## O sentimento pode mudar?

    Sim. Caso novas mensagens sejam adicionadas e reprocessadas pela IA.

    # ====================================================================
    NAVEGAÇÃO NA INTERFACE

    ## Elementos principais

    - Buscar contatos: pesquisa por nome ou identificador.
    - Filtrar: abre painel de filtros globais.
    - Aplicar filtros: confirma filtros selecionados.
    - Dashboard: navega para visão analítica geral.
    - Personalizar IA: configura comportamento da IA.

    ## No painel de conversas

    - Abrir conversa: abre atendimento completo.
    - Marcar como resolvido: finaliza o ticket.

    ## Regra geral

    Todos os dados exibidos refletem os filtros globais ativos.
`;

async function seed() {
  const chunks = chunkBySections(fullText);

  console.log(`Total de chunks: ${chunks.length}`);

  const points = [];

  for (const [i, chunk] of chunks.entries()) {
    const chunk = chunks[i];

    if (!chunk) continue;

    const vector = await generateEmbedding(chunk);

    points.push({
      id: uuidv4(),
      vector,
      payload: {
        document_id: DOCUMENT_ID,
        chunk_index: i,
        content: chunk,
        tipo: "documentacao_sentimentos"
      }
    });

    console.log(`Chunk ${i} processado`);
  }

  await qdrant.upsert(COLLECTION_NAME, {
    points
  });

  console.log("Documento inserido com sucesso 🚀");
}

seed();