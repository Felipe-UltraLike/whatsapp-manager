import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { hash } from 'bcryptjs'
import { z } from 'zod'

// Schema de validação para criação de usuário
const createUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
  empresaId: z.string().min(1, 'Empresa é obrigatória')
})

// GET - Listar todos os usuários (SUPER_ADMIN apenas)
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas Super-Admin pode listar usuários.' }, { status: 403 })
    }

    const usuarios = await prisma.usuario.findMany({
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Remover senhas da resposta
    const usuariosSemSenha = usuarios.map(({ senha, ...usuario }) => usuario)

    return NextResponse.json(usuariosSemSenha)
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo usuário (SUPER_ADMIN apenas)
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas Super-Admin pode criar usuários.' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUsuarioSchema.parse(body)

    // Verificar se email já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: validatedData.email }
    })

    if (usuarioExistente) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    // Verificar se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: validatedData.empresaId }
    })

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 })
    }

    // Hash da senha
    const senhaHash = await hash(validatedData.senha, 10)

    const usuario = await prisma.usuario.create({
      data: {
        email: validatedData.email,
        nome: validatedData.nome,
        senha: senhaHash,
        role: validatedData.role,
        empresaId: validatedData.empresaId
      },
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    // Remover senha da resposta
    const { senha, ...usuarioSemSenha } = usuario

    return NextResponse.json(usuarioSemSenha, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
