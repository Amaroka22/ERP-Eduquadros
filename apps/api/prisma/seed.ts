import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Cria usuário admin padrão (só se não existir)
  const existe = await prisma.usuario.findUnique({ where: { email: 'admin@eduquadros.com.br' } });

  if (!existe) {
    const senha = await bcrypt.hash('admin123', 12);
    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@eduquadros.com.br',
        senha,
        perfil: 'ADMIN',
        ativo: true,
      },
    });
    console.log('✅ Usuário admin criado: admin@eduquadros.com.br / admin123');
  } else {
    console.log('ℹ️  Usuário admin já existe, pulando.');
  }

  // AppState inicial vazio (só se não existir)
  const state = await prisma.appState.findUnique({ where: { id: 'default' } });
  if (!state) {
    await prisma.appState.create({
      data: { id: 'default', dados: {} },
    });
    console.log('✅ AppState inicial criado.');
  }

  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
