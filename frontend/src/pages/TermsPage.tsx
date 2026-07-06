export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-0 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Termos de Uso</h2>
        <p className="text-sm text-gray-400 mt-1">Última atualização: Junho de 2026</p>
      </div>

      <div className="card space-y-5 text-sm text-gray-300 leading-relaxed">
        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">1. Aceitação dos termos</h3>
          <p className="text-gray-400">Ao criar uma conta ou utilizar o Planejix, você concorda com estes Termos de Uso e com nossa Política de Privacidade. Se não concordar, não utilize o serviço.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">2. Descrição do serviço</h3>
          <p className="text-gray-400">O Planejix é uma plataforma de gestão financeira pessoal que permite registrar transações, definir metas de orçamento, acompanhar economia e gerar relatórios. O serviço é oferecido mediante assinatura mensal (Planejix Pro).</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">3. Conta do usuário</h3>
          <ul className="list-disc ml-5 space-y-1 text-gray-400">
            <li>Você é responsável por manter a confidencialidade da sua senha</li>
            <li>Deve fornecer informações verdadeiras no cadastro</li>
            <li>É responsável por todas as atividades em sua conta</li>
            <li>Deve notificar imediatamente qualquer uso não autorizado</li>
          </ul>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">4. Planos e pagamento</h3>
          <ul className="list-disc ml-5 space-y-1 text-gray-400">
            <li><strong className="text-gray-700 dark:text-gray-300">Planejix Pro:</strong> acesso completo à plataforma mediante assinatura mensal</li>
            <li>O pagamento é processado pelo Mercado Pago</li>
            <li>Preços podem ser alterados com aviso prévio de 30 dias</li>
            <li>O cancelamento pode ser feito a qualquer momento</li>
          </ul>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">5. Cancelamento e reembolso</h3>
          <ul className="list-disc ml-5 space-y-1 text-gray-400">
            <li>Você pode cancelar sua assinatura a qualquer momento</li>
            <li>O acesso continua até o fim do período pago</li>
            <li>Reembolso disponível em até 7 dias após a contratação (conforme CDC)</li>
            <li>Após o cancelamento, seus dados permanecem preservados e você pode reativar a assinatura quando quiser</li>
          </ul>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">6. Uso aceitável</h3>
          <p className="text-gray-400">Você concorda em não:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-400">
            <li>Usar o serviço para fins ilegais</li>
            <li>Tentar acessar contas de outros usuários</li>
            <li>Realizar engenharia reversa do sistema</li>
            <li>Sobrecarregar o servidor com requisições automatizadas</li>
          </ul>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">7. Limitação de responsabilidade</h3>
          <p className="text-gray-400">O Planejix é uma ferramenta de organização financeira pessoal e não constitui consultoria financeira, contábil ou tributária. As decisões financeiras são de exclusiva responsabilidade do usuário. O serviço é fornecido "como está", sem garantias de disponibilidade ininterrupta.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">8. Exclusão de conta</h3>
          <p className="text-gray-400">Você pode solicitar a exclusão completa da sua conta e dados a qualquer momento. A exclusão é irreversível e todos os dados serão removidos permanentemente.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">9. Alterações nos termos</h3>
          <p className="text-gray-400">Podemos atualizar estes termos periodicamente. Alterações significativas serão notificadas por e-mail ou aviso no aplicativo. O uso continuado após alterações constitui aceitação dos novos termos.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">10. Contato</h3>
          <p className="text-gray-400">Para dúvidas sobre estes termos:</p>
          <p className="mt-1 text-brand-500">jeffbonis@gmail.com</p>
        </section>
      </div>
    </div>
  );
}
