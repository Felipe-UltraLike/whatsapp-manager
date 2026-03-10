import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { z } from 'zod'

// Schema de validação para atualização de boleto
const updateBoletoSchema = z.object({
  nomeCliente: z.string().min(1, 'Nome do cliente é obrigatório').optional(),
  dataVencimento: z.string().transform((val) => new Date(val)).optional(),
  valor: z.number().positive('Valor deve ser positivo').optional()
})

// GET - Obter boleto por ID
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

    const boleto = await prisma.boleto.findUnique({
      where: { id },
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    if (!boleto) {
      return NextResponse.json({ error: 'Boleto não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    if (user.role !== 'SUPER_ADMIN' && boleto.empresaId !== user.empresaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json(boleto)
  } catch (error) {
    console.error('Erro ao obter boleto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar boleto
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

    const boletoExistente = await prisma.boleto.findUnique({
      where: { id }
    })

    if (!boletoExistente) {
      return NextResponse.json({ error: 'Boleto não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    if (user.role !== 'SUPER_ADMIN' && boletoExistente.empresaId !== user.empresaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateBoletoSchema.parse(body)

    const boletoAtualizado = await prisma.boleto.update({
      where: { id },
      data: {
        nomeCliente: validatedData.nomeCliente,
        dataVencimento: validatedData.dataVencimento,
        valor: validatedData.valor
      },
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    return NextResponse.json(boletoAtualizado)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Erro ao atualizar boleto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar boleto
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

    const boleto = await prisma.boleto.findUnique({
      where: { id }
    })

    if (!boleto) {
      return NextResponse.json({ error: 'Boleto não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    if (user.role !== 'SUPER_ADMIN' && boleto.empresaId !== user.empresaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await prisma.boleto.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Boleto deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar boleto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
