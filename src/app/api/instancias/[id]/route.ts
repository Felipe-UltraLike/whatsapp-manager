import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { z } from 'zod'
import { deleteUazapiInstance, disconnectUazapiInstance } from '@/lib/uazapi'

// Schema de validação para atualização de instância
const updateInstanciaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional()
})

// GET - Obter instância por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const instancia = await prisma.instanciaWhatsApp.findUnique({
      where: { id },
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    if (!instancia) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
    }

    // Verificar permissão
    if (user.role !== 'SUPER_ADMIN' && instancia.empresaId !== user.empresaId) {
      return NextResponse.json({ error: 'Acesso negado a esta instância.' }, { status: 403 })
    }

    return NextResponse.json(instancia)
  } catch (error) {
    console.error('Erro ao obter instância:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar instância
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateInstanciaSchema.parse(body)

    // Verificar se a instância existe
    const instanciaExistente = await prisma.instanciaWhatsApp.findUnique({
      where: { id }
    })

    if (!instanciaExistente) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
    }

    // Verificar permissão
    if (user.role !== 'SUPER_ADMIN' && instanciaExistente.empresaId !== user.empresaId) {
      return NextResponse.json({ error: 'Acesso negado a esta instância.' }, { status: 403 })
    }

    const instancia = await prisma.instanciaWhatsApp.update({
      where: { id },
      data: validatedData,
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    return NextResponse.json(instancia)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Erro ao atualizar instância:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar instância
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar se a instância existe
    const instancia = await prisma.instanciaWhatsApp.findUnique({
      where: { id }
    })

    if (!instancia) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
    }

    // Verificar permissão
    if (user.role !== 'SUPER_ADMIN' && instancia.empresaId !== user.empresaId) {
      return NextResponse.json({ error: 'Acesso negado a esta instância.' }, { status: 403 })
    }

    // Desconectar e deletar da uaZapi
    await disconnectUazapiInstance(instancia.instanciaId)
    await deleteUazapiInstance(instancia.instanciaId)

    // Deletar do banco de dados
    await prisma.instanciaWhatsApp.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Instância deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar instância:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
