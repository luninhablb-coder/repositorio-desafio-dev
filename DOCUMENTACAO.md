# Documento da API: Folhagem & Cia

## Visão geral

API da loja de plantas Folhagem & Cia. Ela substitui a planilha de controle: cadastra plantas, controla o estoque, registra vendas (sem nunca deixar o estoque negativo) e calcula o valor total guardado em estoque.

**Stack:** Node.js · Express · TypeScript · Prisma · PostgreSQL · Docker

## Como rodar

Com o Docker Desktop aberto, na raiz do projeto:

```bash
cp .env.example .env     # no PowerShell: copy .env.example .env
yarn
docker compose up -d --build
yarn migration           # cria as tabelas
yarn seed                # (opcional) cadastra 6 plantas de exemplo
```

Abra http://localhost:3001: deve aparecer a mensagem da API. Para ver os erros: `docker compose logs -f server`. Para ver o banco: `yarn studio`.

## Modelo de dados

### Planta

| Campo | Tipo | Exemplo | Regra |
|---|---|---|---|
| `id` | Int | `1` | Gerado pelo banco |
| `nome` | texto | `"Costela-de-adão"` | Obrigatório, não pode ser vazio |
| `especie` | texto | `"Monstera deliciosa"` | Obrigatório, não pode ser vazio |
| `preco` | Int | `8990` | Em **centavos** (`8990` = R$ 89,90). Maior que zero |
| `estoque` | Int | `12` | Zero ou mais (zero = esgotada) |
| `luminosidade` | enum | `"MEIA_SOMBRA"` | Veja abaixo |
| `petFriendly` | boolean | `true` | `true` ou `false` |
| `regaACadaDias` | Int | `3` | 1 ou mais |
| `createdAt` / `updatedAt` | data | | Preenchidos automaticamente |

### Enum `Luminosidade`

`SOMBRA`, `MEIA_SOMBRA` ou `SOL_PLENO`.

> Números inteiros (`id`, `preco`, `estoque`, `regaACadaDias`) aceitam no máximo 2.147.483.647, o limite do banco. Acima disso a resposta é 400.

## Rotas

Todas as respostas são JSON. Erros têm o formato `{ "message": "..." }`.

### 1. `POST /plantas`: cadastra uma planta

Todos os 7 campos (`nome`, `especie`, `preco`, `estoque`, `luminosidade`, `petFriendly`, `regaACadaDias`) são obrigatórios. Campos extras são ignorados.

```json
{
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 3
}
```

**201:** a planta criada, com `id`, `createdAt` e `updatedAt`.
**400:** campo faltando ou inválido, por exemplo `{ "message": "O campo especie é obrigatório." }`.

### 2. `GET /plantas`: lista as plantas

Filtros opcionais, sozinhos ou juntos:

| Filtro | Valores | Exemplo |
|---|---|---|
| `luminosidade` | `SOMBRA`, `MEIA_SOMBRA`, `SOL_PLENO` | `/plantas?luminosidade=SOMBRA` |
| `petFriendly` | `true` ou `false` | `/plantas?petFriendly=true` |
| `nome` (bônus) | parte do nome, sem diferenciar maiúsculas | `/plantas?nome=costela` |
| `ordem` (bônus) | `preco` ou `nome` (sem `ordem`, vem por id) | `/plantas?ordem=preco` |

Exemplo juntando filtros: `/plantas?luminosidade=SOMBRA&petFriendly=true&ordem=nome`.

**200:** lista de plantas. Se nenhuma combinar com os filtros, a resposta é `[]` (nunca 404).
**400:** filtro com valor inválido, por exemplo `?luminosidade=LUA`.

### 3. `GET /plantas/esgotadas` (bônus): lista as plantas com estoque zero

**200:** lista de plantas (pode ser `[]`).

### 4. `GET /plantas/:id`: busca uma planta

**200:** a planta.
**400:** id que não é um número inteiro maior que zero (por exemplo `abc`).
**404:** `{ "message": "Planta não encontrada." }`.

### 5. `PATCH /plantas/:id`: edita só os campos enviados

Envie apenas o que vai mudar, por exemplo `{ "preco": 9990 }`. Os campos enviados seguem as mesmas regras do cadastro; os não enviados não mudam.

**200:** a planta atualizada.
**400:** id inválido, campo inválido ou corpo sem nenhum campo da planta.
**404:** o id não existe.

### 6. `DELETE /plantas/:id`: remove uma planta

**204:** removida, sem corpo na resposta.
**400:** id inválido.
**404:** o id não existe (inclusive ao deletar a mesma planta duas vezes).

### 7. `POST /plantas/:id/venda`: registra uma venda

```json
{ "quantidade": 2 }
```

`quantidade` deve ser um inteiro maior que zero.

**200:** a planta com o estoque já diminuído.
**400:** id ou quantidade inválidos, ou estoque insuficiente (`{ "message": "Temos só 10 vasos." }`). Nesse caso nada é alterado.
**404:** o id não existe.

### 8. `GET /plantas/estoque/valor-total`: valor total do estoque

Soma `preco × estoque` de todas as plantas e o total de vasos.

**200:**

```json
{ "valorTotalEmCentavos": 154300, "totalDeVasos": 37 }
```

Com a loja vazia, a resposta é `200` com os dois valores zerados.

## Erros e status HTTP

| Status | Quando acontece |
|---|---|
| `200` | Deu certo (consulta, edição, venda, valor total) |
| `201` | Planta cadastrada |
| `204` | Planta removida |
| `400` | Dados inválidos no cadastro, na edição, nos filtros ou na venda; id que não é número; estoque insuficiente; JSON quebrado no corpo da requisição |
| `404` | O id da planta não existe, ou a rota não existe |
| `500` | Erro inesperado do servidor |

## Decisões e bônus

- **Bônus feitos:** busca por nome sem diferenciar maiúsculas, ordenação por `preco` ou `nome`, rota `/plantas/esgotadas` e seed de exemplo (`yarn seed`).
- **Duas vendas ao mesmo tempo do último vaso:** o estoque é diminuído numa única operação do banco, com a condição "só se ainda houver vasos suficientes". A primeira compra leva o vaso; a segunda encontra estoque zero e recebe 400. Assim o estoque nunca fica negativo. Teste feito: 8 compras de 1 vaso disparadas juntas contra uma planta com 5 vasos resultaram em 5 vendas (200), 3 recusas (400) e estoque final 0.
- **Validação em um só lugar:** `src/validators/PlantaValidator.ts` tem as regras, usadas no cadastro e na edição, para não saírem diferentes.
- **Não definido no enunciado:** `PATCH` com corpo vazio retorna 400 (não há o que editar), e os filtros `petFriendly` e `ordem` também são validados (valor inválido retorna 400).
