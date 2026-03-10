import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { z } from 'zod'

// Schema de validação para criação de boleto
const createBoletoSchema = z.object({
  nomeCliente: z.string().min(1, 'Nome do cliente é obrigatório'),
  dataVencimento: z.string().transform((val) => new Date(val)),
  valor: z.number().positive('Valor deve ser positivo'),
  empresaId: z.string().optional()
})

// GET - Listar boletos com filtro de data
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    // Se não houver datas, usar o mês atual
    let filtroData: { gte?: Date; lte?: Date } = {}
    
    if (dataInicio && dataFim) {
      filtroData = {
        gte: new Date(dataInicio),
        lte: new Date(dataFim)
      }
    } else {
      // Padrão: mês atual
      const hoje = new Date()
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
      filtroData = {
        gte: primeiroDia,
        lte: ultimoDia
      }
    }

    let boletos

    if (user.role === 'SUPER_ADMIN') {
      // Super-Admin vê todos os boletos
      boletos = await prisma.boleto.findMany({
        where: {
          dataVencimento: filtroData
        },
        include: {
          empresa: {
            select: { id: true, nome: true }
          }
        },
        orderBy: { dataVencimento: 'asc' }
      })
    } else {
      // Outros usuários veem apenas boletos da sua empresa
      boletos = await prisma.boleto.findMany({
        where: { 
          empresaId: user.empresaId,
          dataVencimento: filtroData
        },
        include: {
          empresa: {
            select: { id: true, nome: true }
          }
        },
        orderBy: { dataVencimento: 'asc' }
      })
    }

    return NextResponse.json(boletos)
  } catch (error) {
    console.error('Erro ao listar boletos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo boleto
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBoletoSchema.parse(body)

    // Determinar empresaId
    let empresaId: string
    
    if (user.role === 'SUPER_ADMIN') {
      if (!validatedData.empresaId) {
        return NextResponse.json({ error: 'Empresa é obrigatória para criar boleto.' }, { status: 400 })
      }
      empresaId = validatedData.empresaId
    } else {
      empresaId = user.empresaId
    }

    // Verificar se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId }
    })

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 })
    }

    // Criar boleto no banco de dados
    const boleto = await prisma.boleto.create({
      data: {
        nomeCliente: validatedData.nomeCliente,
        dataVencimento: validatedData.dataVencimento,
        valor: validatedData.valor,
        empresaId: empresaId
      },
      include: {
        empresa: {
          select: { id: true, nome: true }
        }
      }
    })

    return NextResponse.json(boleto, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Erro ao criar boleto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
