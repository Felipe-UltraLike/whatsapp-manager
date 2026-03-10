import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { hash } from 'bcryptjs'
import { z } from 'zod'

// Schema de validação para atualização de usuário
const updateUsuarioSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']).optional(),
  empresaId: z.string().min(1, 'Empresa é obrigatória').optional()
})

// GET - Obter usuário por ID (SUPER_ADMIN apenas)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const { id } = await params

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Remover senha da resposta
    const { senha, ...usuarioSemSenha } = usuario

    return NextResponse.json(usuarioSemSenha)
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar usuário (SUPER_ADMIN apenas)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUsuarioSchema.parse(body)

    // Verificar se o usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!usuarioExistente) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se está alterando email, verificar se já existe
    if (validatedData.email && validatedData.email !== usuarioExistente.email) {
      const emailExistente = await prisma.usuario.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExistente) {
        return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
      }
    }

    // Se está alterando empresa, verificar se existe
    if (validatedData.empresaId) {
      const empresa = await prisma.empresa.findUnique({
        where: { id: validatedData.empresaId }
      })

      if (!empresa) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 })
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: Record<string, unknown> = {}
    
    if (validatedData.email) dadosAtualizacao.email = validatedData.email
    if (validatedData.nome) dadosAtualizacao.nome = validatedData.nome
    if (validatedData.role) dadosAtualizacao.role = validatedData.role
    if (validatedData.empresaId) dadosAtualizacao.empresaId = validatedData.empresaId
    if (validatedData.senha) {
      dadosAtualizacao.senha = await hash(validatedData.senha, 10)
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: dadosAtualizacao,
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    // Remover senha da resposta
    const { senha, ...usuarioSemSenha } = usuario

    return NextResponse.json(usuarioSemSenha)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar usuário (SUPER_ADMIN apenas)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const { id } = await params

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permitir deletar a si mesmo
    if (user.id === id) {
      return NextResponse.json({ error: 'Não é possível deletar seu próprio usuário.' }, { status: 400 })
    }

    await prisma.usuario.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
