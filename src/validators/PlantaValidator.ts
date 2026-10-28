import { Luminosidade } from "@prisma/client";
import { FiltrosPlanta } from "@repositories/PlantaRepository";

// Maior número que cabe numa coluna Int do PostgreSQL.
// Sem esse limite, um número gigante vira erro 500 em vez de 400.
const MAX_INT = 2147483647;

type DadosPlanta = {
  nome: string;
  especie: string;
  preco: number;
  estoque: number;
  luminosidade: Luminosidade;
  petFriendly: boolean;
  regaACadaDias: number;
};

// O resultado é sempre um erro (mensagem) ou os dados já validados.
type Resultado<T> = { erro: string; dados?: undefined } | { erro?: undefined; dados: T };

const inteiroEntre = (valor: unknown, minimo: number) =>
  Number.isInteger(valor) && (valor as number) >= minimo && (valor as number) <= MAX_INT;

const textoNaoVazio = (valor: unknown) =>
  typeof valor === "string" && valor.trim() !== "";

const luminosidadeValida = (valor: unknown) =>
  Object.values(Luminosidade).includes(valor as Luminosidade);

const MENSAGEM_LUMINOSIDADE = `luminosidade deve ser um destes valores: ${Object.values(Luminosidade).join(", ")}.`;

// Para cada campo da planta: como saber se o valor é válido e qual mensagem mostrar se não for.
const REGRAS: Record<keyof DadosPlanta, { valido: (valor: unknown) => boolean; mensagem: string }> = {
  nome: { valido: textoNaoVazio, mensagem: "nome deve ser um texto não vazio." },
  especie: { valido: textoNaoVazio, mensagem: "especie deve ser um texto não vazio." },
  preco: {
    valido: (valor) => inteiroEntre(valor, 1),
    mensagem: "preco deve ser um número inteiro maior que zero (em centavos).",
  },
  estoque: {
    valido: (valor) => inteiroEntre(valor, 0),
    mensagem: "estoque deve ser um número inteiro maior ou igual a zero.",
  },
  luminosidade: { valido: luminosidadeValida, mensagem: MENSAGEM_LUMINOSIDADE },
  petFriendly: {
    valido: (valor) => typeof valor === "boolean",
    mensagem: "petFriendly deve ser true ou false.",
  },
  regaACadaDias: {
    valido: (valor) => inteiroEntre(valor, 1),
    mensagem: "regaACadaDias deve ser um número inteiro maior ou igual a 1.",
  },
};

const CAMPOS = Object.keys(REGRAS) as (keyof DadosPlanta)[];

// Valida só os campos que foram enviados, então serve para o cadastro e para a edição:
// no cadastro (todosObrigatorios = true) faltar um campo é erro; na edição, não.
// Só os 7 campos da planta passam adiante: qualquer outra coisa no body é ignorada.
export const validarPlanta = (
  body: Record<string, unknown> | undefined,
  todosObrigatorios: boolean,
): Resultado<Partial<DadosPlanta>> => {
  const recebido = body ?? {};
  const dados: Record<string, unknown> = {};

  for (const campo of CAMPOS) {
    const valor = recebido[campo];

    if (valor === undefined) {
      if (todosObrigatorios) {
        return { erro: `O campo ${campo} é obrigatório.` };
      }
      continue;
    }

    if (!REGRAS[campo].valido(valor)) {
      return { erro: REGRAS[campo].mensagem };
    }

    dados[campo] = valor;
  }

  if (Object.keys(dados).length === 0) {
    return { erro: "Envie ao menos um campo da planta para editar." };
  }

  return { dados: dados as Partial<DadosPlanta> };
};

// O :id da rota chega como texto. Retorna null se não for um id válido.
export const lerId = (texto: string) => {
  const id = Number(texto);
  return Number.isInteger(id) && id > 0 && id <= MAX_INT ? id : null;
};

// Retorna a mensagem de erro, ou null se a quantidade é válida.
export const validarQuantidade = (quantidade: unknown) => {
  return inteiroEntre(quantidade, 1)
    ? null
    : "quantidade deve ser um número inteiro maior que zero.";
};

// Os filtros chegam em req.query e são sempre texto ("true", não true).
export const validarFiltros = (query: Record<string, unknown>): Resultado<FiltrosPlanta> => {
  const { luminosidade, petFriendly, nome, ordem } = query;
  const filtros: FiltrosPlanta = {};

  if (luminosidade !== undefined) {
    if (!luminosidadeValida(luminosidade)) {
      return { erro: MENSAGEM_LUMINOSIDADE };
    }
    filtros.luminosidade = luminosidade as Luminosidade;
  }

  if (petFriendly !== undefined) {
    if (petFriendly !== "true" && petFriendly !== "false") {
      return { erro: "O filtro petFriendly deve ser true ou false." };
    }
    filtros.petFriendly = petFriendly === "true";
  }

  if (nome !== undefined) {
    if (!textoNaoVazio(nome)) {
      return { erro: "O filtro nome deve ser um texto não vazio." };
    }
    filtros.nome = (nome as string).trim();
  }

  if (ordem !== undefined) {
    if (ordem !== "preco" && ordem !== "nome") {
      return { erro: "O filtro ordem deve ser preco ou nome." };
    }
    filtros.ordem = ordem;
  }

  return { dados: filtros };
};
