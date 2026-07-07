import { useState } from 'react';
import { transactionsAPI, budgetsAPI, savingsAPI, notificationsAPI } from '../../api/api';
import type { AnnualSummary } from '../../types';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const WA_LINK = 'https://wa.me/5577988023474?text=' + encodeURIComponent('Olá! Vim do app Planejix e preciso de ajuda.');

const SUGGESTIONS = [
  'Quanto gastei este mês?',
  'Vou fechar o mês no azul?',
  'Como estão meus orçamentos?',
  'Como criar uma transação?',
  'Falar com atendente',
];

/** Renderiza texto com links http(s) clicáveis */
function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-emerald-600 dark:text-emerald-400 break-all">
            {part.includes('wa.me') ? 'Abrir WhatsApp →' : part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

/** Remove acentos e normaliza para matching de intenções */
function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ── Contexto de dados (cache por sessão do chat) ────────────────────────────
interface DataCtx {
  summary: AnnualSummary;
  acc: { totalIncome: number; totalExpenses: number; totalBalance: number };
}

let ctxCache: DataCtx | null = null;

async function getCtx(): Promise<DataCtx> {
  if (ctxCache) return ctxCache;
  const now = new Date();
  const [summaryRes, accRes] = await Promise.all([
    transactionsAPI.getSummary(now.getFullYear(), now.getMonth() + 1),
    transactionsAPI.getAccumulated(),
  ]);
  ctxCache = { summary: summaryRes.data, acc: accRes.data };
  return ctxCache;
}

// ── Respostas de FAQ (produto) ──────────────────────────────────────────────
const FAQ: { test: (q: string) => boolean; answer: string }[] = [
  {
    test: (q) => /(como|onde|posso|da pra|consigo|quero)\b.*(criar|adicionar|registrar|lancar|nova?)\b.*(transacao|gasto|despesa|receita|entrada|saida)/.test(q) || /nova transacao/.test(q),
    answer: 'Para criar uma transação: toque no botão "Nova transação" no Dashboard ou na página Transações (ou no botão + flutuante no celular). Preencha tipo (entrada/saída), descrição, valor e data. Você também pode marcar como recorrente ou parcelada!',
  },
  {
    test: (q) => /recorrente|repete? todo mes|se repete|mensalidade|assinatura de|todo mes autom/.test(q) && !/cancelar/.test(q),
    answer: 'Transações recorrentes (aluguel, salário, assinaturas) são recriadas automaticamente todo mês. Ao criar ou editar uma transação, ative o botão "Recorrente". O sistema gera a cópia no início de cada mês.',
  },
  {
    test: (q) => /parcel/.test(q),
    answer: 'Para compras parceladas: ao criar a transação, ative "Parcelado" e informe o número de parcelas (2 a 48). O Planejix cria automaticamente uma transação para cada mês, com o valor dividido.',
  },
  {
    test: (q) => /(como|onde|posso)\b.*(editar|alterar|mudar|corrigir)\b.*(transacao|gasto|lancamento)/.test(q),
    answer: 'Para editar: vá na página Transações e toque no ícone de lápis ao lado da transação. Para excluir, use o ícone de lixeira (pede confirmação antes).',
  },
  {
    test: (q) => /(apagar|excluir|limpar|resetar|zerar)\b.*(mes|tudo|todas)/.test(q),
    answer: 'Para apagar todas as transações de um mês: na página Transações, selecione o mês no filtro e clique no botão vermelho "Apagar mês". Confirme e tudo daquele mês é removido — útil para recomeçar ou corrigir importações.',
  },
  {
    test: (q) => /(como|onde|posso)\b.*(criar|adicionar|nova?)\b.*categoria/.test(q) || /categoria personalizada/.test(q),
    answer: 'Para criar categorias: acesse a página Categorias no menu lateral, clique em "Nova categoria", escolha nome e cor. Suas transações podem ser classificadas por categoria para você ver para onde o dinheiro vai.',
  },
  {
    test: (q) => /(como|onde|posso).*(criar|definir|adicionar|configurar|fazer).*(orcamento|limite de gasto|meta de gasto)/.test(q),
    answer: 'Para definir orçamentos: vá em Orçamentos no menu, clique em "Nova meta", escolha a categoria e o valor máximo mensal ou anual. A barra de progresso fica verde, amarela (80%+) ou vermelha (estourou), e você recebe alertas no Dashboard.',
  },
  {
    test: (q) => /(como|onde|posso).*(criar|definir|adicionar|configurar|fazer).*(meta|objetivo|economia|poupanca)/.test(q) || /o que e (uma )?(caixinha|reserva de emergencia)/.test(q),
    answer: 'Para metas de economia: acesse Economias no menu, clique em "Nova meta", defina o objetivo (ex: viagem, reserva de emergência), o valor alvo e o prazo. Depois registre depósitos e acompanhe o progresso no círculo.',
  },
  {
    test: (q) => /excel|planilha|exportar|importar|csv|xlsx/.test(q),
    answer: 'Excel: na página Transações há o botão "Exportar Excel" (baixa tudo filtrado). Para importar, use a página Importar no menu — arraste sua planilha Excel/CSV, revise a pré-visualização e confirme. Prático para migrar de outra ferramenta!',
  },
  {
    test: (q) => /pdf|relatorio mensal|imprimir/.test(q),
    answer: 'O relatório em PDF é um recurso Pro: no Dashboard, clique no botão "PDF" para baixar o resumo do mês com gráficos e principais gastos. Assinantes Pro também recebem o relatório por e-mail todo mês.',
  },
  {
    test: (q) => /plano|preco|quanto custa|valor da assinatura|\bpro\b|premium|upgrade|assinar/.test(q) && !/cancelar/.test(q),
    answer: 'O Planejix Pro custa apenas R$ 4,90/mês e inclui tudo: transações e metas ilimitadas, dashboard completo com gráficos, relatório PDF mensal, lembretes de vencimento por e-mail e suporte prioritário. Para assinar, acesse a página Planos no menu. Pagamento seguro via Mercado Pago — sem fidelidade, cancele quando quiser.',
  },
  {
    test: (q) => /cancelar.*(assinatura|plano|pro)|como cancel/.test(q),
    answer: 'Para cancelar a assinatura: vá em Planos no menu e clique em "Cancelar assinatura". Sem multa, sem burocracia — o cancelamento é imediato e seus dados ficam preservados caso queira voltar.',
  },
  {
    test: (q) => /senha|esqueci|recuperar conta|redefinir/.test(q),
    answer: 'Esqueceu a senha? Na tela de login, clique em "Esqueceu a senha?", informe seu e-mail e você recebe um link de redefinição (válido por 1 hora). Por segurança, ao trocar a senha todas as sessões antigas são encerradas.',
  },
  {
    test: (q) => /tema|modo escuro|modo claro|dark|noturno/.test(q),
    answer: 'Para alternar entre tema claro e escuro: use o botão de sol/lua na barra lateral (ou no menu, no celular). Sua preferência fica salva.',
  },
  {
    test: (q) => /instalar|baixar o? ?app|celular|aplicativo|pwa|tela inicial/.test(q),
    answer: 'O Planejix funciona como aplicativo! No Android: menu do navegador → "Instalar app". No iPhone: botão compartilhar → "Adicionar à Tela de Início". Fica com ícone próprio, abre em tela cheia e funciona offline.',
  },
  {
    test: (q) => /lembrete|notificac|aviso|alerta.*(venc|conta)|sino/.test(q),
    answer: 'Lembretes de vencimento: o sino no topo mostra contas que vencem hoje ou em até 3 dias. Assinantes Pro também recebem esses lembretes por e-mail automaticamente. Basta cadastrar a despesa com a data de vencimento.',
  },
  {
    test: (q) => /lgpd|privacidade|meus dados|excluir.*conta|apagar.*conta|deletar.*conta/.test(q),
    answer: 'Seus dados são seus: na página Perfil você pode "Exportar meus dados" (baixa tudo em JSON) ou "Excluir minha conta" (remoção permanente e imediata, conforme LGPD). A política completa está em planejix.com.br/privacy.',
  },
  {
    test: (q) => /suporte|contato|atendimento|reclama|elogio|sugestao|feedback/.test(q),
    answer: `Nossa equipe atende pelo WhatsApp — respondemos rapidinho e adoramos ouvir sugestões! ${WA_LINK}`,
  },
  {
    test: (q) => /o que e o planejix|sobre o planejix|para que serve|quem criou|quem fez/.test(q),
    answer: 'O Planejix é uma carteira inteligente brasileira: você registra entradas e saídas, define orçamentos e metas, e o app mostra em gráficos claros para onde vai o seu dinheiro — com assistente, lembretes e relatórios. Criado pela Diephyz Corporation. 💚',
  },
  {
    test: (q) => /confiavel|golpe|posso confiar|e seguro pagar/.test(q),
    answer: 'Pode confiar! O pagamento é 100% processado pelo Mercado Pago (nunca vemos seu cartão), seus dados são criptografados, temos política de privacidade conforme a LGPD e reembolso em até 7 dias pelo Código de Defesa do Consumidor. Qualquer dúvida, fale com nosso atendimento humano.',
  },
  {
    test: (q) => /funciona offline|sem internet|fora do ar/.test(q),
    answer: 'O app instalado abre offline para consulta, mas registrar e sincronizar transações precisa de internet. Se o site parecer fora do ar, verifique sua conexão — e se persistir, avise nosso suporte no WhatsApp!',
  },
  {
    test: (q) => /esqueci (meu )?(usuario|login)|qual (meu|e o) usuario/.test(q),
    answer: 'Você pode entrar com o e-mail cadastrado no lugar do usuário! Na tela de login, digite seu e-mail e a senha. Se também esqueceu a senha, use o "Esqueceu a senha?".',
  },
  {
    test: (q) => /(mudar|alterar|trocar).*(e-?mail|nome)|atualizar (cadastro|perfil|dados)/.test(q),
    answer: 'Para atualizar nome ou e-mail: vá em Perfil no menu, edite os campos e clique em "Salvar alterações". O nome de usuário não pode ser alterado.',
  },
  {
    test: (q) => /fixo|variavel|subtipo|tipo de gasto|diferenca entre/.test(q),
    answer: 'Ao criar uma transação você escolhe o subtipo: Fixo (contas que se repetem com o mesmo valor, como aluguel), Variável (mercado, lazer — muda todo mês) e Outros. Isso ajuda os gráficos a mostrarem o peso de cada tipo no seu orçamento.',
  },
  {
    test: (q) => /nota fiscal|recibo|comprovante de pagamento/.test(q),
    answer: 'O comprovante do pagamento fica disponível no seu e-mail e na sua conta do Mercado Pago logo após a confirmação. Precisando de algo específico, chame nosso atendimento no WhatsApp.',
  },
  {
    test: (q) => /formas? de pagamento|como (posso )?pagar|aceita (cartao|pix|boleto)|meios de pagamento/.test(q),
    answer: 'Aceitamos duas formas: Cartão de crédito (assinatura de R$ 4,90/mês com renovação automática) e Pix (R$ 4,90 por 30 dias de acesso, aprovação na hora). Boleto não é aceito. Tudo via Mercado Pago, na página Planos.',
  },
  {
    test: (q) => /quanto tempo.*(libera|ativa)|paguei e nao (liberou|ativou)|pagamento (nao caiu|demorando)/.test(q),
    answer: `Pix libera em segundos e cartão na hora da aprovação — a tela de login verifica sozinha e destrava automaticamente. Se pagou e não liberou em 10 minutos, fale com a gente: ${WA_LINK}`,
  },
  {
    test: (q) => /renovar|renovacao|vence quando|ate quando.*(acesso|assinatura)|expira/.test(q),
    answer: 'Quem assina no cartão renova automaticamente todo mês, sem se preocupar. Quem paga via Pix tem 30 dias de acesso — avisamos por e-mail 3 dias antes de vencer, e renovar leva um minuto na página Planos.',
  },
  {
    test: (q) => /familia|conjuge|esposa|marido|compartilhar conta|mais de uma pessoa|multiusuario/.test(q),
    answer: 'Hoje cada conta é individual. Nada impede um casal de usar a mesma conta em dois celulares (mesmos login e senha), mas contas compartilhadas com perfis separados estão no nosso radar para o futuro!',
  },
  {
    test: (q) => /backup|perder (meus )?dados|se o site sair do ar|dados somem/.test(q),
    answer: 'Seus dados são salvos na nuvem com backup diário automático. Você também pode baixar tudo quando quiser em Perfil → "Exportar meus dados" (JSON) ou exportar as transações em Excel.',
  },
  {
    test: (q) => /reembolso|dinheiro de volta|estorno|me arrependi/.test(q),
    answer: `Você tem direito a reembolso integral em até 7 dias após a contratação, conforme o Código de Defesa do Consumidor. É só chamar nosso atendimento: ${WA_LINK}`,
  },
  {
    test: (q) => /como comecar|comecando|primeiros passos|por onde comeco|acabei de (entrar|assinar|criar)/.test(q),
    answer: 'Bem-vindo(a)! Sugestão de primeiros passos: 1️⃣ Registre suas transações do mês (botão "Nova transação") · 2️⃣ Crie orçamentos por categoria na página Orçamentos · 3️⃣ Defina uma meta de economia · 4️⃣ Acompanhe tudo no Dashboard. Em 5 minutos você já tem uma visão clara do seu dinheiro!',
  },
  {
    test: (q) => /\b(erro|bug|travou|travando|nao funciona|nao carrega|problema no app|deu ruim)\b/.test(q),
    answer: `Sinto muito por isso! Primeiro tente recarregar a página (ou fechar e abrir o app). Se continuar, me conte o que aconteceu pelo WhatsApp que resolvemos rápido: ${WA_LINK}`,
  },
  {
    test: (q) => /seguranca|seguro|criptograf|hackea|roubar|protegido/.test(q),
    answer: 'Segurança é prioridade: senhas criptografadas com bcrypt, conexão HTTPS, pagamentos processados pelo Mercado Pago (não guardamos dados de cartão), backups diários e conformidade com a LGPD. Seus dados financeiros nunca são vendidos ou compartilhados.',
  },
];

// ── Motor principal ─────────────────────────────────────────────────────────
async function processQuestion(question: string): Promise<string> {
  const q = norm(question);

  // Atendimento humano — prioridade máxima, nunca prende o cliente no robô
  if (/atendente|humano|pessoa de verdade|falar com (alguem|o suporte|voces|uma pessoa)|suporte humano|nao (esta|ta) ajudando|quero ajuda de verdade/.test(q)) {
    return `Claro! Nossa equipe atende pelo WhatsApp — normalmente respondemos em poucos minutos. ${WA_LINK}`;
  }

  // Saudações por período
  if (/^bom dia\b/.test(q)) {
    return 'Bom dia! ☀️ Começar o dia organizando as finanças é um ótimo sinal. Quer saber quanto gastou este mês, como estão seus orçamentos ou precisa de ajuda com alguma função?';
  }
  if (/^boa tarde\b/.test(q)) {
    return 'Boa tarde! 😊 Em que posso ajudar? Posso mostrar seus gastos, a previsão do mês, suas metas — ou explicar qualquer função do Planejix.';
  }
  if (/^boa noite\b/.test(q)) {
    return 'Boa noite! 🌙 Boa hora para revisar o dia. Quer ver quanto gastou, como está o orçamento ou tirar alguma dúvida sobre o app?';
  }
  if (/^(oi|ola|eai|opa|hey|hello|alo)\b/.test(q) && q.length < 25) {
    return 'Olá! Posso responder sobre seus gastos, receitas, orçamentos, metas e previsões — ou explicar como usar qualquer função do Planejix. Experimente: "Quanto gastei este mês?" ou "Como criar um orçamento?"';
  }

  // Cortesia e conversa
  if (/tudo bem|como (voce|vc) (esta|ta)|como vai/.test(q) && q.length < 35) {
    return 'Tudo ótimo por aqui, obrigado por perguntar! 😄 E as suas finanças, como estão? Posso dar uma olhada — pergunte "Como estão minhas finanças?"';
  }
  if (/quem (e|es) (voce|vc)|o que (e|es) voce|voce e um robo|voce e uma ia/.test(q)) {
    return 'Sou o assistente virtual do Planejix! Conheço seus dados financeiros (com todo sigilo) e sei tudo sobre o app. Se preferir falar com uma pessoa de verdade, é só pedir "quero falar com um atendente".';
  }
  if (/obrigad|valeu|show|top|perfeito|otimo|excelente|legal|massa/.test(q) && q.length < 30) {
    return 'De nada! Estou aqui sempre que precisar. 💚';
  }
  if (/^(kkk+|haha+|rsrs+|hehe+|😂|🤣)/.test(q)) {
    return '😄 Que bom te ver de bom humor! Finanças organizadas deixam qualquer um mais leve. Posso ajudar em algo?';
  }
  if (/^(tchau|ate mais|ate logo|falou|adeus|flw)\b/.test(q)) {
    return 'Até mais! 👋 Continue cuidando bem do seu dinheiro — estarei aqui quando precisar.';
  }
  if (/o que (voce|vc) (faz|sabe)|que perguntas|ajuda\b|comandos|como funciona (voce|o assistente)|menu/.test(q)) {
    return 'Posso ajudar com duas coisas: 📊 Seus dados — "Quanto gastei?", "Como estão meus orçamentos?", "Vou fechar o mês no azul?", "Quanto gastei com alimentação?" · ⚙️ Como usar o app — "Como criar transação recorrente?", "Como exportar para Excel?", "Quais são os planos?" · E se precisar, chame um atendente humano!';
  }

  // FAQ do produto (respostas estáticas, sem precisar de dados)
  for (const item of FAQ) {
    if (item.test(q)) return item.answer;
  }

  // Perguntas sobre dados
  try {
    const { summary: s, acc } = await getCtx();
    const { totalIncome, totalExpenses, balance } = s.annual;

    // Previsão de fim de mês
    if (/previsao|projec|vou fechar|fim do mes|final do mes|como vai terminar|vou conseguir/.test(q)) {
      const now = new Date();
      const day = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - day;
      if (totalExpenses === 0 && totalIncome === 0) {
        return 'Ainda não há transações este mês para fazer uma previsão. Registre suas movimentações e eu projeto como o mês vai fechar!';
      }
      const dailyAvg = totalExpenses / day;
      const projectedExpenses = totalExpenses + dailyAvg * daysLeft;
      const projectedBalance = totalIncome - projectedExpenses;
      return `Projeção para o fim do mês: no seu ritmo atual (${fmt(dailyAvg)}/dia em gastos), você deve fechar com ${fmt(projectedExpenses)} em despesas e saldo ${projectedBalance >= 0 ? 'positivo' : 'negativo'} de ${fmt(Math.abs(projectedBalance))}. ${projectedBalance >= 0 ? 'Está no caminho certo! 🎯' : 'Vale segurar os gastos variáveis nos próximos dias.'}`;
    }

    // Quanto posso gastar por dia até o fim do mês
    if (/quanto posso gastar|gastar por dia|sobra por dia|quanto (ainda )?tenho (para|pra) gastar/.test(q)) {
      const now = new Date();
      const daysLeft = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate());
      const remaining = totalIncome - totalExpenses;
      if (totalIncome === 0) return 'Ainda não há receitas registradas este mês, então não consigo calcular quanto sobra por dia. Registre suas entradas primeiro!';
      if (remaining <= 0) return `Este mês você já gastou ${fmt(totalExpenses)} de ${fmt(totalIncome)} de receita — o saldo está ${remaining < 0 ? 'negativo em ' + fmt(Math.abs(remaining)) : 'zerado'}. Melhor segurar os próximos gastos! 🛑`;
      return `Sobram ${fmt(remaining)} da sua receita este mês. Faltando ${daysLeft} dia(s), você pode gastar até ${fmt(remaining / daysLeft)}/dia para fechar no zero a zero — menos que isso, fecha no azul! 💪`;
    }

    // Orçamentos
    if (/orcamento|estourei|limite|passei d[oa]/.test(q)) {
      const now = new Date();
      const res = await budgetsAPI.getProgress(now.getFullYear(), now.getMonth() + 1);
      const budgets = res.data;
      if (budgets.length === 0) return 'Você ainda não tem orçamentos definidos. Crie na página Orçamentos: escolha uma categoria e um limite mensal — eu te aviso quando estiver perto de estourar!';
      const over = budgets.filter(b => (b.percent ?? 0) > 100);
      const warning = budgets.filter(b => (b.percent ?? 0) >= 80 && (b.percent ?? 0) <= 100);
      let resp = `Você tem ${budgets.length} orçamento(s). `;
      if (over.length > 0) resp += `🔴 Estourado(s): ${over.map(b => `${b.category_name || 'Geral'} (${(b.percent ?? 0).toFixed(0)}%)`).join(', ')}. `;
      if (warning.length > 0) resp += `🟡 Perto do limite: ${warning.map(b => `${b.category_name || 'Geral'} (${(b.percent ?? 0).toFixed(0)}%)`).join(', ')}. `;
      if (over.length === 0 && warning.length === 0) resp += '🟢 Todos dentro do limite. Parabéns pelo controle!';
      return resp;
    }

    // Metas de economia
    if (/minhas metas|meta de economia|poupanca|quanto falta|objetivo|caixinha/.test(q)) {
      const res = await savingsAPI.getAll();
      const goals = res.data;
      if (goals.length === 0) return 'Você ainda não tem metas de economia. Crie na página Economias — defina um objetivo e um valor, e acompanhe seu progresso!';
      const lines = goals.slice(0, 3).map(g => {
        const pct = g.target_amount > 0 ? ((g.current_amount / g.target_amount) * 100).toFixed(0) : '0';
        const falta = Math.max(0, g.target_amount - g.current_amount);
        return `${g.name}: ${pct}% (faltam ${fmt(falta)})`;
      });
      return `Suas metas de economia: ${lines.join(' · ')}${goals.length > 3 ? ` — e mais ${goals.length - 3}.` : ''}`;
    }

    // Próximos vencimentos
    if (/vencer|vencimento|contas? a pagar|proximas contas|boleto/.test(q)) {
      const res = await notificationsAPI.getUpcoming();
      const items = res.data;
      if (items.length === 0) return 'Nenhuma conta vencendo hoje ou nos próximos 3 dias. Tudo em dia! ✓';
      const lines = items.slice(0, 4).map(n => `${n.description} (${fmt(n.amount)}) ${n.type === 'due_today' ? 'vence HOJE' : 'em até 3 dias'}`);
      return `Atenção aos vencimentos: ${lines.join(' · ')}`;
    }

    // Gasto em categoria específica ("quanto gastei com alimentação")
    const catMatch = q.match(/(?:com|em|de|no|na)\s+([a-z ]{3,25})\s*\??$/);
    if (catMatch && /gast|despes|paguei/.test(q)) {
      const catName = catMatch[1].trim();
      const found = s.byCategoryMonth?.find(c => norm(c.name).includes(catName) || catName.includes(norm(c.name)));
      if (found) {
        const pct = totalExpenses > 0 ? ((found.value / totalExpenses) * 100).toFixed(0) : '0';
        return `Este mês você gastou ${fmt(found.value)} com ${found.name} — isso representa ${pct}% das suas despesas.`;
      }
      if (s.byCategoryMonth && s.byCategoryMonth.length > 0) {
        return `Não encontrei gastos em "${catName}" este mês. Suas categorias com gastos: ${s.byCategoryMonth.slice(0, 5).map(c => c.name).join(', ')}.`;
      }
    }

    // Maior gasto
    if (/maior gasto|mais gastei|mais caro|onde.*(vai|foi).*dinheiro/.test(q)) {
      const topCat = s.byCategoryMonth?.[0];
      if (topCat) {
        const pct = totalExpenses > 0 ? ((topCat.value / totalExpenses) * 100).toFixed(0) : '0';
        return `Seu maior gasto este mês é em ${topCat.name}: ${fmt(topCat.value)} (${pct}% do total). O maior valor individual foi ${fmt(s.largestExpense)}.`;
      }
      return `Seu maior gasto individual este mês foi ${fmt(s.largestExpense)}.`;
    }

    // Gastos gerais
    if (/gaste|gastos|despesa|saida|paguei/.test(q)) {
      const topCat = s.byCategoryMonth?.[0];
      let resp = `Este mês você gastou ${fmt(totalExpenses)} no total.`;
      if (topCat) resp += ` A categoria líder é ${topCat.name} (${fmt(topCat.value)}).`;
      if (s.previousMonth && s.previousMonth.totalExpenses > 0) {
        const pct = ((totalExpenses - s.previousMonth.totalExpenses) / s.previousMonth.totalExpenses) * 100;
        if (pct > 5) resp += ` Isso é ${pct.toFixed(0)}% a mais que o mês passado — atenção!`;
        else if (pct < -5) resp += ` Isso é ${Math.abs(pct).toFixed(0)}% a menos que o mês passado. Bom trabalho!`;
      }
      return resp;
    }

    // Economia / poupança
    if (/economi|poup|sobr|guardei/.test(q)) {
      if (balance > 0) {
        const rate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : '0';
        return `Você economizou ${fmt(balance)} este mês (${rate}% da receita). ${Number(rate) >= 20 ? 'Excelente taxa de poupança! 🏆' : 'A recomendação é poupar pelo menos 20% — você chega lá!'}`;
      }
      return `Este mês seu saldo está negativo em ${fmt(Math.abs(balance))}. Revise os gastos variáveis para voltar ao azul. Quer dicas? É só pedir!`;
    }

    // Receitas
    if (/receita|ganh|entrad|salario|recebi/.test(q)) {
      let resp = `Sua receita este mês é ${fmt(totalIncome)}.`;
      if (s.previousMonth && s.previousMonth.totalIncome > 0) {
        const pct = ((totalIncome - s.previousMonth.totalIncome) / s.previousMonth.totalIncome) * 100;
        if (Math.abs(pct) > 5) resp += ` ${pct > 0 ? 'Crescimento' : 'Redução'} de ${Math.abs(pct).toFixed(0)}% vs mês anterior.`;
      }
      return resp;
    }

    // Saldo / patrimônio
    if (/saldo|total|patrimonio|acumulad|quanto tenho/.test(q)) {
      return `Seu saldo total acumulado é ${fmt(acc.totalBalance)}. Este mês: receita ${fmt(totalIncome)}, despesa ${fmt(totalExpenses)}, saldo ${fmt(balance)}.`;
    }

    // Saúde financeira / resumo
    if (/financas|financeir|como estou|como esta|resumo|situacao/.test(q)) {
      const ratio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
      let health = '';
      if (ratio <= 50) health = 'Suas finanças estão excelentes! 🌟';
      else if (ratio <= 75) health = 'Suas finanças estão saudáveis.';
      else if (ratio <= 95) health = 'Atenção: seus gastos estão altos em relação à receita.';
      else health = 'Situação crítica: gastos no limite da receita.';
      return `${health} Receita: ${fmt(totalIncome)} · Despesas: ${fmt(totalExpenses)} · Saldo do mês: ${fmt(balance)} · Acumulado total: ${fmt(acc.totalBalance)}.`;
    }

    // Dicas
    if (/dica|sugest|conselho|melhorar|como economizar/.test(q)) {
      const tips = [];
      if (totalIncome > 0 && balance / totalIncome < 0.2) tips.push('Tente poupar pelo menos 20% da receita — automatize criando uma meta de economia.');
      const topCat = s.byCategoryMonth?.[0];
      if (topCat && totalExpenses > 0 && topCat.value / totalExpenses > 0.4) tips.push(`${topCat.name} concentra mais de 40% dos gastos — defina um orçamento para essa categoria.`);
      if (balance < 0) tips.push('Saldo negativo: priorize cortar gastos variáveis (lazer, delivery) antes dos fixos.');
      tips.push('Registre tudo, até o cafezinho — pequenos gastos somados revelam onde dá para economizar.');
      return tips.join(' ');
    }

    // Fallback com dados — nunca deixa sem resposta
    return `Hmm, não tenho certeza se entendi — mas aqui vai um resumo rápido: receita ${fmt(totalIncome)}, despesas ${fmt(totalExpenses)}, saldo ${fmt(balance)}. 💡 Experimente perguntar: "Quanto posso gastar por dia?", "Como estão meus orçamentos?", "Vou fechar o mês no azul?" — ou peça para falar com um atendente que nossa equipe te ajuda pelo WhatsApp!`;
  } catch {
    return `Não consegui acessar seus dados agora — verifique a conexão e tente de novo. Enquanto isso, respondo dúvidas sobre o app (planos, funções, pagamento) normalmente. E se preferir ajuda humana: ${WA_LINK}`;
  }
}

export default function FinanceAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Olá! Sou o assistente do Planejix. Pergunte sobre seus gastos, orçamentos e metas — ou como usar qualquer função do app!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    const answer = await processQuestion(q);
    setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col bg-white dark:bg-dark-900" style={{ maxHeight: '500px', border: '1px solid rgba(16,185,129,0.15)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-semibold text-white">Assistente Planejix</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '320px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' ? <LinkifiedText text={msg.text} /> : msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-dark-700 px-4 py-2 rounded-xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-dark-700">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte qualquer coisa..."
            className="flex-1 text-[13px] px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
