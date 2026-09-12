import Link from "next/link";

export const metadata = {
    title: "Termos de Uso | Connect Finance",
    description: "Termos de Uso da plataforma Connect Finance.",
};

const TermsPage = () => {
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
                        Termos de Uso
                    </h1>

                    <p className="mt-4 text-sm text-zinc-500">
                        Última atualização: 11 de setembro de 2026
                    </p>
                </header>

                <div className="space-y-10 leading-7">
                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            1. Aceitação dos Termos
                        </h2>

                        <p>
                            Ao acessar ou utilizar o Connect Finance, você declara que leu,
                            compreendeu e concorda com estes Termos de Uso e com a nossa
                            Política de Privacidade.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            2. Sobre o serviço
                        </h2>

                        <p>
                            O Connect Finance é uma plataforma destinada à organização e ao
                            acompanhamento de informações financeiras pessoais, permitindo o
                            registro de receitas, despesas, transações, categorias,
                            indicadores, relatórios e outras funcionalidades relacionadas à
                            gestão financeira.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            3. Cadastro e acesso
                        </h2>

                        <p>
                            Algumas funcionalidades exigem a criação de uma conta. O usuário é
                            responsável por manter a segurança de suas credenciais e pelas
                            atividades realizadas em sua conta.
                        </p>

                        <p className="mt-4">
                            O acesso poderá ser realizado através de provedores externos de
                            autenticação, incluindo o Google.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            4. Responsabilidades do usuário
                        </h2>

                        <p className="mb-4">O usuário concorda em:</p>

                        <ul className="list-disc space-y-2 pl-6">
                            <li>fornecer informações corretas e atualizadas;</li>
                            <li>não utilizar a plataforma para atividades ilícitas;</li>
                            <li>não tentar obter acesso não autorizado ao sistema;</li>
                            <li>
                                não interferir na segurança ou funcionamento da plataforma;
                            </li>
                            <li>
                                utilizar o serviço em conformidade com a legislação aplicável.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            5. Informações financeiras
                        </h2>

                        <p>
                            As informações apresentadas pelo Connect Finance são destinadas à
                            organização financeira e possuem caráter informativo.
                        </p>

                        <p className="mt-4">
                            O Connect Finance não constitui instituição financeira,
                            consultoria de investimentos, escritório contábil ou serviço de
                            aconselhamento financeiro profissional.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            6. Recursos de Inteligência Artificial
                        </h2>

                        <p>
                            Algumas funcionalidades podem utilizar inteligência artificial
                            para gerar relatórios, classificações, análises ou sugestões.
                        </p>

                        <p className="mt-4">
                            Resultados gerados automaticamente podem conter imprecisões e
                            devem ser analisados pelo usuário antes de qualquer decisão
                            financeira.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            7. Planos e pagamentos
                        </h2>

                        <p>
                            Determinadas funcionalidades poderão estar disponíveis por meio de
                            planos pagos. Valores, recursos incluídos e condições de cobrança
                            serão apresentados antes da contratação.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            8. Disponibilidade do serviço
                        </h2>

                        <p>
                            Buscamos manter o Connect Finance disponível e funcionando
                            adequadamente, mas poderão ocorrer interrupções temporárias para
                            manutenção, atualização, falhas técnicas ou situações fora do
                            nosso controle.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            9. Propriedade intelectual
                        </h2>

                        <p>
                            O nome Connect Finance, sua identidade visual, software,
                            interfaces, conteúdos, funcionalidades e demais elementos da
                            plataforma são protegidos pela legislação aplicável.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            10. Suspensão e encerramento
                        </h2>

                        <p>
                            O acesso poderá ser suspenso ou encerrado em caso de violação
                            destes Termos, tentativa de fraude, abuso da plataforma,
                            comprometimento da segurança ou utilização ilegal.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            11. Limitação de responsabilidade
                        </h2>

                        <p>
                            O Connect Finance não se responsabiliza por decisões financeiras
                            tomadas exclusivamente com base em relatórios, análises,
                            indicadores ou sugestões disponibilizadas pela plataforma.
                        </p>

                        <p className="mt-4">
                            O usuário permanece responsável pela verificação das informações
                            cadastradas e pelas decisões tomadas a partir delas.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            12. Alterações dos Termos
                        </h2>

                        <p>
                            Estes Termos poderão ser atualizados periodicamente. A versão mais
                            recente estará sempre disponível nesta página.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            13. Legislação aplicável
                        </h2>

                        <p>
                            Estes Termos são regidos pelas leis da República Federativa do
                            Brasil.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold text-white">
                            14. Contato
                        </h2>

                        <p>
                            Para dúvidas relacionadas aos presentes Termos de Uso, entre em
                            contato com a equipe do Connect Finance.
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

export default TermsPage;