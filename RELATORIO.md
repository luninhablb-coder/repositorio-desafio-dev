# Relatório do desafio: Folhagem & Cia

## 1. O que foi feito

Fiz **tudo que era obrigatório**:

- As 7 rotas: cadastrar, listar (com os filtros de luminosidade e petFriendly), buscar, editar, remover, vender e ver o valor total do estoque.
- As 7 regras de negócio: campos obrigatórios, preço maior que zero, estoque que pode ser zero mas nunca negativo, luminosidade só com os 3 valores, 400 para dado inválido, 404 para id que não existe e venda que nunca deixa o estoque negativo.

Fiz também **todos os bônus**: busca por nome (`?nome=costela`), ordenação (`?ordem=preco` ou `?ordem=nome`), a rota `/plantas/esgotadas` e um seed com 6 plantas de exemplo (`yarn seed`).

Testei todos os casos da tabela de testes do desafio e mais alguns, e todos deram o resultado esperado. A documentação da API está em `DOCUMENTACAO.md`.

## 2. Como foi feito

Segui a ordem do desafio: model e migration, repository, controller, rotas, filtros, venda e valor total, com um commit por etapa. Antes de começar, li o CRUD de usuários que já existia, porque ele serviu de modelo.

As decisões principais:

- **Camadas separadas, como no CRUD de usuários.** A rota aponta para a função certa, o controller confere os dados e escolhe a resposta, e só o repository conversa com o banco. Cada arquivo tem um papel só.
- **Validação num arquivo próprio** (`src/validators/PlantaValidator.ts`), usado no cadastro e na edição, para as regras não ficarem diferentes entre um e outro.
- **Comparar com `undefined` em vez de `!campo`.** Em JavaScript, `0` e `false` contam como "vazio" nessa checagem, e isso recusaria por engano uma planta com estoque 0 ou petFriendly falso.
- **Só os 7 campos da planta chegam ao banco.** Qualquer campo extra enviado é ignorado.
- **Venda segura contra compras ao mesmo tempo.** Se duas pessoas comprassem o último vaso juntas, conferir o estoque e depois diminuir poderia deixá-lo negativo. Por isso o banco faz as duas coisas numa operação só: "diminua, mas só se ainda tiver vasos suficientes". Testei com 8 compras de 1 vaso ao mesmo tempo para uma planta com 5 vasos: 5 deram certo, 3 foram recusadas e o estoque terminou em 0.
- **O que o desafio não definia e eu decidi:** `PATCH` com corpo vazio retorna 400; números acima de 2.147.483.647 (o maior que cabe no banco) retornam 400 em vez de virar um erro 500; e filtros inválidos, como `?petFriendly=talvez` ou `?ordem=cor`, também retornam 400.

## 3. As principais dificuldades

A maior parte das dificuldades apareceu **para a IA**, não para mim, e ela foi resolvendo uma a uma:

- **Docker.** O comando `docker compose up -d --build` dava erro porque a instalação não tinha o plugin do Compose. A IA identificou o problema pela mensagem de erro e a solução foi instalar o Docker Desktop, que já traz o plugin.
- **Erros de tipo no TypeScript.** O `yarn typecheck` reclamou do retorno da validação, porque o TypeScript não entendia que, depois de checar o erro, os dados existiam. A IA precisou ajustar a forma de checar o resultado.
- **Ordem das rotas.** O Express usa a primeira rota que combina. Se `/plantas/esgotadas` ficasse depois de `/plantas/:id`, "esgotadas" seria tratado como um id. A IA deixou as rotas fixas antes e anotou um comentário no código.
- **Compras ao mesmo tempo.** A primeira ideia, conferir o estoque e depois diminuir, deixaria o estoque ficar negativo se duas pessoas comprassem o último vaso juntas. Foi preciso mudar para uma operação única no banco e testar com várias compras simultâneas.

Para mim, a dificuldade foi acompanhar tudo isso sem conhecer a área, e nem sempre eu sabia dizer se o que a IA fazia estava certo.

## 4. O uso de IA e a ajuda dos meus irmãos

Para ser sincera sobre como foi: **a solução foi feita com IA**, o Claude Code, da Anthropic. Ele escreveu o código e os documentos, seguindo o padrão do CRUD de usuários, e eu fui conduzindo, pedindo e lendo o que vinha. Como não sou da área de desenvolvimento, o código não saiu da minha mão.

O maior aprendizado foi ver **como é usar a IA para fazer algo fora da minha área e ainda assim chegar a um resultado interessante**. Mesmo sem saber programar, consegui entregar uma API funcionando, com as rotas, as regras e os bônus. Também tive a ajuda dos meus irmãos, que são desenvolvedores, para entender melhor como as coisas funcionam.

**Até onde consigo garantir que está certo:**

- Os testes da tabela do desafio (status e mensagem de cada resposta), a venda com várias compras ao mesmo tempo e o `yarn typecheck` foram rodados com a IA, com a API ligada a um banco PostgreSQL de teste. Todos deram o resultado esperado.
- Conferi o valor total na mão: 9990 × 10 + 4500 × 5 = 122.400 centavos e 15 vasos, igual ao que a API devolveu.
- Porém, como vim de outra área, **não consigo avaliar com segurança se tudo está 100% correto** nem se as decisões técnicas são as melhores. Confio nos testes e nas explicações, mas uma revisão de quem é da área seria bem-vinda.
