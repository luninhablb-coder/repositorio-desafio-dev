import { Luminosidade, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plantas = [
  { nome: "Costela-de-adão", especie: "Monstera deliciosa", preco: 8990, estoque: 12, luminosidade: Luminosidade.MEIA_SOMBRA, petFriendly: false, regaACadaDias: 7 },
  { nome: "Samambaia", especie: "Nephrolepis exaltata", preco: 4500, estoque: 8, luminosidade: Luminosidade.MEIA_SOMBRA, petFriendly: true, regaACadaDias: 3 },
  { nome: "Espada-de-são-jorge", especie: "Dracaena trifasciata", preco: 3990, estoque: 20, luminosidade: Luminosidade.SOMBRA, petFriendly: false, regaACadaDias: 14 },
  { nome: "Cacto-bola", especie: "Echinopsis calochlora", preco: 1990, estoque: 0, luminosidade: Luminosidade.SOL_PLENO, petFriendly: true, regaACadaDias: 15 },
  { nome: "Palmeira-areca", especie: "Dypsis lutescens", preco: 12900, estoque: 5, luminosidade: Luminosidade.SOL_PLENO, petFriendly: true, regaACadaDias: 5 },
  { nome: "Jiboia", especie: "Epipremnum aureum", preco: 2990, estoque: 0, luminosidade: Luminosidade.SOMBRA, petFriendly: false, regaACadaDias: 7 },
];

// Apaga as plantas que já existem e cadastra as de exemplo
const main = async () => {
  await prisma.planta.deleteMany();
  await prisma.planta.createMany({ data: plantas });
  console.log(`🌱 ${plantas.length} plantas de exemplo cadastradas.`);
};

main().finally(() => prisma.$disconnect());
