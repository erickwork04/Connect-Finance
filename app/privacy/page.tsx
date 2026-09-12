import Link from "next/link";

export const metadata = {
    title: "Política de Privacidade | Connect Finance",
    description:
        "Política de Privacidade da plataforma Connect Finance.",
};

const PrivacyPage = () => {
    return (
        <main className="min-h-screen bg-black text-zinc-300">
            <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
                <header className="mb-12 border-b border-zinc-800 pb-8">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center text-sm text-green-500 transition-colors hover:text-green-400"
                    >
                        ← Voltar para o Connect Finance
                    </Link>

                    <h1 className="text-3xl font-bold text-white sm:text-4xl">
                        Política de Privacidade
                    </h1>

                    <p className="mt-4 text-sm text-zinc-500">
                        Última atualização: 11 de setembro de 2026
                    </p>
                </header>

                <div className="space-y-10 leading-7">
                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            1. Sobre o Connect Finance
                        </h2>

                        <p>
                            O Connect Finance é uma plataforma de gestão financeira que
                            permite ao usuário organizar e acompanhar suas informações
                            financeiras, incluindo receitas, despesas, transações, categorias
                            e outros dados relacionados ao seu planejamento financeiro.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            2. Informações que coletamos
                        </h2>

                        <p className="mb-4">
                            Podemos coletar informações necessárias para o funcionamento da
                            plataforma, incluindo:
                        </p>

                        <ul className="list-disc space-y-2 pl-6">
                            <li>nome e endereço de e-mail;</li>
                            <li>identificador da conta do usuário;</li>
                            <li>informações utilizadas para autenticação;</li>
                            <li>dados de receitas e despesas cadastrados pelo usuário;</li>
                            <li>categorias e informações de transações financeiras;</li>
                            <li>
                                dados técnicos necessários para segurança e funcionamento da
                                aplicação.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            3. Login com Google
                        </h2>

                        <p>
                            O Connect Finance permite autenticação utilizando uma Conta
                            Google. Quando essa opção é utilizada, podemos receber informações
                            básicas disponibilizadas pelo Google, como nome, endereço de
                            e-mail, foto de perfil e identificador da conta.
                        </p>

                        <p className="mt-4">
                            Essas informações são utilizadas exclusivamente para
                            autenticação, identificação do usuário e funcionamento da sua
                            conta no Connect Finance.
                        </p>

                        <p className="mt-4">
                            O Connect Finance não solicita acesso ao conteúdo do Gmail,
                            Google Drive ou outros serviços privados da Conta Google por meio
                            do processo padrão de autenticação.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            4. Como utilizamos os dados
                        </h2>

                        <p className="mb-4">
                            Os dados coletados podem ser utilizados para:
                        </p>

                        <ul className="list-disc space-y-2 pl-6">
                            <li>criar e manter a conta do usuário;</li>
                            <li>realizar autenticação e controle de acesso;</li>
                            <li>fornecer as funcionalidades da plataforma;</li>
                            <li>processar e organizar os dados financeiros cadastrados;</li>
                            <li>gerar relatórios, indicadores e análises financeiras;</li>
                            <li>prevenir fraudes e acessos não autorizados;</li>
                            <li>melhorar a segurança e o desempenho da aplicação;</li>
                            <li>cumprir obrigações legais quando aplicável.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            5. Inteligência Artificial
                        </h2>

                        <p>
                            Algumas funcionalidades do Connect Finance podem utilizar
                            tecnologias de inteligência artificial para produzir análises,
                            relatórios, classificações ou sugestões com base nas informações
                            disponibilizadas pelo próprio usuário.
                        </p>

                        <p className="mt-4">
                            Essas funcionalidades têm caráter informativo e não substituem
                            orientação financeira, contábil, jurídica ou profissional.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            6. Compartilhamento de informações
                        </h2>

                        <p>
                            O Connect Finance não vende informações pessoais de seus usuários.
                            Dados poderão ser processados por prestadores de serviços
                            essenciais para o funcionamento da plataforma, como serviços de
                            autenticação, hospedagem, banco de dados, processamento de
                            pagamentos e infraestrutura tecnológica.
                        </p>

                        <p className="mt-4">
                            Esses serviços recebem somente as informações necessárias para
                            executar suas respectivas funções.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            7. Armazenamento e segurança
                        </h2>

                        <p>
                            São adotadas medidas técnicas e organizacionais destinadas a
                            proteger as informações contra acesso não autorizado, perda,
                            alteração, divulgação ou utilização indevida.
                        </p>

                        <p className="mt-4">
                            Apesar dessas medidas, nenhum sistema conectado à internet pode
                            garantir segurança absoluta.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            8. Retenção dos dados
                        </h2>

                        <p>
                            Os dados poderão ser mantidos enquanto a conta do usuário estiver
                            ativa ou pelo período necessário para fornecer os serviços,
                            cumprir obrigações legais, solucionar disputas e garantir a
                            segurança da plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            9. Direitos do usuário
                        </h2>

                        <p className="mb-4">
                            O usuário poderá solicitar, quando aplicável:
                        </p>

                        <ul className="list-disc space-y-2 pl-6">
                            <li>confirmação da existência de tratamento de dados;</li>
                            <li>acesso às informações pessoais;</li>
                            <li>correção de informações incorretas;</li>
                            <li>exclusão de informações pessoais;</li>
                            <li>informações sobre o tratamento realizado;</li>
                            <li>revogação de consentimentos aplicáveis.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            10. Exclusão da conta e dos dados
                        </h2>

                        <p>
                            O usuário poderá solicitar a exclusão de sua conta e dos dados
                            pessoais associados a ela. Algumas informações poderão ser
                            mantidas quando necessário para o cumprimento de obrigações
                            legais, fiscais, regulatórias ou de segurança.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            11. Cookies e tecnologias semelhantes
                        </h2>

                        <p>
                            O Connect Finance poderá utilizar cookies e tecnologias
                            semelhantes necessários para autenticação, manutenção da sessão,
                            segurança e funcionamento da aplicação.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            12. Alterações nesta Política
                        </h2>

                        <p>
                            Esta Política de Privacidade poderá ser atualizada periodicamente
                            para refletir alterações na plataforma, requisitos legais ou
                            práticas de segurança.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            13. Contato
                        </h2>

                        <p>
                            Caso tenha dúvidas sobre esta Política de Privacidade ou sobre o
                            tratamento de seus dados, entre em contato com a equipe do
                            Connect Finance.
                        </p>
                    </section>
                </div>

                <footer className="mt-16 border-t border-zinc-800 pt-8 text-sm text-zinc-500">
                    <p>© 2026 Connect Finance. Todos os direitos reservados.</p>

                    <div className="mt-3 flex gap-4">
                        <Link href="/privacy" className="hover:text-green-500">
                            Privacidade
                        </Link>

                        <Link href="/terms" className="hover:text-green-500">
                            Termos de Uso
                        </Link>
                    </div>
                </footer>
            </div>
        </main>
    );
};

export default PrivacyPage;