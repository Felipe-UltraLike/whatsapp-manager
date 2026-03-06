import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { z } from 'zod'

// Schema de validação para atualização de empresa
const updateEmpresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  maxInstances: z.number().int().min(1, 'Máximo de instâncias deve ser pelo menos 1').optional()
})

// GET - Obter empresa por ID (SUPER_ADMIN apenas)
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

    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usuarios: true, instancias: true }
        }
      }
    })

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    return NextResponse.json(empresa)
  } catch (error) {
    console.error('Erro ao obter empresa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar empresa (SUPER_ADMIN apenas)
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
    const validatedData = updateEmpresaSchema.parse(body)

    // Verificar se a empresa existe
    const empresaExistente = await prisma.empresa.findUnique({
      where: { id }
    })

    if (!empresaExistente) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Se está reduzindo o limite, verificar se não viola instâncias existentes
    if (validatedData.maxInstances) {
      const instanciasAtivas = await prisma.instanciaWhatsApp.count({
        where: { empresaId: id }
      })

      if (instanciasAtivas > validatedData.maxInstances) {
        return NextResponse.json({ 
          error: `Não é possível reduzir o limite. A empresa possui ${instanciasAtivas} instâncias ativas.` 
        }, { status: 400 })
      }
    }

    const empresa = await prisma.empresa.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(empresa)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Erro ao atualizar empresa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar empresa (SUPER_ADMIN apenas)
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

    // Verificar se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usuarios: true, instancias: true }
        }
      }
    })

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Verificar se há usuários ou instâncias vinculados
    if (empresa._count.usuarios > 0 || empresa._count.instancias > 0) {
      return NextResponse.json({ 
        error: 'Não é possível deletar empresa com usuários ou instâncias vinculados.' 
      }, { status: 400 })
    }

    await prisma.empresa.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Empresa deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar empresa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
