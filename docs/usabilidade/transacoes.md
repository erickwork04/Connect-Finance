# Transações

## Para que serve?

Aqui você consulta receitas, despesas e investimentos do mês escolhido, registra movimentações e localiza lançamentos já existentes. Os resumos e gráficos acompanham os filtros usados na própria página.

## Aba Compromissos

As abas **Transações** e **Compromissos** mantêm o mês escolhido na barra superior. Em Compromissos, **Adicionar compromisso** permite cadastrar uma obrigação não recorrente, com data específica, ou **Mensal**, com primeiro mês e dia de vencimento. Toda ocorrência começa pendente e cada mês tem status próprio. O cadastro mensal continua nos meses seguintes até que a recorrência seja encerrada.

Cada item mostra vencimento, valor, recorrência e status. **Confirmar compromisso** muda pendente para confirmado, sem registrar pagamento. **Editar compromisso** altera apenas o mês exibido; uma ocorrência paga mantém valor e vencimento. **Vincular despesa paga** exige uma despesa ainda não vinculada do mesmo mês e valor. O vínculo marca somente essa ocorrência como paga e não duplica a despesa no saldo.

**Excluir deste mês** pede confirmação e oculta apenas a ocorrência selecionada; uma transação vinculada permanece registrada. Para cadastros mensais novos, **Encerrar recorrência** interrompe os próximos meses pendentes. Se houver mês futuro confirmado ou pago, o sistema pede que ele seja revisado antes. Os cadastros antigos de 12 ocorrências permanecem preservados e são identificados como “Mensal · cadastro anterior”.

No celular, a lista usa cartões em uma coluna, com botões de toque amplos e diálogos de confirmação dentro da viewport. A validação em aparelho real com sessão autenticada ainda é necessária.

## Ao abrir a página

O cabeçalho **Transações** vem antes de quatro cartões: **Total Receita**, **Total Despesas**, **Total de Investimento** e **Saldo do Período**. Abaixo há busca, categoria, período e **Adicionar transação**. A lista mostra data, descrição, categoria, método, tipo, valor e ações. Ao lado, no computador, ficam **Resumo do período** (quantidade, ticket médio e maiores lançamentos), **Distribuição de despesas** e **Insights do período**. Os insights são frases calculadas dos lançamentos exibidos; não são um relatório de IA.

## Botões e ações

### Adicionar transação

No fim da faixa de filtros, abre um menu com três caminhos:

- **Adicionar manualmente:** abre o formulário. Preencha **Nome**, **Valor**, **Tipo** (receita, despesa ou investimento), **Categoria**, **Método de pagamento** e **Data**. Toque em **Adicionar** para salvar ou **Cancelar** para sair. O botão indica “Salvando...” durante o envio.
- **Importar extrato bancário:** abre a janela para selecionar um extrato OFX ou CSV.
- **Importar fatura do cartão:** abre a janela para selecionar uma fatura CSV.

O menu pode ficar desabilitado quando a franquia mensal do plano gratuito se esgotar. A importação também respeita o limite disponível do plano; o sistema avisa se a seleção exceder a franquia.

### Editar e Excluir

Cada linha da tabela e cada cartão no celular têm ícones próprios de lápis e lixeira, sem menu de três pontos. **Editar** abre o formulário com os dados atuais; altere o necessário e toque em **Atualizar** ou **Cancelar**. **Excluir** abre uma confirmação: **Cancelar** mantém a transação e **Continuar** solicita sua exclusão definitiva. A tela mostra uma mensagem de sucesso ou erro. Uma transação vinculada a um compromisso pago não pode ser editada nem excluída.

### Revisar uma importação

Na janela de importação, **Selecionar arquivo** abre a escolha do arquivo; você também pode arrastá-lo para a área indicada no computador. Arquivos acima de 5 MB são recusados. Depois do processamento, a prévia permite:

