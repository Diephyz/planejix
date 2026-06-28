export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-0 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Política de Privacidade</h2>
        <p className="text-sm text-gray-400 mt-1">Última atualização: Junho de 2026</p>
      </div>

      <div className="card space-y-5 text-sm text-gray-300 leading-relaxed">
        <section>
          <h3 className="text-base font-semibold text-white mb-2">1. Informações que coletamos</h3>
          <p>O Planejix coleta apenas as informações necessárias para fornecer o serviço de gestão financeira pessoal:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-400">
            <li><strong className="text-gray-300">Dados de cadastro:</strong> nome, e-mail, nome de usuário e senha (armazenada com hash criptográfico bcrypt)</li>
            <li><strong className="text-gray-300">Dados financeiros:</strong> transações, categorias, metas e orçamentos que você registra voluntariamente</li>
            <li><strong className="text-gray-300">Dados de autenticação:</strong> tokens JWT para manter sua sessão ativa</li>
            <li><strong className="text-gray-300">Google OAuth:</strong> se optar por login com Google, recebemos apenas seu nome, e-mail e foto de perfil</li>
          </ul>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">2. Como usamos seus dados</h3>
          <ul className="list-disc ml-5 space-y-1 text-gray-400">
            <li>Fornecer e manter o serviço de gestão financeira</li>
            <li>Enviar lembretes de vencimento por e-mail (quando configurado)</li>
            <li>Gerar relatórios e insights sobre suas finanças</li>
            <li>Melhorar a experiência do usuário</li>
          </ul>
          <p className="mt-2 text-gray-400">Nós <strong className="text-white">nunca</strong> vendemos, compartilhamos ou cedemos seus dados pessoais ou financeiros a terceiros.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">3. Armazenamento e segurança</h3>
          <ul className="list-disc ml-5 space-y-1 text-gray-400">
            <li>Senhas criptografadas com bcrypt (hash irreversível)</li>
            <li>Comunicação protegida por HTTPS/SSL</li>
            <li>Headers de segurança via Helmet.js</li>
            <li>Rate limiting para proteção contra ataques</li>
            <li>Dados armazenados em servidor na Oracle Cloud (São Paulo)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">4. Seus direitos (LGPD)</h3>
          <p>De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-400">
            <li><strong className="text-gray-300">Acesso:</strong> solicitar uma cópia de todos os seus dados pessoais</li>
            <li><strong className="text-gray-300">Correção:</strong> atualizar dados incorretos ou incompletos</li>
            <li><strong className="text-gray-300">Exclusão:</strong> solicitar a remoção completa dos seus dados</li>
            <li><strong className="text-gray-300">Portabilidade:</strong> exportar seus dados em formato Excel</li>
            <li><strong className="text-gray-300">Revogação:</strong> retirar o consentimento a qualquer momento</li>
          </ul>
          <p className="mt-2 text-gray-400">Para exercer qualquer desses direitos, entre em contato pelo e-mail abaixo.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">5. Cookies e armazenamento local</h3>
          <p className="text-gray-400">Utilizamos localStorage para armazenar:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-400">
            <li>Token de autenticação (para manter o login)</li>
            <li>Preferência de tema (claro/escuro)</li>
            <li>Dados de onboarding</li>
          </ul>
          <p className="mt-2 text-gray-400">Não utilizamos cookies de rastreamento ou publicidade.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">6. Retenção de dados</h3>
          <p className="text-gray-400">Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar exclusão, todos os dados são removidos permanentemente em até 30 dias.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">7. Contato</h3>
          <p className="text-gray-400">Para dúvidas sobre privacidade ou exercer seus direitos LGPD:</p>
          <p className="mt-1 text-brand-500">jeffbonis@gmail.com</p>
        </section>
      </div>
    </div>
  );
}
