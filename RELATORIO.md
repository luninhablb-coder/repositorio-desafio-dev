# Relatório do desafio: Folhagem & Cia

## 1. O que foi feito

Fiz **tudo que era obrigatório**:

- As 7 rotas: cadastrar, listar (com os filtros de luminosidade e petFriendly, juntos ou separados), buscar, editar, remover, vender e ver o valor total do estoque.
- As 7 regras de negócio: todos os campos obrigatórios no cadastro, preço maior que zero, estoque que pode ser zero mas nunca negativo, luminosidade só com os 3 valores, 400 para dado inválido, 404 para id que não existe, e venda que nunca deixa o estoque negativo.

Fiz também **todos os bônus**: busca por nome sem diferenciar maiúsculas (`?nome=costela`), ordenação (`?ordem=preco` ou `?ordem=nome`), a rota `/plantas/esgotadas` e um seed com 6 plantas de exemplo (`yarn seed`).

**Não ficou nada de fora.** Testei todos os casos da tabela de testes do desafio e mais alguns, e todos deram o resultado esperado. Também escrevi o documento da API em `DOCUMENTACAO.md`.

## 2. Como foi feito

Segui a ordem do desafio: primeiro o model e a migration, depois o repository, o controller, as rotas, os filtros, a venda e o valor total, com um commit por etapa. Antes de começar, li o CRUD de usuários que já existia, porque ele era o modelo.

As decisões principais e o porquê:

- **Camadas separadas, como no CRUD de usuários.** A rota só aponta para a função certa, o controller confere os dados e escolhe a resposta, e só o repository conversa com o banco. Assim cada arquivo tem um papel só e fica fácil achar as coisas.
- **As regras de validação ficam num arquivo próprio** (`src/validators/PlantaValidator.ts`), usado tanto no cadastro quanto na edição. A diferença entre os dois é só uma: no cadastro faltar campo é erro, na edição não. Escrevendo as regras uma vez só, elas não saem diferentes entre um e outro.
- **Comparar com `undefined` em vez de usar `!campo`.** No JavaScript, `0` e `false` "contam como vazio" nessa checagem. Isso recusaria por engano uma planta com estoque 0 ou petFriendly falso, que são valores válidos.
- **O body da requisição não vai direto para o banco.** Só os 7 campos da planta passam; qualquer coisa a mais que alguém mande é ignorada.
- **Venda segura contra compras ao mesmo tempo.** O desafio perguntava o que acontece se duas pessoas comprarem o último vaso juntas. Se eu só conferisse o estoque e depois diminuísse, as duas poderiam passar na conferência e o estoque ficaria negativo. Por isso o banco faz a conferência e a diminuição **numa operação só**: "diminua, mas só se ainda tiver vasos suficientes". Quem chegar depois recebe 400. Testei com 8 compras de 1 vaso disparadas ao mesmo tempo para uma planta com 5 vasos: 5 deram certo, 3 foram recusadas e o estoque terminou em 0.
- **Coisas que o desafio não definia e que eu decidi:**
  - `PATCH` com corpo vazio retorna 400, porque não há nada para editar.
  - Números maiores que 2.147.483.647 retornam 400. É o maior número que cabe no banco; sem essa checagem o erro viraria um 500, que seria o status errado.
  - Os filtros também são validados: `?petFriendly=talvez` e `?ordem=cor` retornam 400.

## 3. As principais dificuldades

- **Entender o que eu não conhecia.** Eu não sou desenvolvedora, então vários conceitos eram novos: o que é uma API, o que faz cada camada, o que é uma migration, o que significam os status HTTP (200, 201, 400, 404, 500). Essa foi a maior dificuldade e conto como lidei com ela na seção sobre IA.
- **Docker.** No começo, o comando `docker compose up -d --build` dava erro (`unknown shorthand flag: 'd'`). O problema era que a minha instalação do Docker não tinha o plugin do Compose, que é o que faz o comando `docker compose` existir. Percebi pela mensagem de erro e por `docker compose version` não funcionar, e resolvi instalando o Docker Desktop, que já traz o plugin.
- **Erros de tipo no TypeScript.** O `yarn typecheck` reclamou do retorno da validação, porque o TypeScript não entendia que, depois de checar o erro, os dados existiam. Resolvi ajustando a forma de checar o resultado.
- **Ordem das rotas.** O Express usa a primeira rota que combina. Se `/plantas/esgotadas` ficasse depois de `/plantas/:id`, a palavra "esgotadas" seria tratada como um id. Deixei as rotas fixas antes e deixei um comentário no código explicando.

## 4. O uso de IA

**Usei IA sim**: o Claude Code, da Anthropic. Usei de duas formas:

1. **Para gerar o código.** Ele escreveu a maior parte do código e dos documentos a partir do enunciado, seguindo o padrão do CRUD de usuários que já existia no repositório.
2. **Para entender as partes técnicas.** Como não sou desenvolvedora, usei a IA como professora: pedi explicações em linguagem simples sobre o que cada parte faz e por que foi feita daquele jeito (por exemplo, por que o preço fica em centavos, por que o `id` chega como texto e precisa ser convertido, o que é uma migration, e por que o problema das compras simultâneas acontece e como a solução resolve).

Como conferi o que ela entregou:

- Ligamos a API e testei **todos os casos da tabela de testes do desafio**, olhando o status e a mensagem de cada resposta. Os testes foram feitos com a API ligada a um banco PostgreSQL de teste.
- Conferi a conta do valor total na mão: 9990 × 10 + 4500 × 5 = 122.400 centavos e 15 vasos, igual ao que a API devolveu.
- Testei a venda com várias compras ao mesmo tempo, para ver se o estoque ficava seguro.
- Rodei o `yarn typecheck` (que passou sem erros) e procurei imports sem uso e `console.log` esquecidos. O único `console.error` que existe fica dentro dos `catch`, igual ao que já havia no CRUD de usuários.

O que aprendi: o caminho de uma requisição (rota → controller → repository → banco) e por que ele é dividido assim; por que não se valida com `!campo` quando 0 e `false` são valores válidos; por que dinheiro fica em centavos; e que a forma segura de evitar estoque negativo é deixar o próprio banco fazer a conta e a conferência na mesma operação.

Sei que usar IA não é proibido, mas que preciso saber explicar o que entreguei. Por isso li o código com as explicações da IA ao lado e estou disponível para explicar qualquer parte nas próximas etapas.