- Alternar entre **Todas**, **Novas**, **Duplicadas** e **Já importadas**, quando houver itens desses tipos.
- Marcar/desmarcar lançamentos individualmente ou usar **Marcar todas visíveis** / **Desmarcar visíveis**. Essas opções afetam a seleção da prévia.
- Ajustar a categoria sugerida de cada lançamento.
- Abrir **Ver duplicada** ou **Já importada** para comparar dados. **Ignorar (Não importar)** desmarca o item; **Importar mesmo assim** o marca.
- Usar **Voltar** para escolher outro arquivo ou **Importar selecionadas** para confirmar os itens marcados. O botão de confirmação fica desabilitado sem seleção ou durante o envio.

Ao final, a janela apresenta quantas foram importadas, ignoradas ou já existiam. **Concluir e ver dashboard** apenas fecha essa janela na versão atual; para abrir o Dashboard, use a barra superior.

## Campos e filtros

**Mês da barra superior:** determina quais transações entram inicialmente na página. A escolha permanece ao navegar.

**Buscar transações:** digite parte da descrição para reduzir a lista. A busca ignora diferenças entre maiúsculas e acentos.

**Todas as categorias:** escolha uma categoria para mostrar apenas lançamentos dela; selecione novamente **Todas as categorias** para limpar o filtro.

**Período:** escolha **Todo o mês**, **Últimos 7 dias**, **Últimos 15 dias** ou **Últimos 30 dias**. É um recorte dentro do mês escolhido no topo; não muda o mês global. Busca, categoria e período podem ser combinados. Os quatro totais e os três blocos de análise passam a refletir a lista filtrada.

## Fluxos comuns

### Registrar uma despesa

1. Escolha o mês na barra superior e abra **Adicionar transação**.
2. Selecione **Adicionar manualmente**.
3. Informe nome e valor; selecione **Despesa**, categoria, método e data.
4. Toque em **Adicionar** e aguarde a confirmação.
5. Consulte a lista do mês da data informada.

### Encontrar e corrigir um lançamento

1. Escolha o mês e digite parte do nome em **Buscar transações**.
2. Se necessário, restrinja por categoria ou período.
3. Toque no lápis do lançamento, ajuste os campos e toque em **Atualizar**.
4. Se a edição não for permitida, consulte a mensagem de erro antes de tentar outra ação.

### Importar um extrato sem duplicar lançamentos

1. Abra **Adicionar transação** e escolha **Importar extrato bancário**.
2. Use **Selecionar arquivo** e aguarde a prévia.
3. Confira as categorias e examine os avisos de duplicidade.
4. Marque somente o que deseja guardar e toque em **Importar selecionadas**.
5. Leia o resumo final. Feche a janela e confira o mês correspondente na lista.

## O que acontece depois?

Lançamentos salvos, editados, excluídos ou importados alteram os dados considerados nas próximas consultas do mês correspondente, inclusive no Dashboard. Importar uma fatura nessa janela cria movimentações selecionadas; isso não cadastra um cartão na página Cartões. Os filtros de busca, categoria e período só mudam a visualização desta página, sem alterar os registros.

## Estados da tela

Sem lançamentos no mês, aparece **Nenhuma transação neste mês**. Se houver lançamentos, mas nenhum combinar com os filtros, aparece uma mensagem específica de ausência de resultados. Sem despesas, a distribuição informa isso; com poucos dados, os insights dizem que não há informação suficiente. Formulários e importação exibem processamento e avisos de erro. A exclusão exige confirmação antes da ação definitiva.

## Uso no celular

A tabela vira uma lista de cartões com data, descrição, valor, categoria e ações de lápis/lixeira. Filtros e análises ficam empilhados; os blocos de resumo vêm depois da lista. A prévia da importação também usa cartões. **Há relato de botões sem resposta ao toque em aparelho real**; a interação precisa ser revalidada no dispositivo, mesmo que a tela apareça normalmente. Não trate a aparência da página como confirmação de que o toque está funcionando.
