import { Luminosidade, Prisma } from "@prisma/client";
import prisma from "@database";

export type FiltrosPlanta = {
    luminosidade?: Luminosidade;
    petFriendly?: boolean;
    nome?: string;
    ordem?: "preco" | "nome";
};

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};

// Valores undefined são ignorados pelo Prisma, então esta única consulta
// atende todas as combinações de filtros.
export const findAllPlantas = async (filtros: FiltrosPlanta) => {
    return await prisma.planta.findMany({
        where: {
            luminosidade: filtros.luminosidade,
            petFriendly: filtros.petFriendly,
            nome: filtros.nome === undefined ? undefined : { contains: filtros.nome, mode: "insensitive" },
        },
        orderBy: filtros.ordem ? { [filtros.ordem]: "asc" } : { id: "asc" },
    });
};

export const findPlantasEsgotadas = async () => {
    return await prisma.planta.findMany({
        where: { estoque: 0 },
        orderBy: { id: "asc" },
    });
};

export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id }
    });
};

export const findPrecoEEstoqueDeTodas = async () => {
    return await prisma.planta.findMany({
        select: { preco: true, estoque: true },
    });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id }
    });
};

// Diminui o estoque numa única operação do banco, e só se ainda houver vasos
// suficientes. Assim, duas compras do último vaso ao mesmo tempo não passam as
// duas: a segunda encontra o estoque zerado e a condição falha.
// Retorna a planta atualizada, ou null se a venda não aconteceu.
export const sellPlanta = async (id: number, quantidade: number) => {
    const [resultado, planta] = await prisma.$transaction([
        prisma.planta.updateMany({
            where: { id: id, estoque: { gte: quantidade } },
            data: { estoque: { decrement: quantidade } },
        }),
        prisma.planta.findUnique({ where: { id: id } }),
    ]);

    return resultado.count === 1 ? planta : null;
};
