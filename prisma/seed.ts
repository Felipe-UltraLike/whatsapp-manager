import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed do banco de dados...')

  // Criar empresa padrão
  const empresa = await prisma.empresa.upsert({
    where: { id: 'empresa-padrao-001' },
    update: {},
    create: {
      id: 'empresa-padrao-001',
      nome: 'Empresa Padrão',
      maxInstances: 10
    }
  })

  console.log('Empresa criada:', empresa)

  // Criar usuário Super-Admin
  const senhaHash = await hash('admin123', 10)
  
  const superAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@system.com' },
    update: {},
    create: {
      id: 'super-admin-001',
      email: 'admin@system.com',
      nome: 'Administrador Principal',
      senha: senhaHash,
      role: 'SUPER_ADMIN',
      empresaId: empresa.id
    }
  })

  console.log('Super-Admin criado:', { ...superAdmin, senha: '[HIDDEN]' })

  // Criar usuário Admin de teste
  const adminSenhaHash = await hash('admin123', 10)
  
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      id: 'admin-001',
      email: 'admin@empresa.com',
      nome: 'Admin da Empresa',
      senha: adminSenhaHash,
      role: 'ADMIN',
      empresaId: empresa.id
    }
  })

  console.log('Admin criado:', { ...admin, senha: '[HIDDEN]' })

  // Criar usuário comum de teste
  const userSenhaHash = await hash('user123', 10)
  
  const user = await prisma.usuario.upsert({
    where: { email: 'user@empresa.com' },
    update: {},
    create: {
      id: 'user-001',
      email: 'user@empresa.com',
      nome: 'Usuário Comum',
      senha: userSenhaHash,
      role: 'USER',
      empresaId: empresa.id
    }
  })

  console.log('Usuário criado:', { ...user, senha: '[HIDDEN]' })

  console.log('Seed concluído com sucesso!')
  console.log('\nCredenciais de acesso:')
  console.log('Super-Admin: admin@system.com / admin123')
  console.log('Admin: admin@empresa.com / admin123')
  console.log('User: user@empresa.com / user123')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
