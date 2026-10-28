import { Request, Response } from "express";
import * as PlantaRepository from "@repositories/PlantaRepository";
import {
  DadosPlanta,
  lerId,
  validarFiltros,
  validarPlanta,
  validarQuantidade,
} from "@validators/PlantaValidator";

// Respostas que se repetem em vários handlers
const idInvalido = (res: Response) =>
  res.status(400).json({ message: "O id deve ser um número inteiro maior que zero." });

const plantaNaoEncontrada = (res: Response) =>
  res.status(404).json({ message: "Planta não encontrada." });

export const createPlanta = async (req: Request, res: Response) => {
  try {
    // No cadastro, todos os campos são obrigatórios
    const validacao = validarPlanta(req.body, true);

    if (validacao.erro !== undefined) {
      return res.status(400).json({ message: validacao.erro });
    }

    // Como todos os campos são obrigatórios aqui, o validador garante que vieram todos.
    // Ele só devolve os campos da planta, então não passamos o req.body inteiro.
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } =
      validacao.dados as DadosPlanta;

    const planta = await PlantaRepository.createPlanta({
      nome: nome,
      especie: especie,
      preco: preco,
      estoque: estoque,
      luminosidade: luminosidade,
      petFriendly: petFriendly,
      regaACadaDias: regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao criar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    const validacao = validarFiltros(req.query);

    if (validacao.erro !== undefined) {
      return res.status(400).json({ message: validacao.erro });
    }

    // Filtro válido sem resultado é 200 com [], nunca 404
    const plantas = await PlantaRepository.findAllPlantas(validacao.dados);

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};

export const readPlantasEsgotadas = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPlantasEsgotadas();

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas esgotadas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);

    if (id === null) {
      return idInvalido(res);
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return plantaNaoEncontrada(res);
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);

    if (id === null) {
      return idInvalido(res);
    }

    // Na edição nenhum campo é obrigatório, mas os enviados seguem as mesmas regras
    const validacao = validarPlanta(req.body, false);

    if (validacao.erro !== undefined) {
      return res.status(400).json({ message: validacao.erro });
    }

    // Antes de editar, garantimos que a planta existe
    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return plantaNaoEncontrada(res);
    }

    const updatedPlanta = await PlantaRepository.updatePlanta(id, validacao.dados);

    return res.status(200).json(updatedPlanta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);

    if (id === null) {
      return idInvalido(res);
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return plantaNaoEncontrada(res);
    }

    await PlantaRepository.deletePlanta(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};

export const sellPlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);

    if (id === null) {
      return idInvalido(res);
    }

    const quantidade = req.body?.quantidade;
    const erroQuantidade = validarQuantidade(quantidade);

    if (erroQuantidade) {
      return res.status(400).json({ message: erroQuantidade });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return plantaNaoEncontrada(res);
    }

    // Sem estoque suficiente: 400 e nada é alterado
    if (planta.estoque < quantidade) {
      return res.status(400).json({
        message: `Temos só ${planta.estoque} vasos.`,
      });
    }

    const updatedPlanta = await PlantaRepository.sellPlanta(id, quantidade);

    // Outra compra levou os vasos entre a conferência acima e a venda
    if (!updatedPlanta) {
      return res.status(400).json({
        message: "Estoque insuficiente: outra venda acabou de acontecer.",
      });
    }

    return res.status(200).json(updatedPlanta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao vender planta." });
  }
};

export const readValorTotalDoEstoque = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPrecoEEstoqueDeTodas();

    // O aggregate do Prisma não multiplica preco × estoque, então a conta é feita aqui
    let valorTotalEmCentavos = 0;
    let totalDeVasos = 0;

    for (const planta of plantas) {
      valorTotalEmCentavos += planta.preco * planta.estoque;
      totalDeVasos += planta.estoque;
    }

    return res.status(200).json({ valorTotalEmCentavos, totalDeVasos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao calcular o valor do estoque." });
  }
};
